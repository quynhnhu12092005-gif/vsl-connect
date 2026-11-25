# VSL Connect — Ngữ cảnh sản phẩm

<!-- impeccable:product-schema 1 -->

Tài liệu này ghi lại mục đích và ràng buộc sản phẩm để agent sử dụng trong các lần thiết kế sau. Nội dung dựa trên yêu cầu người dùng đã xác nhận và mã nguồn hiện có; không phải chứng nhận chất lượng, khả năng tiếp cận hoặc trạng thái triển khai production. `rules.md` và yêu cầu trực tiếp của người dùng tiếp tục áp dụng.

## Platform

web

## Users

- Đối tượng chính đã được người dùng xác nhận: người khiếm thính và người học Ngôn ngữ ký hiệu Việt Nam (VSL).
- Ưu tiên sử dụng đã xác nhận: **học ký hiệu rồi thực hành**. Luồng học theo lộ trình, xem video, tra cứu và ôn tập dẫn tới thực hành cá nhân hoặc giao tiếp trong phòng gọi.
- Đối tượng quản trị hiện diện trong mã nguồn: quản trị viên quản lý nội dung học, ký hiệu, video và tài khoản theo phân quyền.
- Không suy diễn trình độ VSL, khả năng nghe/nói, mức độ đọc hiểu hoặc thiết bị của từng người dùng từ việc họ thuộc một nhóm đối tượng.

## Product Purpose

Giúp người dùng tiếp cận, học và ghi nhớ VSL bằng nội dung trực quan, sau đó có không gian thực hành. Người dùng cần tìm đúng bài hoặc ký hiệu, quan sát được video, hiểu thao tác tiếp theo và chủ động tham gia thực hành.

Thứ tự ưu tiên là học tập và khả năng sử dụng, rồi tới các chi tiết thể hiện bản sắc. Hình ảnh trang trí và hiệu ứng phải phục vụ trải nghiệm; không được làm khó việc nhìn ký hiệu hoặc thao tác.

Chưa có mục tiêu định lượng về hoàn thành bài, duy trì học tập, độ chính xác AI hay quy mô sử dụng được xác nhận; không tự tạo con số cho nội dung giao diện.

## Positioning

VSL Connect kết hợp lộ trình học, từ điển video, ôn tập tương tác và phòng thực hành trong một ứng dụng web tiếng Việt. Các chủ đề văn hóa Việt là bản sắc đã được người dùng chọn và cần bảo tồn.

Không mô tả sản phẩm là công cụ dịch toàn bộ VSL hoặc bảo đảm nhận diện mọi ký hiệu. Kết quả nhận diện chỉ có ý nghĩa trong phạm vi model và dữ liệu thực sự hỗ trợ, sau khi được đánh giá tương ứng.

## Operating Context

- Giao diện sản phẩm dùng tiếng Việt có dấu; tên riêng VSL Connect giữ nguyên.
- Người dùng điều hướng giữa học tập, tra cứu, luyện tập, ôn tập và giao tiếp. Thanh điều hướng chính và các lối quay lại phải giữ được mạch thao tác.
- Website được dùng trên trình duyệt máy tính và điện thoại; video, bàn tay và khuôn mặt là thông tin quan trọng trong quá trình học và gọi nhóm.
- Tài khoản cần thiết cho cá nhân hóa chủ đề và tham gia phòng gọi. Tình trạng đăng nhập phải được kiểm tra thực tế, không suy ra từ dữ liệu lưu trên trình duyệt.
- Camera và micro chỉ được yêu cầu khi người dùng khởi động chức năng cần chúng. Quyền trình duyệt có thể đã được cấp, bị chặn hoặc chưa được hỏi; trạng thái thiết bị phải được thể hiện đúng.
- Môi trường phát triển hiện có Docker Compose. Frontend cũng có lệnh Vite tại `frontend/package.json`; proxy `/api` của Vite trỏ tới backend cục bộ theo `frontend/vite.config.ts`.
- Cấu hình triển khai có Vercel Services, MySQL/TiDB và Cloudinary. Một cấu hình tồn tại trong repository không chứng minh dịch vụ ngoài đang hoạt động hoặc đã được thiết lập đầy đủ.

## Capabilities and Constraints

### Phạm vi có trong mã nguồn

