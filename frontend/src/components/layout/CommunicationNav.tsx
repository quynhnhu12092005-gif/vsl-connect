import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { ROOMS_PATH } from '../../features/rooms/roomApi';

export function CommunicationNav() {
  return <nav aria-label="Chuyển mục giao tiếp" className="mx-auto flex max-w-[1440px] flex-wrap gap-2 px-5 pt-6 sm:px-8 lg:px-12 xl:px-16">
    {[{ to: '/giao-tiep', label: 'Công cụ giao tiếp', icon: 'forum', end: true },
      { to: ROOMS_PATH, label: 'Phòng gọi video', icon: 'video_call', end: false }].map(item =>
      <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) =>
        `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isActive ? 'border-transparent bg-primary-container text-on-primary' : 'border-surface-border bg-surface-card text-on-surface-variant hover:bg-surface-low'}`}>
        <Icon name={item.icon} className="text-[20px]" />{item.label}
      </NavLink>)}
  </nav>;
}
