# Kiểm chứng polish /giao-tiep/phong

Ngày: 25/11/2026. Đối chiếu audit `.impeccable/audit/2026-11-25T07-46-00Z__frontend-src-pages-roomspage-tsx.md`.

## Thay đổi

- Chữ chức năng trong rooms hub dùng `--text-accent`, nền nút chính dùng `--accent-700`; viền điều khiển dùng `--outline`. Không đổi palette nhận diện hoặc CSS chức năng của phòng đang gọi.
- Tách lỗi tạo phòng, mã mời và danh sách. Lỗi mã mời gắn với input bằng aria-describedby/aria-invalid và focus; polling không xóa lỗi biểu mẫu. Nút thử tạo lại giữ nguyên client_id idempotency.
- Lỗi tải danh sách có nút tải lại riêng; không hiển thị empty state khi chưa lấy được dữ liệu. Danh sách cũ được ghi rõ có thể chưa cập nhật nếu refresh lỗi.
- Không render artwork mặc định vốn bị ẩn ở FeaturePageBanner. Giữ ảnh gốc, thêm bản logo PNG 132×132 lấy từ chính ảnh gốc, bảo toàn tỷ lệ và alpha; dùng cho header/footer có kích thước hiển thị 44/36px.
- Tăng nút chọn chủ đề, sáng/tối và menu lên vùng chạm cao 44px. Tăng tương phản tab giao tiếp đang chọn bằng token primary-container.
- Không thêm dependency, không sửa backend, API/session, RoomCall hoặc luồng camera/micro trong lượt polish này. Các thay đổi sẵn có của người dùng vẫn giữ nguyên.

## Kiểm tra đã chạy

- `docker build -t vsl-rooms-polish:local frontend`: thành công; thực thi `tsc -b && vite build`. Còn cảnh báo bundle JS lớn hơn 500 kB từ Vite; không sửa cấu trúc tải toàn ứng dụng trong phạm vi này.
- Detector nguồn Impeccable trên RoomsHub.tsx, rooms.css và FeaturePageBanner.tsx: `[]`.
- Chromium 156, Playwright, API giả lập; **20 tổ hợp** năm chủ đề × sáng/tối × desktop 1440×900 / điện thoại 390×844.
- Các chữ được đo: nhãn phòng, nút Tham gia đang hoạt động, nút tạo phòng đang hoạt động, nội dung input, mô tả radio và tab giao tiếp đang chọn. Tương phản thấp nhất **4,98:1**; không phải tuyên bố mọi chữ trong toàn bộ app đã được đo.
- Viền input với nền trong/ngoài thấp nhất **4,26:1**. Nút header đo được 44×44 hoặc 46×44px.
- Không tràn ngang trong ma trận chính và các viewport bổ sung 320,480,700,760,768,1000,1024,1280px ở tổ hợp được chọn.
- Lỗi mã còn sau refresh và hơn 10 giây polling; sửa input xóa lỗi phù hợp.
- Lỗi tạo phòng còn sau refresh; thử tạo lại giữ cùng client_id, gửi đúng tên/phòng riêng tư, đến phòng và rời về danh sách thành công.
- Link mời dẫn tới phòng; lỗi danh sách không bị coi là empty; thử tải lại thành công mới hiện empty; khách chỉ có chủ đề Mặc định và CTA đăng nhập.
- Menu phản hồi tap tổng hợp; Escape đóng hộp chọn chủ đề và trả focus; reduced-motion áp dụng. Không có pageerror trong lượt kiểm tra.
- Phiên Mặc định tải ảnh **21.460 bytes**, trước là **2.422.091 bytes**: giảm khoảng **99,1%** cho phần ảnh này. Không còn request laptop bị ẩn; không phải cam kết giảm 99,1% tổng payload, tổng thời gian tải hoặc mọi chủ đề.
- Đã đọc ảnh chụp desktop/mobile và trạng thái lỗi. Bằng chứng/script tạm tại `%TEMP%/vsl-rooms-audit-20261125/`, kết quả chính `polish-results.json`.

## Giới hạn

Kiểm tra browser dùng dữ liệu/API giả lập, không thay đổi dữ liệu thật. Chưa kiểm chứng lại trên Safari/Firefox/Edge riêng, điện thoại vật lý, screen reader hoặc gọi qua hai mạng thật. Chưa commit, push hoặc deploy Vercel. Đây là kiểm chứng sửa các finding đã biết, không phải audit mới hay chứng nhận WCAG toàn ứng dụng.
