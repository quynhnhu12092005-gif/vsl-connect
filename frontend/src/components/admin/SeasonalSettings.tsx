import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { WinterArtwork } from '../common/WinterArtwork';

export function SeasonalSettings({ csrfToken }: { csrfToken: string }) {
  const { seasonalAppearance, seasonalError, refreshSeasonalAppearance, saveSeasonalAppearance } = useTheme();
  const [draft, setDraft] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const enabled = seasonalAppearance?.winter_enabled ?? false;
  const selected = draft ?? enabled;

  async function save() {
    if (!seasonalAppearance || selected === enabled || saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await saveSeasonalAppearance(selected, csrfToken);
      setDraft(null);
      setNotice(selected ? 'Đã bật Mùa đông cho người dùng.' : 'Đã tắt giao diện Mùa đông.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu giao diện theo mùa.');
    } finally {
      setSaving(false);
    }
  }

  return <section aria-labelledby="seasonal-title" className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card">
    <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(10rem,32%)]">
      <div className="min-w-0 p-5 sm:p-6">
        <h3 id="seasonal-title" className="text-headline-sm">Giao diện theo mùa</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Mùa đông xuất hiện khi người dùng đăng nhập. Họ có thể đổi sang chủ đề yêu thích.
        </p>
        {seasonalError ? <div className="mt-4">
          <p role="alert" className="text-sm text-error">Không thể tải cài đặt giao diện theo mùa.</p>
          <button type="button" onClick={refreshSeasonalAppearance} className="mt-2 min-h-11 rounded-lg border border-outline px-3 text-sm font-semibold">Thử lại</button>
        </div> : seasonalAppearance ? <div className="mt-4">
          <label className="flex min-h-12 cursor-pointer items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={selected} disabled={saving} onChange={event => {
              setDraft(event.target.checked);
              setError('');
              setNotice('');
            }} className="h-5 w-5 shrink-0 accent-[var(--theme-accent)]" />
            Bật giao diện Mùa đông
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={saving || selected === enabled} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
              {saving ? 'Đang lưu…' : 'Lưu cài đặt theo mùa'}
            </button>
            <span className="text-xs text-on-surface-variant">{enabled ? 'Đang áp dụng' : 'Chưa áp dụng'}</span>
          </div>
        </div> : <p role="status" className="mt-4 text-sm text-on-surface-variant">Đang tải cài đặt…</p>}
        {error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}
        {notice && <p role="status" className="mt-3 text-sm text-on-surface-variant">{notice}</p>}
      </div>
      <WinterArtwork className="order-first min-h-32 sm:order-none" />
    </div>
  </section>;
}
