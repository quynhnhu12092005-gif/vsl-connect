import { ApiError, type AuthSession } from '../../services/adminApi';
import { requestRoomDevice, startRoomDevices } from './roomMedia';
import { CAPTION_CHANNEL, readCaption, type RoomCaption } from './captions';
import { joinRoom, leaveRoom, roomIce, sendRoomSignal, syncRoom,
  type MediaFlags, type Participant, type RoomSignal, type RoomState, type SignalKind } from './roomApi';

export type PeerView = { id: string; stream: MediaStream; status: RTCPeerConnectionState };
type Peer = PeerView & {
  pc: RTCPeerConnection; video: RTCRtpSender | null; audio: RTCRtpSender | null;
  pendingIce: RTCIceCandidateInit[]; offering: boolean;
  captions?: RTCDataChannel;
};
type CallEvents = {
  snapshot: (state: RoomState) => void;
  peers: (peers: PeerView[]) => void;
  local: (stream: MediaStream, flags: MediaFlags) => void;
  network: (reconnecting: boolean) => void;
  notice: (message: string) => void;
  ended: (reason: string) => void;
  caption: (senderId: string, caption: RoomCaption) => void;
};

/** One browser connection. All room state lives on the server, not in a singleton. */
export class RoomCall {
  readonly localStream = new MediaStream();
  private readonly peers = new Map<string, Peer>();
  private flags: MediaFlags = { camera_on: false, microphone_on: false, hand_raised: false };
  private timer: ReturnType<typeof setTimeout> | undefined;
  private iceTimer: ReturnType<typeof setTimeout> | undefined;
  private abort: AbortController | undefined;
  private closed = false;
  private cursor = 0;
  private failures = 0;
  private lastSuccess = Date.now();
  private iceServers: RTCIceServer[] = [];
  private sending: Promise<void> = Promise.resolve();
  private polling = false;

  constructor(readonly code: string, readonly clientId: string, private session: AuthSession, private events: CallEvents) {}

  async start(camera: boolean, microphone: boolean) {
    if (!window.isSecureContext || typeof RTCPeerConnection === 'undefined') {
      throw new Error('Trình duyệt chưa hỗ trợ cuộc gọi tại địa chỉ này. Hãy mở website qua HTTPS.');
    }
    // Start permission requests directly from the join action, before network
    // requests. Publish each available device even if the other device fails.
    const failures = await startRoomDevices(camera, microphone, stream => {
      if (this.closed) { stream.getTracks().forEach(track => track.stop()); return; }
      stream.getTracks().forEach(track => this.attachLocalTrack(track));
      this.publishLocal();
    });
    if (this.closed) return;
    if (failures.length) this.events.notice(failures.join(' '));
    this.publishLocal();
    const ice = await roomIce();
    if (this.closed) return;
    this.iceServers = ice.ice_servers;
    this.scheduleIceRefresh(ice.expires_in);
    const state = await joinRoom(this.code, this.clientId, this.session);
    if (this.closed) { void leaveRoom(this.code, this.clientId, this.session).catch(() => undefined); return; }
    this.lastSuccess = Date.now();
    await this.applySnapshot(state);
    if (!this.closed) this.schedule(100);
  }

  private scheduleIceRefresh(ttl: number) {
    clearTimeout(this.iceTimer);
    this.iceTimer = setTimeout(() => { void this.refreshIce(); }, Math.max(60, ttl - 300) * 1000);
  }

  private async refreshIce() {
    try {
      const ice = await roomIce();
      if (this.closed) return;
      this.iceServers = ice.ice_servers;
      for (const peer of this.peers.values()) {
        peer.pc.setConfiguration({ ...peer.pc.getConfiguration(), iceServers: this.iceServers });
      }
      this.scheduleIceRefresh(ice.expires_in);
    } catch {
      if (!this.closed) this.iceTimer = setTimeout(() => { void this.refreshIce(); }, 30_000);
    }
  }

  private attachLocalTrack(track: MediaStreamTrack) {
    this.localStream.addTrack(track);
    track.onended = () => {
      this.localStream.removeTrack(track);
      this.publishLocal();
      for (const peer of this.peers.values()) {
        const sender = track.kind === 'video' ? peer.video : peer.audio;
        void sender?.replaceTrack(null).catch(() => undefined);
      }
    };
  }

  private publishLocal() {
    this.flags.camera_on = this.localStream.getVideoTracks().some(track => track.readyState === 'live' && track.enabled);
    this.flags.microphone_on = this.localStream.getAudioTracks().some(track => track.readyState === 'live' && track.enabled);
    if (!this.closed) this.events.local(new MediaStream(this.localStream.getTracks()), { ...this.flags });
  }

