import { useId, useState, type RefObject } from 'react';
import { Icon } from '../../components/ui/Icon';
import type { RoomCaption } from './captions';
import { SignCaptions, SpeechCaptions } from './RoomCaptionSources';
import type { Participant } from './roomApi';

export type CaptionLine = RoomCaption & { senderId: string; id: number; expires: number };

export function RoomCaptions({ lines, participants, selfId, audioTrack, videoTrack, video, speech, sign, onSpeech, onSign, onCaption }: {
  lines: CaptionLine[];
  participants: Participant[];
  selfId: string;
  audioTrack?: MediaStreamTrack;
  videoTrack?: MediaStreamTrack;
  video: RefObject<HTMLVideoElement>;
  speech: boolean;
  sign: boolean;
  onSpeech: () => void;
  onSign: () => void;
  onCaption: (caption: RoomCaption) => void;
}) {
  const title = useId();
  const help = useId();
  const [show, setShow] = useState(true);
  const visible = lines.filter(line => participants.some(member => member.id === line.senderId));
  return <section className="room-captions" aria-labelledby={title}>
    <div className="room-captions-header">
      <h2 id={title}><Icon name="subtitles" /> Phụ đề trực tiếp</h2>
      <button type="button" className="room-caption-button" onClick={() => setShow(value => !value)}>
        {show ? 'Ẩn phụ đề' : 'Hiện phụ đề'}
      </button>
    </div>
    {show && <div className="room-caption-display">
      {!visible.length && <p className="room-caption-placeholder">Phụ đề sẽ xuất hiện khi có người bật và chia sẻ.</p>}
      <div role="log" aria-label="Phụ đề trong phòng" aria-relevant="additions">
        {visible.map(line => <div className="room-caption-line" key={line.id}>
          <span>{line.senderId === selfId ? 'Bạn' : participants.find(member => member.id === line.senderId)?.display_name}
            {' · '}{line.source === 'speech' ? 'Giọng nói' : 'Ký hiệu'}</span>
          <p>{line.text}</p>
        </div>)}
      </div>
    </div>}
    <div className="room-caption-actions" aria-describedby={help}>
      <button type="button" className="room-caption-button" aria-pressed={speech} disabled={!audioTrack} onClick={onSpeech}>
        <Icon name="mic" /> Giọng nói
      </button>
      <button type="button" className="room-caption-button" aria-pressed={sign} disabled={!videoTrack} onClick={onSign}>
        <Icon name="sign_language" /> Ký hiệu tay
      </button>
    </div>
    <p id={help} className="room-caption-help">
      Bật micro hoặc camera, rồi chọn nguồn phụ đề để chia sẻ chữ với cả phòng.
      Trình duyệt có thể gửi âm thanh tới dịch vụ nhận diện. Điểm khớp bàn tay được gửi tới VSL Connect để nhận diện từ.
    </p>
    {speech && audioTrack && <div className="room-caption-source-status"><SpeechCaptions key={audioTrack.id} track={audioTrack} onCaption={onCaption} /></div>}
    {sign && videoTrack && <SignCaptions key={videoTrack.id} video={video} track={videoTrack} onCaption={onCaption} />}
  </section>;
}
