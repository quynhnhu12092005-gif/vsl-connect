import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { RoomCall, type PeerView } from './RoomCall';
import { RoomCaptions, type CaptionLine } from './RoomCaptions';
import type { RoomCaption } from './captions';
import { ROOMS_PATH, readRoomCode, rememberRoomReturn, roomClientId, roomInvite, type MediaFlags, type Participant, type RoomState } from './roomApi';
import { useRoomSession } from './useRoomSession';
import './rooms.css';

const initialFlags: MediaFlags = { camera_on: false, microphone_on: false, hand_raised: false };

function VideoTile({ participant, stream, status, own, pinned, onPin, ownVideo }: {
  participant: Participant; stream?: MediaStream; status: RTCPeerConnectionState | 'self';
  own: boolean; pinned: boolean; onPin: () => void;
  ownVideo?: RefObject<HTMLVideoElement>;
}) {
  const internalVideo = useRef<HTMLVideoElement>(null);
  const video = ownVideo ?? internalVideo;
  const tile = useRef<HTMLElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    element.srcObject = stream ?? null;
    if (stream) void element.play().then(() => setBlocked(false)).catch(() => setBlocked(true));
    return () => { element.srcObject = null; };
  }, [stream, video]);
  const connected = own || status === 'connected';
  const connectionLabel = own ? 'Bạn' : status === 'failed' ? 'Chưa kết nối được' : status === 'disconnected' ? 'Kết nối gián đoạn' : connected ? 'Đã kết nối' : 'Đang kết nối…';
  return <article ref={tile} className={`room-video-tile${pinned ? ' pinned' : ''}${participant.hand_raised ? ' raised' : ''}`} aria-label={`${participant.display_name}${own ? ' (Bạn)' : ''}`}>
    <video ref={video} autoPlay playsInline muted={own} className={`${own ? 'mirror ' : ''}${!participant.camera_on ? 'camera-hidden' : ''}`} aria-label={`Video của ${participant.display_name}`} />
    {!participant.camera_on && <div className="room-video-placeholder">
      {participant.avatar_url ? <img src={participant.avatar_url} alt="" /> : <span>{participant.display_name.trim().charAt(0).toUpperCase()}</span>}
      <p>{own ? 'Camera của bạn đang tắt' : 'Camera đang tắt'}</p>
    </div>}
    <div className="room-tile-top"><span className={`room-connection-badge ${connected ? 'connected' : ''}`}><span />{connectionLabel}</span>
      {participant.hand_raised && <span className="room-raised-badge"><Icon name="front_hand" /> Đang giơ tay</span>}</div>
    <div className="room-tile-bottom"><span className="room-tile-name">{participant.display_name}{own && ' (Bạn)'}</span>
      <div><span title={participant.microphone_on ? 'Micro đang bật' : 'Micro đang tắt'}><Icon name={participant.microphone_on ? 'mic' : 'mic_off'} /></span>
        <button type="button" title={pinned ? 'Bỏ ghim khung hình' : 'Ghim khung hình'} aria-label={`${pinned ? 'Bỏ ghim' : 'Ghim'} ${participant.display_name}`} aria-pressed={pinned} onClick={onPin}><Icon name="push_pin" /></button>
        <button type="button" title="Toàn màn hình" aria-label={`Xem ${participant.display_name} toàn màn hình`} onClick={() => { void tile.current?.requestFullscreen?.().catch(() => undefined); }}><Icon name="fullscreen" /></button>
      </div>
    </div>
    {blocked && stream && !own && <button className="room-play-button" onClick={() => { void video.current?.play().then(() => setBlocked(false)).catch(() => undefined); }}><Icon name="play_arrow" /> Nhấn để phát video/âm thanh</button>}
  </article>;
}

