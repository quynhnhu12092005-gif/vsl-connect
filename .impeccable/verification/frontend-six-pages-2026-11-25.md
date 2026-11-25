# Kiểm tra và hoàn thiện sáu khu vực frontend

Ngày: 25/11/2026. Thực hiện lần lượt: Tài khoản → Lộ trình → Từ điển → Luyện tập → Ôn tập → Admin.

Giữ React 18, TypeScript, Tailwind 3, Be Vietnam Pro, năm chủ đề và các hình ảnh đã duyệt. Không thay đổi backend, schema, cơ chế đăng nhập hay API nghiệp vụ trong đợt hoàn thiện sáu trang này.

| Khu vực | Vấn đề đã xử lý | Kiểm tra luồng |
| --- | --- | --- |
| Tài khoản | Tương phản nút, đường viền ô nhập, liên kết lỗi với trường và focus khi nhập sai | Sửa hồ sơ, số điện thoại sai, mật khẩu xác nhận không khớp, tải/căn ảnh đại diện, lỗi máy chủ, khách chưa đăng nhập |
| Lộ trình | Nhãn điều hướng/ô lọc, focus, bộ lọc trên điện thoại, ngắt nội dung dài | Tìm kiếm, lọc trình độ, không có kết quả, mở khóa/bài học/video, thử lại sau lỗi |
| Từ điển | Tương phản nút tìm kiếm/thử lại, viền và focus, thông báo số kết quả | Tìm bằng Enter/nút, xóa tìm kiếm, không có kết quả, lỗi và thử lại |
| Luyện tập | Tương phản tab/nút, tab bàn phím, bố cục tab trên điện thoại | Mũi tên/Home/End chỉ chuyển focus; Enter mới kích hoạt. Chọn video, từ chối camera, đổi chế độ giải phóng thiết bị |
| Ôn tập | Tương phản nút, đường viền điều khiển, trả focus về trò chơi đã mở | Khối hộp: chọn đáp án/đặt khối/tạm dừng; ghép đủ sáu cặp; Blast: trả lời/chuyển câu; thoát và thử lại khi lỗi |
| Admin | Tràn ngang, tên ô tìm kiếm, tương phản, vùng bảng cuộn bằng bàn phím; dialog gốc quản lý focus/Escape/nền; bỏ khung người học bao ngoài Admin | Tám mục quản trị, tạo khóa học lỗi/thử lại, Tab/Escape/click nền/trả focus, tìm thao tác bằng bàn phím, từ chối tài khoản learner |

## Kết quả

- Mỗi khu vực: 5 chủ đề × sáng/tối × 1440/390 px = 20 tổ hợp. Tổng 120 tổ hợp sau sửa: không tràn ngang toàn trang, không có lỗi JavaScript trang và không có lỗi tương phản trong các mẫu văn bản/điều khiển mà phép đo bao phủ.
- Các luồng chức năng bổ sung kiểm tra ở 320, 768, 1024 px; Admin có kiểm tra đường dẫn `/admin` trong hostname mô phỏng production và xác nhận chỉ một khung Admin.
- `npm.cmd run build`: thành công (TypeScript và Vite). Vẫn có cảnh báo bundle JavaScript lớn hơn 500 kB; chưa tách bundle trong phạm vi này.
- `npm.cmd run test:review`: 5/5 đạt.
- `npm.cmd run test:rooms`: 8/8 đạt.
- Impeccable `detect --changed --json`: kết quả `[]`.
- Đã xem ảnh chụp màn hình điện thoại chủ đề Họa sắc Việt ở chế độ tối cho từng khu vực.

## Phạm vi và giới hạn kiểm tra

Kiểm tra trình duyệt bằng Chromium trong Docker, API được giả lập trong bộ kiểm tra tạm ngoài mã nguồn sản phẩm. Video/camera dùng nội dung tổng hợp; không truy cập camera thật, không ghi lên database production và không đánh giá độ chính xác mô hình nhận diện. Không đưa dữ liệu giả vào sản phẩm.

Đây là kiểm tra responsive bằng kích thước viewport và bàn phím, chưa thay thế thử nghiệm trên điện thoại thật, Safari/Firefox, trình đọc màn hình hoặc kiểm tra WCAG đầy đủ. Các luồng OAuth, gửi email, gọi giữa hai mạng và quyền backend cần kiểm tra riêng với môi trường triển khai.

Các chỉnh sửa phòng gọi đã có trước đợt sáu trang được giữ lại; xem `rooms-polish-2026-11-25.md` và `docs/call-rooms.md`.