  async toggle(kind: 'video' | 'audio') {
    if (this.closed) return;
    const previous = this.localStream.getTracks().filter(track => track.kind === kind);
    if (previous.length) {
      previous.forEach(track => { this.localStream.removeTrack(track); track.stop(); });
      this.publishLocal();
      await Promise.all([...this.peers.values()].map(peer =>
        (kind === 'video' ? peer.video : peer.audio)?.replaceTrack(null).catch(() => undefined)));
    } else {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Không truy cập được camera/micro. Hãy kiểm tra quyền trình duyệt.');
      const stream = await requestRoomDevice(kind);
      if (this.closed) { stream.getTracks().forEach(track => track.stop()); return; }
      for (const track of stream.getTracks()) {
        this.attachLocalTrack(track);
        await Promise.all([...this.peers.values()].map(peer =>
          (kind === 'video' ? peer.video : peer.audio)?.replaceTrack(track).catch(() => undefined)));
      }
    }
    this.publishLocal();
    this.wake();
  }

  raiseHand() {
    this.flags.hand_raised = !this.flags.hand_raised;
    this.publishLocal();
    this.wake();
  }

  private publishPeers() {
    if (!this.closed) this.events.peers([...this.peers.values()].map(({ id, stream, pc }) => ({ id, stream, status: pc.connectionState })));
  }

  sendCaption(caption: RoomCaption) {
    const message = JSON.stringify(caption);
    for (const peer of this.peers.values()) {
      const channel = peer.captions;
      if (channel?.readyState !== 'open' || channel.bufferedAmount > 4096) continue;
      try { channel.send(message); } catch { /* A closing peer no longer receives captions. */ }
    }
  }

  private attachCaptionChannel(peer: Peer, channel: RTCDataChannel) {
    if (channel.label !== CAPTION_CHANNEL || peer.captions) {
      channel.close();
      return;
    }
    peer.captions = channel;
    const lastReceived = { speech: -Infinity, sign: -Infinity };
    channel.onmessage = event => {
      if (this.closed || this.peers.get(peer.id) !== peer) return;
      const now = performance.now();
      const caption = readCaption(event.data);
      if (!caption || now - lastReceived[caption.source] < 150) return;
      lastReceived[caption.source] = now;
      this.events.caption(peer.id, caption);
    };
  }

