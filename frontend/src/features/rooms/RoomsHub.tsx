import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/ui/Icon';
import { createRoom, listRooms, readRoomCode, rememberRoomClient, rememberRoomReturn, roomPath, type RoomSummary } from './roomApi';
import { useRoomSession } from './useRoomSession';
import './rooms.css';

export function RoomsHub() {
  const { session, loading, error: sessionError, retry } = useRoomSession();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const createId = useRef<string | null>(null);
  useEffect(() => {
    if (!session) { setRooms([]); return; }
    const controller = new AbortController();
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const result = await listRooms(controller.signal);
        if (active) { setRooms(result); setError(''); }
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : 'Không tải được danh sách phòng.');
      } finally {
        if (active) { setLoadingRooms(false); timer = setTimeout(load, 10_000); }
      }
    };
    setLoadingRooms(true);
    void load();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [session?.user.id, refresh]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!session || busy) return;
    setBusy(true); setError('');
    try {
      createId.current ??= crypto.randomUUID();
      const result = await createRoom(title.trim(), visibility, createId.current, session);
      rememberRoomClient(result.room.code, createId.current);
      navigate(roomPath(result.room.code), { state: { created: true } });
      createId.current = null;
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Không tạo được phòng.'); }
    finally { setBusy(false); }
  }

  function join(event: FormEvent) {
    event.preventDefault();
    const code = readRoomCode(invite);
    if (!code) { setError('Nhập mã phòng gồm 10 ký tự hoặc dán link mời hợp lệ.'); return; }
    navigate(roomPath(code));
  }

  return <section className="rooms-hub" aria-labelledby="rooms-heading">
    <header className="rooms-hub-header">
      <div><span className="rooms-eyebrow"><span className="rooms-live-dot" /> Gặp nhau bằng ký hiệu</span>
        <h2 id="rooms-heading">Một căn phòng. Nhiều kết nối.</h2>
        <p>Tạo không gian trò chuyện qua video, hoặc tham gia cùng bạn bè bằng mã phòng và link mời.</p></div>
      <span className="rooms-capacity"><Icon name="groups" /> Tối đa 6 người</span>
    </header>
    {loading ? <p role="status" className="rooms-note">Đang kiểm tra tài khoản…</p> : sessionError ?
      <div className="rooms-alert" role="alert">{sessionError} <button onClick={retry}>Thử lại</button></div> : !session ?
      <div className="rooms-guest"><Icon name="video_call" /><div><h3>Kết nối cùng mọi người</h3><p>Đăng nhập để tạo phòng hoặc tham gia cuộc gọi. Camera chỉ bật khi bạn cho phép.</p></div>
        <Link className="rooms-button primary" to="/dang-nhap" onClick={() => rememberRoomReturn()}>Đăng nhập để tham gia <Icon name="arrow_forward" /></Link></div> : <>
      <div className="rooms-entry-grid">
        <form className="rooms-entry-card" onSubmit={submit}>
          <span className="rooms-card-icon"><Icon name="add_circle" /></span><h3>Tạo phòng của bạn</h3>
          <label>Tên phòng<input required maxLength={80} placeholder="Ví dụ: Cùng luyện ký hiệu hôm nay" value={title} onChange={event => setTitle(event.target.value)} disabled={busy} /></label>
          <fieldset className="rooms-visibility"><legend>Ai có thể tìm thấy phòng?</legend>
            <label className={visibility === 'public' ? 'selected' : ''}><input type="radio" name="room-visibility" value="public" checked={visibility === 'public'} onChange={() => setVisibility('public')} disabled={busy} /><Icon name="public" /><span><strong>Công khai</strong><small>Hiển thị trong danh sách phòng</small></span></label>
            <label className={visibility === 'private' ? 'selected' : ''}><input type="radio" name="room-visibility" value="private" checked={visibility === 'private'} onChange={() => setVisibility('private')} disabled={busy} /><Icon name="lock" /><span><strong>Riêng tư</strong><small>Tham gia bằng mã hoặc link mời</small></span></label>
          </fieldset>
          <button className="rooms-button primary" disabled={busy || !title.trim()}>{busy ? 'Đang tạo phòng…' : 'Tạo phòng'}<Icon name="arrow_forward" /></button>
        </form>
        <form className="rooms-entry-card rooms-join-card" onSubmit={join}>
          <span className="rooms-card-icon"><Icon name="link" /></span><h3>Bạn đã có lời mời?</h3><p>Dán link bạn bè gửi hoặc nhập mã phòng để cùng tham gia.</p>
          <label>Mã phòng hoặc link mời<input required maxLength={2048} autoComplete="off" placeholder="Nhập mã hoặc dán link tại đây" value={invite} onChange={event => setInvite(event.target.value)} /></label>
          <button className="rooms-button secondary" disabled={!invite.trim()}>Tìm phòng <Icon name="arrow_forward" /></button>
          <div className="rooms-join-tip"><Icon name="sign_language" /><p>Giữ đôi tay và khuôn mặt trong khung hình để mọi người dễ quan sát ký hiệu của bạn.</p></div>
        </form>
      </div>
      {error && <div className="rooms-alert" role="alert">{error}<button onClick={() => setRefresh(value => value + 1)}>Thử lại</button></div>}
      <div className="rooms-list-heading"><div><h3>Phòng đang mở</h3><p>Gặp gỡ và giao tiếp cùng cộng đồng.</p></div><button className="rooms-button subtle" onClick={() => setRefresh(value => value + 1)} disabled={loadingRooms}><Icon name="refresh" /> Làm mới</button></div>
      {loadingRooms && !rooms.length ? <p className="rooms-note" role="status">Đang tìm phòng…</p> : !rooms.length ?
        <div className="rooms-empty"><Icon name="meeting_room" /><h4>Chưa có phòng công khai</h4><p>Hãy tạo phòng đầu tiên hoặc tham gia bằng lời mời của bạn bè.</p></div> :
        <div className="rooms-list">{rooms.map(room => <article className="rooms-public-card" key={room.code}>
          <span className="rooms-public-badge"><span className="rooms-live-dot" /> Đang mở</span><h4>{room.title}</h4>
          <p><Icon name="groups" />{room.participant_count}/{room.max_participants} người tham gia</p>
          {room.participant_count >= room.max_participants ? <span className="rooms-full">Phòng đã đủ người</span> : <Link className="rooms-button secondary" to={roomPath(room.code)}>Tham gia <Icon name="arrow_forward" /></Link>}
        </article>)}</div>}
    </>}
  </section>;
}
