import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { saveProfile, type AuthSession, type AdminUser } from '../../services/adminApi';
import { Icon } from '../../components/ui/Icon';

export function ProfileDetails({ session, onSaved }: { session: AuthSession; onSaved: (session: AuthSession) => void }) {
  const { user } = session;
  const [name, setName] = useState(user.display_name);
  const [gender, setGender] = useState(user.gender || '');
  const [phone, setPhone] = useState(user.phone_number || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [invalidField, setInvalidField] = useState<'name' | 'phone' | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const errorId = useId();
  useEffect(() => { setName(user.display_name); setGender(user.gender || ''); setPhone(user.phone_number || ''); }, [user.display_name, user.gender, user.phone_number]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice(''); setInvalidField(null);
    if (!name.trim()) { setError('Tên hiển thị không được để trống.'); setInvalidField('name'); nameInput.current?.focus(); return; }
    const normalizedPhone = phone.replace(/[\s().-]/g, '');
    if (normalizedPhone && !/^\+?[0-9]{8,15}$/.test(normalizedPhone)) { setError('Số điện thoại cần từ 8 đến 15 chữ số, có thể bắt đầu bằng +.'); setInvalidField('phone'); phoneInput.current?.focus(); return; }
    setBusy(true);
    try {
      const updated = await saveProfile({ display_name: name.trim(), gender: (gender || null) as AdminUser['gender'], phone_number: phone.trim() || null }, session.csrf_token);
      onSaved({ ...session, user: updated }); setNotice('Đã lưu thông tin tài khoản.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể lưu thông tin.'); }
    finally { setBusy(false); }
  }
  return <section className="account-card" aria-labelledby="account-info-title">
    <div className="account-card-heading"><span><Icon name="badge" /></span><div><h2 id="account-info-title">Thông tin tài khoản</h2><p>Cập nhật thông tin để mọi người nhận ra bạn.</p></div></div>
    <form className="account-form" onSubmit={submit}>
      <fieldset disabled={busy} aria-describedby={error ? errorId : undefined}>
        <label>Tên hiển thị<input ref={nameInput} aria-invalid={invalidField === 'name' || undefined} aria-describedby={invalidField === 'name' ? errorId : undefined} required maxLength={120} autoComplete="name" value={name} onChange={event => setName(event.target.value)} /></label>
        <label>Email đăng nhập<input type="email" value={user.email} readOnly /></label>
        <div className="account-form-grid">
          <label>Giới tính<select aria-label="Giới tính" value={gender} onChange={event => setGender(event.target.value)}><option value="">Chưa cung cấp</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option><option value="prefer_not_to_say">Không muốn chia sẻ</option></select></label>
          <label>Số điện thoại<input ref={phoneInput} aria-invalid={invalidField === 'phone' || undefined} aria-describedby={invalidField === 'phone' ? errorId : undefined} type="tel" autoComplete="tel" inputMode="tel" maxLength={32} placeholder="Ví dụ: 0912345678" value={phone} onChange={event => setPhone(event.target.value)} /></label>
        </div>
        <p className="account-field-hint">Giới tính và số điện thoại là thông tin không bắt buộc.</p>
        <button className="account-button" type="submit">{busy ? 'Đang lưu…' : 'Lưu thông tin'}</button>
      </fieldset>
      {error && <p id={errorId} role="alert" className="account-message account-message--error">{error}</p>}
      {notice && <p role="status" className="account-message">{notice}</p>}
    </form>
  </section>;
}