| Khu vực | Khả năng và tuyến đường hiện có |
| --- | --- |
| Trang chủ | Giới thiệu và lối vào các hoạt động tại `/`. |
| Học tập | Lộ trình `/lo-trinh-hoc-tap`, chi tiết khóa học `/lo-trinh-hoc-tap/:slug`. Nội dung thực tế phụ thuộc dữ liệu đã xuất bản. |
| Từ điển | Tra cứu ký hiệu và video tại `/tu-dien-ky-hieu`. |
| Luyện tập | `/luyen-tap` có luồng video/camera và mã nguồn nhận diện. Phạm vi nhãn, model, chất lượng và khả năng hoạt động phải kiểm tra riêng. |
| Ôn tập | `/on-tap`: Khối hộp, Ghép thẻ, Blast; chọn chủ đề và nhịp chơi. Trò chơi dùng ký hiệu có video, không dựng kết quả học tập giả. |
| Công cụ giao tiếp | `/giao-tiep`: chọn từ vựng video và chuyển văn bản thành giọng nói khi cần. Âm thanh là lựa chọn hỗ trợ, không thay thế thông tin nhìn thấy được. |
| Phòng gọi | Trang tạo/tìm phòng `/giao-tiep/phong`, phòng cụ thể và link mời `/giao-tiep/phong/:code`. |
| Tài khoản | `/dang-nhap` và các component hồ sơ: đăng nhập/đăng ký, ảnh đại diện, thông tin cá nhân, mật khẩu và liên kết Google. Các dịch vụ OAuth/email cần cấu hình thật để dùng. |
| Quản trị | `/admin` ở môi trường triển khai; mã nguồn có xử lý riêng hostname localhost cho quản trị. Không tự thay đổi cách phân quyền hoặc địa chỉ này trong công việc thiết kế. |

### Phòng gọi

- Giữ phòng công khai/riêng tư, tối đa 6 người, yêu cầu đăng nhập; tham gia bằng mã hoặc link.
- Phòng riêng tư không nằm trong danh sách công khai. Người có mã hoặc link vẫn cần đăng nhập; không mô tả phòng như có cơ chế duyệt khách hoặc mật khẩu khi chưa triển khai.
- Người nhận lời mời chọn camera/micro trước khi vào. Bấm tích là chọn thiết bị; thao tác vào phòng mới xin quyền và mở thiết bị được chọn. Người tạo hiện vào với thiết bị tắt để tự bật khi sẵn sàng.
- Có giơ tay, ghim video, toàn màn hình, trạng thái kết nối và rời phòng. **Không thêm chat, ghi hình hoặc tải luồng cuộc gọi lên Cloudinary.**
- Người tạo rời đi không kết thúc cuộc gọi của người còn lại. Người cuối rời phòng làm phòng bị xóa; phiên mất kết nối có thời hạn khoảng 90 giây và dữ liệu hết hạn được dọn theo yêu cầu tiếp theo.
- Mã nguồn dùng WebRTC cho media và HTTP sync/SQL cho signaling. Không tự đổi kiến trúc trong một yêu cầu giao diện.
- Kết nối giữa mạng khác nhau có thể cần TURN; không hứa mọi thiết bị đều kết nối được chỉ với STUN.

### Ràng buộc kỹ thuật đã chốt

- Giữ React 18, TypeScript, Vite, Tailwind CSS 3 và React Router hiện tại. Không tự nâng major version, thay stack hoặc thêm UI framework để làm lại một màn hình.
- Backend hiện có FastAPI, SQLAlchemy và Alembic. Thay đổi giao diện phải giữ hợp đồng API, session, CSRF và phân quyền.
- Không đọc/ghi thông tin bí mật vào tài liệu thiết kế, không đưa khóa dịch vụ vào frontend hoặc `VITE_*`, không ghi hình hay lưu dữ liệu camera khi chưa có yêu cầu và sự đồng ý phù hợp.
- Không chạy migration, seed dữ liệu, triển khai production hoặc thay đổi cấu hình dịch vụ ngoài như tác dụng phụ của việc thiết kế.
- Nội dung học, ký hiệu và video phải lấy từ dữ liệu thực tế; trạng thái trống/lỗi cần nói rõ thay vì tạo nội dung, điểm số hoặc thành tích giả.

## Brand Commitments

- Giữ tên VSL Connect, logo, hình ảnh và tài sản văn hóa Việt hiện có.
- Ràng buộc trực tiếp của người dùng: giữ phông **Be Vietnam Pro** và cả 5 chủ đề: **Mặc định**, **Họa sắc Việt**, **Rối nước**, **Đông Hồ**, **Dấu ấn Việt Nam**.
- Giữ giao diện mặc định cho người chưa đăng nhập; tùy chọn chủ đề dành cho tài khoản đã đăng nhập theo `ThemeContext.tsx`.
- Duy trì khả năng dùng giao diện sáng/tối và điều khiển chuyển động nền. Không tự thay bộ hình ảnh, chọn lại phong cách, đổi phông hoặc hợp nhất các chủ đề trong bước tinh chỉnh.
- Tài liệu này chỉ ghi nhận các cam kết đã có, không xác lập bảng màu, token mới, bố cục mới hay component mới. Các chi tiết đó thuộc công việc tài liệu hóa hệ thống thiết kế sau này.