export function MeetingRoomPage() {
  const { code: rawCode = '' } = useParams();
  const code = readRoomCode(rawCode);
  const { session, loading, error: sessionError, retry } = useRoomSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<RoomState | null>(null);
  const [peers, setPeers] = useState<PeerView[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [flags, setFlags] = useState<MediaFlags>(initialFlags);
  const [camera, setCamera] = useState(true);
  const [microphone, setMicrophone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [pinned, setPinned] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const [speechCaptions, setSpeechCaptions] = useState(false);
  const [signCaptions, setSignCaptions] = useState(false);
  const [captions, setCaptions] = useState<CaptionLine[]>([]);
  const captionId = useRef(0);
  const ownVideo = useRef<HTMLVideoElement>(null);
  const controller = useRef<RoomCall | null>(null);
  const alive = useRef(false);
  const joining = useRef(false);
  const autoJoined = useRef('');

  const addCaption = useCallback((senderId: string, caption: RoomCaption) => {
    const line = { ...caption, senderId, id: ++captionId.current, expires: Date.now() + 12_000 };
    setCaptions(previous => [...previous.filter(item => item.expires > Date.now()), line].slice(-3));
  }, []);
  const shareCaption = useCallback((caption: RoomCaption) => {
    const call = controller.current;
    if (!call) return;
    addCaption(call.clientId, caption);
    call.sendCaption(caption);
  }, [addCaption]);

  useEffect(() => {
    if (!captions.length) return;
    const expire = window.setTimeout(() => {
      setCaptions(lines => lines.filter(line => line.expires > Date.now()));
    }, Math.max(0, captions[0].expires - Date.now()));
    return () => window.clearTimeout(expire);
  }, [captions]);

  useEffect(() => {
    alive.current = true;
    setSnapshot(null); setPeers([]); setLocalStream(undefined); setFlags(initialFlags);
    setPinned(null); setError(''); setNotice(''); setBusy(false); setReconnecting(false);
    setCaptions([]); setSpeechCaptions(false); setSignCaptions(false);
    joining.current = false;
    const hide = () => controller.current?.close('', true);
    const wake = () => controller.current?.wake();
    window.addEventListener('pagehide', hide);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      alive.current = false;
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      controller.current?.close('', true);
      controller.current = null;
    };
  }, [code]);

  async function enter(withCamera = camera, withMicrophone = microphone) {
    if (!code || !session || joining.current || controller.current) return;
    joining.current = true; setBusy(true); setError(''); setNotice('');
    const call = new RoomCall(code, roomClientId(code), session, {
      snapshot: state => { if (alive.current && controller.current === call) setSnapshot(state); },
      peers: value => { if (alive.current && controller.current === call) setPeers(value); },
      local: (stream, value) => {
        if (!alive.current || controller.current !== call) return;
        setLocalStream(stream);
        setFlags(value);
        if (!value.microphone_on) setSpeechCaptions(false);
        if (!value.camera_on) setSignCaptions(false);
      },
      caption: (senderId, caption) => {
        if (alive.current && controller.current === call) addCaption(senderId, caption);
      },
      network: value => { if (alive.current && controller.current === call) setReconnecting(value); },
      notice: value => { if (alive.current && controller.current === call) setNotice(value); },
      ended: reason => {
        if (controller.current !== call) return;
        controller.current = null;
        if (alive.current) {
          setSnapshot(null); setPeers([]); setLocalStream(undefined); setFlags(initialFlags); setReconnecting(false);
          setCaptions([]); setSpeechCaptions(false); setSignCaptions(false);
          if (reason) setError(reason);
        }
      },
    });
    controller.current = call;
    try { await call.start(withCamera, withMicrophone); }
    catch (failure) {
      call.close();
      if (alive.current) setError(failure instanceof Error ? failure.message : 'Không tham gia được phòng. Hãy thử lại.');
    } finally {
      joining.current = false;
      if (alive.current) setBusy(false);
    }
  }

  useEffect(() => {
    const created = (location.state as { created?: boolean } | null)?.created;
    if (created && code && session && autoJoined.current !== code) {
      autoJoined.current = code;
      // Creating the room was an explicit join action. Start with devices off;
      // accessing either device still requires an explicit control click.
      void enter(false, false);
    }
  }, [code, session?.user.id, location.state]);

  useEffect(() => {
    if (!loading && !session) controller.current?.close('Vui lòng đăng nhập lại để tham gia phòng.');
  }, [loading, session?.user.id]);

  async function toggle(kind: 'video' | 'audio') {
    if (!controller.current || mediaBusy) return;
    setMediaBusy(true); setNotice('');
    try { await controller.current.toggle(kind); }
    catch { setNotice('Không bật được thiết bị. Hãy cho phép camera/micro trong trình duyệt và kiểm tra thiết bị đang kết nối.'); }
    finally { if (alive.current) setMediaBusy(false); }
  }

  async function copyInvite() {
    if (!code) return;
    try { await navigator.clipboard.writeText(roomInvite(code)); setCopied('Đã sao chép link mời.'); }
    catch { setCopied('Hãy chọn và sao chép link trong ô bên dưới.'); }
  }

  function leave() {
    controller.current?.close();
    navigate(ROOMS_PATH);
  }

  if (!code) return <div className="room-page"><div className="rooms-empty"><Icon name="link_off" /><h1>Link phòng không hợp lệ</h1><p>Kiểm tra lại lời mời hoặc nhập mã tại danh sách phòng.</p><Link className="rooms-button primary" to={ROOMS_PATH}>Về danh sách phòng</Link></div></div>;

  const participants = snapshot?.participants ?? [];
  const captionAudio = flags.microphone_on ? localStream?.getAudioTracks()[0] : undefined;
  const captionVideo = flags.camera_on ? localStream?.getVideoTracks()[0] : undefined;
  const visiblePinned = participants.some(member => member.id === pinned) ? pinned : null;
  return <div className="room-page">
    <header className="room-page-heading"><div><Link to={ROOMS_PATH} className="room-back"><Icon name="arrow_back" /> Danh sách phòng</Link>
      <h1>{snapshot?.room.title ?? 'Cùng nhau kết nối'}</h1>
      <p>{snapshot ? <><span className="rooms-live-dot" /> {participants.length}/6 người · {snapshot.room.visibility === 'private' ? 'Phòng riêng tư' : 'Phòng công khai'}</> : 'Tham gia cuộc gọi và giao tiếp bằng ký hiệu cùng bạn bè.'}</p></div>
      <button className="rooms-button secondary" onClick={copyInvite}><Icon name="link" /> Sao chép link mời</button></header>
    {copied && <p className="rooms-note" role="status">{copied}</p>}
    {error && <div className="rooms-alert" role="alert"><Icon name="error_outline" />{error}</div>}
    {notice && <div className="rooms-alert notice" role="status"><Icon name="info" />{notice}</div>}
    {loading ? <p className="rooms-note" role="status">Đang kiểm tra tài khoản…</p> : sessionError ?
      <div className="rooms-alert" role="alert">{sessionError}<button onClick={retry}>Thử lại</button></div> : !session ?
      <div className="room-prejoin"><span className="rooms-card-icon"><Icon name="lock" /></span><h2>Đăng nhập để gặp mọi người</h2><p>Lời mời sẽ được giữ lại để bạn quay về phòng sau khi đăng nhập.</p><Link className="rooms-button primary" to="/dang-nhap" onClick={() => rememberRoomReturn(code)}>Đăng nhập <Icon name="arrow_forward" /></Link></div> : !snapshot ?
      <div className="room-prejoin"><span className="rooms-card-icon"><Icon name="video_call" /></span><h2>Sẵn sàng gặp nhau?</h2>
        <p>Camera và micro chỉ được truy cập sau khi bạn nhấn tham gia. Bạn có thể vào để quan sát rồi bật thiết bị sau.</p>
        <span className="room-code">{code.slice(0, 5)}-{code.slice(5)}</span>
        <div className="room-device-options"><label><input type="checkbox" checked={camera} onChange={event => setCamera(event.target.checked)} disabled={busy} /><Icon name="videocam" />Bật camera khi vào</label><label><input type="checkbox" checked={microphone} onChange={event => setMicrophone(event.target.checked)} disabled={busy} /><Icon name="mic" />Bật micro khi vào</label></div>
        <button className="rooms-button primary" onClick={() => void enter(camera, microphone)} disabled={busy}>{busy ? 'Đang tham gia…' : 'Vào phòng'}<Icon name="arrow_forward" /></button>
        <Link className="room-back" to={ROOMS_PATH}>Quay lại danh sách phòng</Link>
      </div> : <>
      {reconnecting && <div className="rooms-alert notice" role="status"><Icon name="sync" />Kết nối đang gián đoạn. Đang tự kết nối lại; bạn không cần rời phòng.</div>}
      <div className="room-call-layout"><div className="room-video-column"><section aria-label="Video thành viên" className={`room-stage${visiblePinned ? ' has-pinned' : ''}${participants.length === 1 ? ' solo' : ''}`}>
        {participants.map(member => {
          const own = member.id === snapshot.self_id;
          const remote = peers.find(peer => peer.id === member.id);
          const participant = own ? { ...member, ...flags } : member;
          return <VideoTile key={member.id} participant={participant} stream={own ? localStream : remote?.stream}
            status={own ? 'self' : remote?.status ?? 'new'} own={own} pinned={visiblePinned === member.id}
            ownVideo={own ? ownVideo : undefined}
            onPin={() => setPinned(previous => previous === member.id ? null : member.id)} />;
        })}
        {participants.length === 1 && <div className="room-waiting"><Icon name="group_add" /><h2>Không gian đã sẵn sàng</h2><p>Gửi link mời để bạn bè tham gia. Khi có người vào, video sẽ xuất hiện tại đây.</p><button className="rooms-button secondary" onClick={copyInvite}>Mời bạn bè <Icon name="link" /></button></div>}
      </section>
      <RoomCaptions lines={captions} participants={participants} selfId={snapshot.self_id}
        audioTrack={captionAudio} videoTrack={captionVideo} video={ownVideo} speech={speechCaptions} sign={signCaptions}
        onSpeech={() => setSpeechCaptions(value => !value)} onSign={() => setSignCaptions(value => !value)}
        onCaption={shareCaption} />
      </div>
      <aside className="room-sidebar" aria-label="Thông tin phòng"><section><h2><Icon name="groups" /> Trong phòng <span>{participants.length}/6</span></h2>
        <ul>{participants.map(member => <li key={member.id}><button onClick={() => setPinned(previous => previous === member.id ? null : member.id)} aria-label={`Ghim video ${member.display_name}`}><span className="room-member-avatar">{member.display_name.trim().charAt(0).toUpperCase()}</span><span>{member.display_name}<small>{member.id === snapshot.self_id ? 'Bạn' : member.is_creator ? 'Người tạo phòng' : 'Thành viên'}</small></span>{(member.id === snapshot.self_id ? flags.hand_raised : member.hand_raised) && <Icon name="front_hand" className="room-hand-icon" />}</button></li>)}</ul>
      </section><section className="room-invite-panel"><h2><Icon name={snapshot.room.visibility === 'private' ? 'lock' : 'public'} /> Lời mời của bạn</h2><label>Mã phòng<span className="room-code">{code.slice(0, 5)}-{code.slice(5)}</span></label>
        <label>Link tham gia<input readOnly value={roomInvite(code)} onFocus={event => event.target.select()} /></label><button className="rooms-button secondary" onClick={copyInvite}><Icon name="content_copy" /> Sao chép link</button>
        <p>{snapshot.room.visibility === 'private' ? 'Phòng không xuất hiện trong danh sách công khai. Người có mã hoặc link có thể tham gia sau khi đăng nhập.' : 'Mọi người đã đăng nhập có thể tìm thấy phòng này.'}</p>
      </section></aside></div>
      <footer className="room-controls" aria-label="Điều khiển cuộc gọi">
        <div><button className={`room-control${flags.camera_on ? ' on' : ''}`} onClick={() => void toggle('video')} disabled={mediaBusy} aria-pressed={flags.camera_on}><Icon name={flags.camera_on ? 'videocam' : 'videocam_off'} /><span>{flags.camera_on ? 'Tắt camera' : 'Bật camera'}</span></button>
          <button className={`room-control${flags.microphone_on ? ' on' : ''}`} onClick={() => void toggle('audio')} disabled={mediaBusy} aria-pressed={flags.microphone_on}><Icon name={flags.microphone_on ? 'mic' : 'mic_off'} /><span>{flags.microphone_on ? 'Tắt micro' : 'Bật micro'}</span></button>
          <button className={`room-control${flags.hand_raised ? ' hand-on' : ''}`} onClick={() => controller.current?.raiseHand()} aria-pressed={flags.hand_raised}><Icon name="front_hand" /><span>{flags.hand_raised ? 'Hạ tay' : 'Giơ tay'}</span></button>
          <button className="room-control" onClick={() => controller.current?.reconnect()}><Icon name="sync" /><span>Kết nối lại</span></button></div>
        <button className="room-control room-leave" onClick={leave}><Icon name="call_end" /><span>Rời phòng</span></button>
      </footer>
      <p className="room-lifecycle-note">Phòng tự kết thúc khi người cuối rời đi. Phiên mất kết nối sẽ hết hạn sau khoảng 90 giây.</p>
    </>}
  </div>;
}
