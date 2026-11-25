type DeviceKind = 'video' | 'audio';
type Devices = Pick<MediaDevices, 'getUserMedia'>;

export function roomVideoConstraints(): MediaTrackConstraints {
  return { width: { ideal: 960 }, height: { ideal: 540 },
    frameRate: { ideal: 20, max: 24 }, facingMode: 'user' };
}

function errorName(error: unknown): string {
  return error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
}

export async function requestRoomDevice(kind: DeviceKind, devices: Devices | undefined = navigator.mediaDevices): Promise<MediaStream> {
  if (!devices?.getUserMedia) throw new DOMException('Media capture unavailable', 'NotSupportedError');
  try {
    return await devices.getUserMedia({
      video: kind === 'video' ? roomVideoConstraints() : false,
      audio: kind === 'audio' ? { echoCancellation: true, noiseSuppression: true } : false,
    });
  } catch (error) {
    // Some cameras cannot satisfy frame-rate/facing-mode constraints. Retrying
    // with the device default does not retry or bypass a permission denial.
    if (!['OverconstrainedError', 'ConstraintNotSatisfiedError'].includes(errorName(error))) throw error;
    return devices.getUserMedia({ video: kind === 'video', audio: kind === 'audio' });
  }
}

function deviceFailure(kind: DeviceKind, error: unknown): string {
  const device = kind === 'video' ? 'camera' : 'micro';
  switch (errorName(error)) {
    case 'NotAllowedError': case 'PermissionDeniedError': case 'SecurityError':
      return `Chưa được cấp quyền ${device}. Hãy cho phép ${device} trong cài đặt trang web của trình duyệt rồi bật lại.`;
    case 'NotFoundError': case 'DevicesNotFoundError':
      return `Không tìm thấy ${device}. Hãy kiểm tra thiết bị đang kết nối.`;
    case 'NotReadableError': case 'TrackStartError': case 'AbortError':
      return `Chưa mở được ${device}. Hãy kiểm tra thiết bị hoặc đóng ứng dụng khác đang sử dụng thiết bị đó.`;
    case 'NotSupportedError':
      return `Trình duyệt chưa cho phép truy cập ${device} tại địa chỉ này. Hãy dùng HTTPS và kiểm tra quyền thiết bị.`;
    default:
      return `Chưa mở được ${device}. Hãy kiểm tra quyền và thiết bị rồi bật lại trong phòng.`;
  }
}

/** Request only selected devices; failure of one must not disable the other. */
export async function startRoomDevices(
  camera: boolean, microphone: boolean, onStream: (stream: MediaStream) => void,
  devices: Devices | undefined = navigator.mediaDevices,
): Promise<string[]> {
  const selected: DeviceKind[] = [];
  if (camera) selected.push('video');
  if (microphone) selected.push('audio');
  const results = await Promise.all(selected.map(async kind => {
    try {
      const stream = await requestRoomDevice(kind, devices);
      onStream(stream);
      return '';
    } catch (error) {
      return deviceFailure(kind, error);
    }
  }));
  return results.filter(Boolean);
}
