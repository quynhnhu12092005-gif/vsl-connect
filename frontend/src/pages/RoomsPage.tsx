import { CommunicationNav } from '../components/layout/CommunicationNav';
import { FeaturePageBanner } from '../components/ui/FeaturePageBanner';
import { RoomsHub } from '../features/rooms/RoomsHub';

export function RoomsPage() {
  return <div className="overflow-hidden bg-surface-card pb-10 dark:bg-slate-950">
    <FeaturePageBanner eyebrow="Không gian kết nối" title="Phòng gọi video" description="Tạo phòng riêng của bạn, tham gia bằng lời mời hoặc gặp gỡ cộng đồng qua video ký hiệu." icon="video_call" />
    <CommunicationNav />
    <RoomsHub />
  </div>;
}
