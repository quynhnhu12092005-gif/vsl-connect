# Phòng gọi video VSL Connect

## Chức năng

Mở **Giao tiếp** sau khi đăng nhập để tạo phòng công khai hoặc riêng tư. Phòng có tối đa **6 tài khoản**, tham gia bằng mã 10 ký tự hoặc link `/giao-tiep/phong/{code}`. Phòng riêng tư không xuất hiện trong danh sách; ai có lời mời và tài khoản đều có thể tham gia. Không có chat, ghi hình hay tải video cuộc gọi lên Cloudinary.

Người tạo vào phòng với camera/micro tắt. Người nhận lời mời chọn thiết bị trước khi vào. Có thể bật/tắt camera, micro, giơ tay, ghim video, xem toàn màn hình và kết nối lại. Khi tắt thiết bị hoặc rời phòng, ứng dụng dừng track camera/micro.

Người tạo rời đi không kết thúc cuộc gọi của những người còn lại. Người cuối nhấn **Rời phòng** sẽ xóa phòng, thành viên và tín hiệu kết nối. Khi đóng tab, ứng dụng gửi yêu cầu rời bằng beacon. Nếu máy tắt đột ngột hoặc mạng mất hẳn, phiên hết hạn sau 90 giây; phòng không còn khả dụng và bản ghi được dọn khi có yêu cầu phòng tiếp theo. Không có tác vụ nền thường trực trên Vercel. Tab bị hệ điều hành ngừng chạy quá lâu có thể cần tham gia lại.

## Kiến trúc và giới hạn

- WebRTC truyền video/âm thanh trực tiếp giữa trình duyệt hoặc qua TURN khi mạng yêu cầu. FastAPI/MySQL không nhận nội dung video.
- Signaling dùng HTTP sync khoảng 1,8 giây/lượt và dữ liệu dùng chung trong SQL để chạy được trên nhiều instance Vercel. Đổi lại, có độ trễ khi vào/rời phòng và phát sinh truy vấn DB đều đặn. Không cần Redis hay sticky session. Đây là lựa chọn cho nhóm nhỏ tối đa 6 người.
- Mỗi người có tối đa 5 kết nối WebRTC. Chất lượng thực tế phụ thuộc CPU/băng thông, đặc biệt điện thoại và 4G. Ứng dụng yêu cầu hình 960×540/20 fps, giới hạn gửi khoảng 900 kbps mỗi peer; trình duyệt có thể điều chỉnh. Cần SFU nếu mở rộng số người hoặc tải cao hơn.
- API yêu cầu session đăng nhập, CSRF cho thao tác ghi, khóa hàng SQL khi tham gia, giới hạn tạo/join/lấy TURN 20 lượt/tài khoản/phút, giới hạn tín hiệu 240/phút/thành viên. Tín hiệu SDP/ICE hết hạn sau 120 giây và bị xóa khi truy cập phòng hoặc xóa phòng; không log payload.
- Cần HTTPS (localhost được trình duyệt cho phép), quyền camera/micro và TURN để tăng khả năng kết nối qua Wi-Fi/4G/tường lửa. Build thành công chưa xác nhận kết nối qua mọi mạng.

## Cấu hình TURN quản lý sẵn: Cloudflare

Phù hợp khi backend ở Vercel và chưa có VPS. Không cần chuyển domain website sang Cloudflare. Đây là dịch vụ bên ngoài; kiểm tra hạn mức và giá trong tài khoản trước khi bật. Dự án không tự tạo tài nguyên hay kích hoạt thanh toán.