## Evidence on Hand

- Quy tắc dự án: `rules.md`. `README.md` ghi rõ nhiều phần là kế hoạch dự kiến; danh sách route cũ và các giai đoạn trong đó không phải bằng chứng tính năng hiện tại.
- Các route đang khai báo: `frontend/src/App.tsx`; phiên bản frontend: `frontend/package.json`; backend: `backend/requirements.txt` và `backend/app/main.py`.
- Chủ đề và điều kiện cá nhân hóa: `frontend/src/config/themes.ts`, `frontend/src/context/ThemeContext.tsx`; kiểu chữ và giao diện hiện có: `frontend/src/styles.css`, `frontend/src/themes.css`, `frontend/src/pages/themed-home.css`.
- Tài sản được giữ nguyên tại `frontend/src/assets/`: `vsl-connect-logo.png`, `vsl-hero-laptop.png`, `hoasac-hue.webp`, `puppets-water-theatre.webp`, `dongho-village.webp`, `heritage-landscapes.webp`.
- Luồng ôn tập: `frontend/src/pages/ReviewPage.tsx`, `frontend/src/features/review/`; tài khoản: `frontend/src/features/account/`.
- Phòng gọi: `frontend/src/features/rooms/`, `frontend/src/pages/RoomsPage.tsx`, `backend/app/rooms.py`, `docs/call-rooms.md`.
- Nhận diện: `frontend/src/components/camera/`, `backend/app/gesture.py` và model liên quan. Sự có mặt của mã nguồn không chứng minh độ chính xác hoặc chất lượng dịch VSL.
- Chưa có bằng chứng trong lần khởi tạo này về chuyên gia VSL phê duyệt toàn bộ nội dung, quyền sử dụng toàn bộ video/hình ảnh, số người dùng, giải thưởng, lời chứng thực, benchmark hoặc kiểm toán khả năng tiếp cận. Không tạo các tuyên bố đó.

## Product Principles

1. **Học rồi thực hành:** giúp người dùng tìm và quan sát ký hiệu, ôn tập và tiếp tục tới hoạt động thực hành phù hợp.
2. **Nhìn là hiểu trạng thái:** thông tin quan trọng, lỗi và phản hồi thao tác phải đọc/nhìn được, không chỉ nghe được hoặc nhận biết qua màu.
3. **Người dùng kiểm soát thiết bị:** lựa chọn, quyền truy cập và trạng thái camera/micro rõ ràng; dừng thiết bị khi không dùng.
4. **Nhất quán qua các chủ đề:** cá nhân hóa giữ bản sắc và hình ảnh đã chốt, đồng thời duy trì tên chức năng, ngữ nghĩa và cách thao tác quen thuộc.
5. **Trung thực và vừa đủ:** nội dung và kết quả có căn cứ; hiệu ứng không cản việc học, không tự mở rộng phạm vi sản phẩm.

## Accessibility & Inclusion

- Không dùng âm thanh làm kênh thông báo duy nhất. Khi có nội dung âm thanh, cần thông tin bằng chữ hoặc hình ảnh phù hợp với chức năng.
- Không che bàn tay, khuôn mặt và vùng chuyển động ký hiệu bằng nội dung trang trí hoặc điều khiển không cần thiết.
- Hỗ trợ bàn phím, focus nhìn thấy, tên điều khiển rõ ràng, nhãn biểu mẫu và phản hồi trạng thái thiết bị/kết nối.
- Kiểm tra khả năng đọc tiếng Việt có dấu, chữ dài, phóng to, bố cục điện thoại, cả chế độ sáng/tối và các chủ đề.
- Tôn trọng tùy chọn giảm chuyển động và quyền tắt hiệu ứng nền; không làm hiệu ứng cạnh tranh sự chú ý với video ký hiệu.
- Chưa có xác nhận kiểm toán hay tiêu chuẩn tuân thủ chính thức. Các nguyên tắc trên là yêu cầu sử dụng và kiểm tra, không phải tuyên bố đã đạt chứng nhận.

## Open Decisions

- Chưa xác nhận trình độ học viên mục tiêu theo bậc, chương trình giảng dạy hoặc tiêu chí chuyên môn để chứng nhận kết quả học.
- Chưa xác nhận quy trình kiểm duyệt VSL, tình trạng bản quyền từng tài sản và thước đo đánh giá model.
- Chưa xác nhận tiêu chí hiệu năng, accessibility và kết nối mạng định lượng để dùng như cam kết công khai.
- Luồng nhắn tin, ghi hình, dịch VSL liên tục hoặc mở rộng trên 6 người không thuộc phạm vi đã chốt; chỉ thay đổi khi có yêu cầu mới.