  private signal(recipient: string, kind: SignalKind, data: object) {
    // Preserve SDP/candidate ordering and retry transient delivery errors.
    const task = this.sending.then(async () => {
      for (let attempt = 0; attempt < 3 && !this.closed; attempt++) {
        try {
          await sendRoomSignal(this.code, this.clientId, this.session, recipient, kind, data);
          return;
        } catch (error) {
          if (error instanceof ApiError && [401, 403, 404, 410, 422].includes(error.status)) return;
          if (attempt === 2) { this.events.network(true); return; }
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    });
    this.sending = task.catch(() => undefined);
    return task;
  }

  private ensurePeer(member: Participant): Peer {
    const previous = this.peers.get(member.id);
    if (previous) return previous;
    const pc = new RTCPeerConnection({ iceServers: this.iceServers, bundlePolicy: 'max-bundle' });
    const offerer = this.clientId < member.id;
    const video = offerer ? pc.addTransceiver('video', {
      direction: 'sendrecv', sendEncodings: [{ maxBitrate: 900_000, maxFramerate: 20 }],
    }).sender : null;
    const audio = offerer ? pc.addTransceiver('audio', { direction: 'sendrecv' }).sender : null;
    const peer: Peer = { id: member.id, pc, stream: new MediaStream(), status: 'new',
      video, audio, pendingIce: [], offering: false };
    this.peers.set(member.id, peer);
    pc.ondatachannel = event => this.attachCaptionChannel(peer, event.channel);
    if (offerer) this.attachCaptionChannel(peer, pc.createDataChannel(CAPTION_CHANNEL, { maxPacketLifeTime: 2000 }));
    pc.onicecandidate = event => { if (event.candidate) void this.signal(member.id, 'ice', event.candidate.toJSON()); };
    pc.ontrack = event => {
      if (!peer.stream.getTrackById(event.track.id)) peer.stream.addTrack(event.track);
      event.track.onunmute = () => this.publishPeers();
      this.publishPeers();
    };
    pc.onconnectionstatechange = () => this.publishPeers();
    // A deterministic offerer avoids glare when both browsers enter together.
    pc.onnegotiationneeded = () => { if (this.clientId < member.id) void this.offer(peer); };
    this.publishPeers();
    return peer;
  }

  private async bindSenders(peer: Peer) {
    // The answerer must use the transceivers created by the remote offer.
    // Pre-creating its own with addTransceiver leaves its tracks on unused m-lines.
    for (const transceiver of peer.pc.getTransceivers()) {
      transceiver.direction = 'sendrecv';
      if (transceiver.receiver.track.kind === 'video') {
        peer.video = transceiver.sender;
        await peer.video.replaceTrack(this.localStream.getVideoTracks()[0] ?? null);
        const parameters = peer.video.getParameters();
        if (parameters.encodings.length) {
          parameters.encodings[0].maxBitrate = 900_000;
          parameters.encodings[0].maxFramerate = 20;
          await peer.video.setParameters(parameters).catch(() => undefined);
        }
      } else {
        peer.audio = transceiver.sender;
        await peer.audio.replaceTrack(this.localStream.getAudioTracks()[0] ?? null);
      }
    }
  }

  private async offer(peer: Peer) {
    if (this.closed || peer.offering || peer.pc.signalingState !== 'stable') return;
    peer.offering = true;
    try {
      await this.bindSenders(peer);
      await peer.pc.setLocalDescription(await peer.pc.createOffer());
      if (peer.pc.localDescription) await this.signal(peer.id, 'offer', peer.pc.localDescription.toJSON());
    } catch { /* connection status and retry control remain visible */ }
    finally { peer.offering = false; }
  }

  private async receive(signal: RoomSignal) {
    const peer = this.peers.get(signal.sender_id);
    if (!peer || this.closed) return;
    const pc = peer.pc;
    if (signal.kind === 'restart') {
      if (this.clientId < peer.id) { pc.restartIce(); await this.offer(peer); }
      return;
    }
    if (signal.kind === 'ice') {
      const candidate = signal.data as RTCIceCandidateInit;
      if (pc.remoteDescription) await pc.addIceCandidate(candidate);
      else peer.pendingIce.push(candidate);
      return;
    }
    if (signal.kind === 'offer') {
      if (this.clientId < peer.id) return;
      if (pc.signalingState !== 'stable') await pc.setLocalDescription({ type: 'rollback' });
      await pc.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
      await this.bindSenders(peer);
      await pc.setLocalDescription(await pc.createAnswer());
      if (pc.localDescription) await this.signal(peer.id, 'answer', pc.localDescription.toJSON());
    } else {
      if (pc.signalingState !== 'have-local-offer') return;
      await pc.setRemoteDescription(signal.data as RTCSessionDescriptionInit);
    }
    for (const candidate of peer.pendingIce.splice(0)) {
      try { await pc.addIceCandidate(candidate); } catch { /* stale ICE after restart */ }
    }
  }

  private async applySnapshot(state: RoomState) {
    if (this.closed) return;
    const members = new Set(state.participants.map(member => member.id));
    for (const [id, peer] of this.peers) {
      if (!members.has(id)) { peer.pc.close(); this.peers.delete(id); }
    }
    for (const member of state.participants) if (member.id !== this.clientId) this.ensurePeer(member);
    this.events.snapshot(state);
    this.publishPeers();
    for (const signal of state.signals) {
      if (signal.id <= this.cursor) continue;
      try { await this.receive(signal); } catch { /* one invalid/stale signal must not block room sync */ }
      this.cursor = signal.id;
    }
    this.cursor = Math.max(this.cursor, state.cursor);
  }

  private schedule(delay: number) {
    clearTimeout(this.timer);
    if (!this.closed) this.timer = setTimeout(() => void this.poll(), delay);
  }

  wake = () => { if (!this.polling) this.schedule(0); };

  private async poll() {
    if (this.closed || this.polling) return;
    this.polling = true;
    this.abort = new AbortController();
    const timeout = setTimeout(() => this.abort?.abort(), 12_000);
    let delay = 1800;
    try {
      const state = await syncRoom(this.code, this.clientId, this.session, this.cursor, { ...this.flags }, this.abort.signal);
      if (this.closed) return;
      this.lastSuccess = Date.now();
      this.failures = 0;
      this.events.network(false);
      await this.applySnapshot(state);
      delay = state.signals.length >= 100 ? 100 : state.poll_interval_ms;
    } catch (error) {
      if (this.closed) return;
      if (error instanceof ApiError && [401, 403, 404, 410].includes(error.status)) {
        this.close(error.status === 401 ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' : 'Phòng đã kết thúc hoặc phiên tham gia không còn hiệu lực.');
        return;
      }
      this.events.network(true);
      delay = Math.min(8000, 1000 * 2 ** Math.min(++this.failures, 3));
      if (Date.now() - this.lastSuccess > 85_000) this.close('Mất kết nối quá lâu. Hãy kiểm tra mạng và tham gia lại.');
    } finally {
      clearTimeout(timeout);
      this.polling = false;
      if (!this.closed) this.schedule(delay);
    }
  }

  reconnect() {
    for (const peer of this.peers.values()) {
      if (this.clientId < peer.id) { peer.pc.restartIce(); void this.offer(peer); }
      else void this.signal(peer.id, 'restart', {});
    }
    this.wake();
  }

  close(reason = '', beacon = false) {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.timer);
    clearTimeout(this.iceTimer);
    this.abort?.abort();
    for (const peer of this.peers.values()) {
      peer.pc.ontrack = null; peer.pc.onicecandidate = null;
      peer.pc.ondatachannel = null;
      peer.pc.onconnectionstatechange = null; peer.pc.onnegotiationneeded = null;
      peer.pc.close();
    }
    this.peers.clear();
    this.localStream.getTracks().forEach(track => { track.onended = null; track.stop(); });
    void leaveRoom(this.code, this.clientId, this.session, beacon).catch(() => undefined);
    this.events.ended(reason);
  }
}