1. Tạo/đăng nhập tài khoản Cloudflare, chọn account của bạn.
2. Mở trang **Realtime / TURN** từ [Dashboard TURN chính thức](https://dash.cloudflare.com/?to=/:account/calls). Nếu giao diện có nhiều sản phẩm, chọn **TURN**, không tạo phòng RealtimeKit/SFU.
3. Tạo **TURN key** (đặt tên `vsl-connect`). Lưu **TURN Key ID** và **API Token** của key. Đây không phải Cloudflare Global API Key và không phải username/password TURN dùng trực tiếp trong trình duyệt.
4. Điền trực tiếp vào `.env` trên máy, không gửi token trong chat:

```dotenv
RTC_TURN_PROVIDER=cloudflare
CLOUDFLARE_TURN_KEY_ID=<TURN_KEY_ID>
CLOUDFLARE_TURN_API_TOKEN=<API_TOKEN_CUA_TURN_KEY>
RTC_STUN_URLS=stun:stun.cloudflare.com:3478
RTC_TURN_URLS=
RTC_TURN_SECRET=
```

5. Trên **Vercel → project vsl-connect → Environment Variables**, thêm cùng các biến trên cho backend ở Production. Không dùng tiền tố `VITE_` cho key/token. Preview nên có key riêng nếu cần gọi thử. Chọn **Redeploy** sau khi lưu biến.
6. Backend gọi Cloudflare để cấp thông tin TURN tạm thời 2 giờ cho người đã đăng nhập. Trình duyệt chỉ nhận thông tin tạm thời; ứng dụng tự làm mới trước khi hết hạn.
7. Đăng nhập website rồi mở `/api/v1/rooms/ice`. Kết quả phải có `relay_configured: true` và URL `turn:`/`turns:`. Đừng công khai phản hồi vì có credential tạm thời. `503` nghĩa là cấu hình thiếu hoặc Cloudflare chưa trả cấu hình hợp lệ.
8. Thử một tài khoản trên máy dùng Wi-Fi, tài khoản khác trên điện thoại dùng 4G. Tạo phòng riêng tư, gửi link, bật camera. Kiểm tra nhìn thấy nhau, giơ tay và rời phòng. Muốn chứng minh TURN thực sự được dùng, xem selected candidate pair có `candidateType: relay` trong `chrome://webrtc-internals` hoặc `edge://webrtc-internals`; kết nối thành công cùng Wi-Fi có thể chỉ dùng đường trực tiếp.

API sử dụng theo [Generate Credentials của Cloudflare](https://developers.cloudflare.com/realtime/turn/generate-credentials/). Xem [hạn mức/giá TURN hiện hành](https://developers.cloudflare.com/realtime/turn/faq/) trước khi dùng rộng rãi. Chưa có key thật thì chỉ kiểm thử được luồng cấu hình giả lập và kết nối trực tiếp; cần bước 8 để xác nhận mạng thực tế.

## Nếu đã có coturn trên VPS

Chọn `RTC_TURN_PROVIDER=coturn`. Máy chủ coturn phải bật `use-auth-secret` và `static-auth-secret`. Điền secret tương ứng ở backend, không đưa vào frontend:

```dotenv
RTC_TURN_PROVIDER=coturn
RTC_STUN_URLS=stun:turn.example.com:3478
RTC_TURN_URLS=turn:turn.example.com:3478?transport=udp,turn:turn.example.com:3478?transport=tcp,turns:turn.example.com:5349?transport=tcp
RTC_TURN_SECRET=<STATIC_AUTH_SECRET_CUA_COTURN>
CLOUDFLARE_TURN_KEY_ID=
CLOUDFLARE_TURN_API_TOKEN=
```

`turn.example.com` là domain VPS có IP công khai. Mở cổng listener và dải relay UDP theo cấu hình coturn; dùng chứng chỉ TLS hợp lệ cho `turns:`. Vercel không chạy coturn UDP. Chỉ điền URL không tạo ra máy chủ TURN. Nếu chưa có VPS, dùng phương án Cloudflare phía trên.

## Đưa thay đổi lên môi trường thật

1. Sao lưu database trước migration. Kiểm tra `.env` local trỏ đúng database định dùng; không chạy seed/demo lên dữ liệu thật.
2. Migration mới là `g15d_call_rooms`, chỉ thêm 4 bảng phòng. Chạy migration bằng image backend **đã build từ code mới**:

```powershell
docker compose build backend
docker compose run --rm --no-deps backend alembic upgrade head
```

Nếu đang dùng TiDB, giữ CHECK constraints bật như hướng dẫn [TiDB](tidb-deployment.md). Lệnh trên dùng cấu hình database trong `.env`; Vercel và local phải trỏ cùng database nếu muốn migrate cho production. Khi `docker` chưa có trong PATH, dùng đường dẫn `docker.exe` đã cài trên máy.

3. Thêm cấu hình TURN vào Vercel, commit/push code lên fork `main` khi sẵn sàng, chờ deployment Ready. Không tải `.env` lên GitHub.
4. Kiểm tra `/health/ready`, đăng nhập và thử công khai/riêng tư, mã/link mời, người thứ 7 bị từ chối, chủ phòng rời nhưng người khác vẫn gọi, cuối cùng rời thì mã không dùng lại được.
5. Thử Wi-Fi ↔ 4G và Safari/iPhone/Edge thật trước khi mời nhiều người. Các thử nghiệm Chromium/camera giả không thay thế kiểm tra thiết bị và TURN thật.

## Kiểm thử tự động

`backend/tests/test_rooms.py` dùng SQLite tạm, kiểm tra xác thực/CSRF, riêng tư, phân tách tín hiệu, giới hạn 6, hết hạn, xóa phòng, giới hạn lượt và cấp TURN. Không dùng TiDB/email/Cloudinary thật.

```sh
cd backend
python -m pytest tests/test_rooms.py -q
```

Kiểm tra frontend: `cd frontend && npm ci && npm run build` (TypeScript + Vite). Toàn bộ backend còn có các kiểm thử Cloudinary của phần code cũ; xem kết quả thực tế thay vì coi build frontend là xác nhận toàn bộ hệ thống.
