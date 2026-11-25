---
name: VSL Connect
description: Hệ thống giao diện hiện có — Nhịp học và kết nối.
colors:
  default-accent: "#059669"
  default-secondary: "#14b8a6"
  default-highlight: "#10b981"
  default-paper: "#ffffff"
  default-ink: "#0f172a"
  default-border: "rgb(226 232 240)"
  default-muted: "rgb(71 85 105)"
  default-elevated: "rgb(247 252 250)"
  default-dark-app: "rgb(9 13 22)"
  default-dark-card: "rgb(17 24 39)"
  default-dark-ink: "rgb(249 250 251)"
  patterns-accent: "#a72b69"
  patterns-secondary: "#199baf"
  patterns-gold: "#d8a338"
  patterns-paper: "#fff8f3"
  patterns-ink: "#342333"
  puppets-accent: "#146b83"
  puppets-secondary: "#c24d50"
  puppets-gold: "#dfad43"
  puppets-paper: "#f2f9f8"
  puppets-ink: "#163842"
  dongho-accent: "#aa402b"
  dongho-secondary: "#416249"
  dongho-gold: "#c39229"
  dongho-paper: "#f8f1de"
  dongho-ink: "#383326"
  heritage-accent: "#ae382d"
  heritage-secondary: "#2461a2"
  heritage-gold: "#c59421"
  heritage-paper: "#fff8e9"
  heritage-ink: "#382d26"
  error-light: "rgb(185 28 28)"
  error-container-light: "rgb(254 226 226)"
  error-dark: "rgb(248 113 113)"
  error-container-dark: "rgb(127 29 29)"
typography:
  headline-xl:
    fontFamily: "'Be Vietnam Pro', Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.02em"
  headline-lg:
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  headline-md:
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.015em"
  headline-sm:
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
  body-lg:
    fontSize: "16px"
    lineHeight: "24px"
  body-md:
    fontSize: "14px"
    lineHeight: "20px"
  label-md:
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
  label-sm:
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
  code-sm:
    fontFamily: "'Space Mono', monospace"
    fontSize: "12px"
    lineHeight: "16px"
rounded:
  default: "0.75rem"
  patterns: "1.25rem"
  puppets: "1.75rem"
  dongho: "0.625rem"
  heritage: "0.875rem"
  room-control: "11px"
  room-card: "22px"
  full: "9999px"
spacing:
  2: "0.5rem"
  3: "0.75rem"
  4: "1rem"
  5: "1.25rem"
  6: "1.5rem"
  8: "2rem"
components:
  room-button-primary:
    backgroundColor: "var(--room-accent)"
    textColor: "#ffffff"
    rounded: "{rounded.room-control}"
    padding: "0.65rem 1.1rem"
  room-button-secondary:
    backgroundColor: "color-mix(in srgb, var(--room-accent) 7%, rgb(var(--surface-card)))"
    textColor: "var(--room-accent)"
    rounded: "{rounded.room-control}"
    padding: "0.65rem 1.1rem"
  account-button:
    backgroundColor: "var(--theme-accent)"
    textColor: "#ffffff"
    rounded: "{rounded.default}"
    padding: "0.7rem 1rem"
  account-button-hover:
    backgroundColor: "var(--accent-700)"
  room-input:
    backgroundColor: "rgb(var(--surface-app))"
    textColor: "rgb(var(--text-primary))"
    rounded: "{rounded.room-control}"
    padding: "0.8rem 0.9rem"
  surface-card:
    backgroundColor: "rgb(var(--surface-card))"
    rounded: "{rounded.default}"
  progress-track:
    backgroundColor: "rgb(var(--surface-elevated))"
    rounded: "{rounded.full}"
    height: "0.5rem"
---

# Design System: VSL Connect

## Overview

**Creative North Star: "Nhịp học và kết nối"**

Sinh động, gần gũi, nhiều khám phá: bản sắc văn hóa Việt hiện diện qua hình ảnh và biến thể chủ đề, trong khi nội dung học, video ký hiệu và hành động tiếp theo vẫn là trọng tâm. Định hướng và ngôn ngữ mô tả này đã được người dùng xác nhận; tài liệu ghi nhận giao diện hiện có, không đề xuất một diện mạo thay thế.

Nút, thẻ và ô nhập mang cảm giác **gần gũi, dễ nhận biết, thao tác rõ ràng**. Hệ thống dùng **phân lớp nhẹ, bóng mềm giúp nhận biết khối nội dung**. Các trang chức năng ưu tiên đọc nhanh và thao tác; trang chủ cho phép hình ảnh văn hóa thể hiện cá tính của từng chủ đề.

**Key Characteristics:**

- Chung Be Vietnam Pro cho nội dung, tiêu đề và điều khiển của cả năm chủ đề.
- Một hệ token ngữ nghĩa, năm bảng màu và biến thể bố cục; hỗ trợ sáng/tối độc lập với lựa chọn chủ đề.
- Hình ảnh hiện có là tài sản được giữ nguyên; chuyển động nền có lựa chọn tắt.
- Trạng thái quan trọng có chữ hoặc biểu tượng phù hợp, không phụ thuộc duy nhất vào âm thanh hay màu.

**Cơ sở ghi nhận:** mã nguồn tại thời điểm tài liệu hóa ngày 25/11/2026. Đây là trích xuất tĩnh từ frontend, không phải báo cáo đã kiểm thử toàn bộ màn hình trên trình duyệt. Các token trên là giá trị khai báo; CSS theo phạm vi có thể ghi đè kích thước, chiều cao dòng và hình dạng.

**Nguồn áp dụng:** `PRODUCT.md`, `rules.md`, `frontend/tailwind.config.js`, `frontend/src/styles.css`, `frontend/src/themes.css`, `frontend/src/components/layout/themed-shell.css`, `frontend/src/pages/themed-home.css`, các component và CSS tính năng được dẫn ở dưới. Tệp thiết kế trong `frontend/stitch_vsl_connect_edtech_platform/` là tài liệu tham khảo riêng; phông Plus Jakarta Sans trong đó không thay thế Be Vietnam Pro đang triển khai.

## Colors

Bảng màu mặc định dùng xanh ngọc trên nền sáng; bốn chủ đề văn hóa dùng màu giấy và mực ấm hoặc xanh nước. Các mã trong frontmatter lấy từ CSS đang áp dụng, không lấy thay bằng màu minh họa của thẻ xem trước.

### Primary

| Chủ đề / ID | Tên màu nhấn | Token frontmatter | Nguồn runtime |
| --- | --- | --- | --- |
| Mặc định / `default` | Xanh ngọc | `default-accent` | `--theme-accent` |
| Họa sắc Việt / `patterns` | Hồng sen | `patterns-accent` | `--theme-accent` |
| Rối nước / `puppets` | Xanh nước | `puppets-accent` | `--theme-accent` |
| Đông Hồ / `dongho` | Đỏ gạch | `dongho-accent` | `--theme-accent` |
| Dấu ấn Việt Nam / `heritage` | Đỏ son | `heritage-accent` | `--theme-accent` |

Màu nhấn dùng cho hành động chính, mục điều hướng đang chọn, focus và chi tiết nhận diện. `--accent-600` theo màu nhấn; `--text-accent` dùng sắc đậm `--accent-700` ở sáng và sắc sáng `--accent-300` ở tối.

### Secondary

Các token `*-secondary` là màu phối: xanh ngọc lam ở Mặc định, lam ngọc ở Họa sắc Việt, đỏ sơn mài ở Rối nước, xanh lá ở Đông Hồ và xanh lam ở Dấu ấn Việt Nam. Dùng cho hình ảnh, icon và chi tiết chủ đề; không mặc định đồng nghĩa với thành công hoặc lỗi.

### Tertiary

Các token `*-gold` là vàng ấm dùng trong họa tiết và khung minh họa. Mặc định dùng `default-highlight` xanh sáng thay vai trò điểm nhấn này. Không đổi màu trạng thái lỗi để chạy theo màu trang trí.

### Neutral

- `*-paper` và `*-ink` mô tả giấy/mực của chủ đề. Nền trang, thẻ và chữ thực tế lấy từ các token RGB `--surface-*`, `--text-primary`, `--text-secondary`, `--outline-*`.
- Với chế độ tối, CSS đổi nền, thẻ, chữ và viền; không chỉ đảo màu toàn trang. Mặc định có bộ tối riêng, các chủ đề văn hóa có bộ nền tối riêng theo selector.
- Màu lỗi dùng `error-light` / `error-dark` và `error-container-*`; giữ ý nghĩa trạng thái tách biệt với bảng màu chủ đề.
- Tailwind ánh xạ cả `emerald` và `teal` vào thang `--accent-*`, cả `slate` và `gray` vào `--neutral-*`. Những tên utility này không đảm bảo một màu cố định khi đổi chủ đề.
- Thang mặc định là các giá trị cố định trong `themes.css`. Thang văn hóa dùng `color-mix(in srgb, ...)`; giữ công thức và tỷ lệ trong mã nguồn thay vì quy đổi thành một bộ hex gần đúng khác.

**The Semantic Color Rule.** Sử dụng token ngữ nghĩa và trạng thái; không chép màu của một chủ đề vào component dùng chung. `config/themes.ts` chứa màu preview có một số giá trị vàng/mực khác CSS; không dùng preview làm nguồn ghi đè giao diện.

## Typography

**Display Font / Body Font:** Be Vietnam Pro, fallback Inter → ui-sans-serif → system-ui → sans-serif. `--display-font` cũng dùng cùng bộ này. **Label/Mono Font:** Space Mono chỉ cho vai trò mã ở utility chuyên biệt; mã phòng hiện vẫn kế thừa Be Vietnam Pro.

Font được tải qua Google Fonts ở `styles.css`, trọng lượng Be Vietnam Pro 400/500/600/700. `font-synthesis: none` tránh tạo giả kiểu chữ. Một số CSS phòng gọi khai báo 650/750; đây là giá trị đang tồn tại, không phải bằng chứng đã tải được các mặt chữ đó. Không thêm họ phông mới để giải quyết khác biệt trọng lượng.

### Hierarchy

| Vai trò | Token / quy tắc hiện có | Phạm vi |
| --- | --- | --- |
| Tiêu đề lớn | `headline-xl` | 32/40, đậm 700 ở utility chung |
| Tiêu đề phần | `headline-lg`, `headline-md`, `headline-sm` | Các cấp 24/32, 20/28, 16/24 |
| Nội dung | `body-lg`, `body-md` | 16/24 và 14/20; body-sm cũng đang là 14/20 |
| Nhãn | `label-md`, `label-sm` | 13/18 và 12/16, đậm 600 |
| Mã | `code-sm` | Space Mono 12/16 |
| Trang chủ văn hóa | `clamp(2rem, 3vw, 2.9rem)`, weight 600, line-height 1.3 | Tiêu đề khối giới thiệu gọn; tối đa 21ch trên desktop |
| Biểu ngữ hero chung | `clamp(2.25rem, 4.2vw, 4.25rem)`, line-height 1.3 | Không dùng thay kích thước trang chủ gọn |

Các số theo dạng cỡ chữ/chiều cao dòng trong bảng là px. Trong `.site-shell`, h1/h2 được cân dòng, ngắt từ dài và đặt line-height 1.35; h3 là 1.5; đoạn văn trong main là 1.8. Các selector đặc thù tiếp tục ghi đè, vì vậy không suy từ utility 14/20 rằng đoạn văn thực tế luôn có chiều cao dòng 20px.

Khu quản trị có biến thể mật độ: body-sm 15/22, label-md 14/20 và trường nhập 15px trong `.admin-workspace`. Các label nhỏ trong phòng gọi/trò chơi vẫn có giá trị riêng; không mô tả toàn bộ app như đã dùng một cỡ chữ duy nhất.

**The Vietnamese Type Rule.** Giữ Be Vietnam Pro và khoảng thở cho dấu tiếng Việt; không đổi tiêu đề chủ đề sang serif. Ngoại lệ Space Mono và Material Symbols phục vụ đúng vai trò mã/icon, không dùng làm phông nội dung.

## Layout

Nhịp khoảng cách chủ đạo theo utility Tailwind với các bước trong frontmatter; khoảng cách nội dung thường 1–2rem. Đây là thang được dùng, không phải giới hạn loại trừ các giá trị đặc thù như 0.6rem, 1.1rem hay clamp trong CSS tính năng.

- Khung điều hướng và nhiều trang học/tra cứu rộng tối đa 1440px, căn giữa. Padding ngang thay đổi theo breakpoint: ví dụ trang từ điển dùng 20 → 32 → 48 → 64px; thanh điều hướng có dãy riêng 16 → 24 → 32 → 48px.
- Trang chủ văn hóa dùng lưới tối đa 1280px: giới thiệu và minh họa ở hai cột, năm lối vào hoạt động ở hàng dưới. Không tái thêm bộ chọn năm chủ đề vào nội dung trang chủ.
- Khung phòng công khai tối đa 1312px; hai khối tạo/tham gia có tỷ lệ 1.15:1, gap 1.25rem. Hồ sơ có hai cột 0.9:1.1, gap 1.5rem.
- Trang từ điển mặc định dùng sidebar 242px từ ngưỡng `lg`; kết quả đổi từ một sang hai rồi ba cột theo utility và biến thể chủ đề.

### Biến thể chủ đề hiện có

| Chủ đề | Bố cục và hình thức được bảo tồn |
| --- | --- |
| Mặc định | Thanh đầu trang quen thuộc, nền xanh ngọc sáng, trang chủ riêng `DefaultHomePage`; không có lớp nền văn hóa. |
| Họa sắc Việt | Chi tiết viền trái, góc thẻ bất đối xứng; workspace desktop đặt sidebar bên phải. Ngoài trang chủ gọn, header lớn có thể chia hai hàng. |
| Rối nước | Khung tròn mềm, sóng nước; workspace desktop đưa bộ lọc lên hàng ngang. Ngoài trang chủ gọn, header lớn có khung nổi bo tròn. |
| Đông Hồ | Khung kép, góc mộc và đường nét vuông; workspace desktop có sidebar 200px, kết quả hai cột. |
| Dấu ấn Việt Nam | Khung phong cảnh và chi tiết màu lam/vàng; workspace desktop đưa bộ lọc lên ngang. Ngoài trang chủ gọn, ở 1280px trở lên có thanh điều hướng dọc 224px. |

Trang chủ của bốn chủ đề văn hóa dùng `.site-shell--compact-home`: ghi đè các biến thể header lớn thành **một thanh ngang** có min-height 68px, bỏ padding dành cho sidebar. Đây là ngoại lệ theo route, không phải thay đổi cấu trúc điều hướng của toàn bộ ứng dụng.

### Responsive

Tailwind hiện không tùy biến `screens`, nên các ngưỡng mặc định là sm 640, md 768, lg 1024, xl 1280, 2xl 1536px. CSS tính năng có ngưỡng riêng; không đồng nhất 760 với 768 hoặc 1000 với 1024.

| Ngưỡng CSS hiện có | Thay đổi chính |
| --- | --- |
| ≤480px | Trang chủ văn hóa xếp CTA một cột, lối vào hoạt động hai cột; mục cuối chiếm cả hàng. Biểu mẫu hồ sơ một cột. |
| ≤700px | Tạo/tham gia phòng một cột, danh sách phòng một cột, tùy chọn thiết bị xếp dọc; video tile chuyển 4:5 và giữ video `object-fit: contain`. |
| ≤760px | Trang chủ xếp giới thiệu → hoạt động → hình ảnh; lối vào ba cột. Hồ sơ trở về một cột. |
| ≤1000px | Giảm khoảng cách trang chủ; layout cuộc gọi bỏ cột sidebar cạnh video; danh sách phòng hai cột trước khi xuống một cột ở 700px. |
| ≥1024px | Áp dụng biến thể workspace của từng chủ đề. |
| ≥1280px | Hiện nav desktop theo `xl:flex`; các header lớn áp dụng biến thể chủ đề, trừ trang chủ gọn. Dưới ngưỡng này dùng menu di động. |
| ≥1450px | Lưới video nhóm ba cột nếu không ở trạng thái solo. |
| ≥1024px và chiều cao ≤800px | Trang chủ giảm chiều cao artwork và cỡ tiêu đề để giữ các lối thao tác gần nhau. |

Body có min-width 320px. `minmax(0, 1fr)`, flex-wrap, ngắt từ và nhãn rút gọn được dùng ở các vị trí cần thiết; đây không phải cam kết mọi trang đã vượt kiểm tra tràn ngang hoặc zoom.

## Elevation & Depth

Phân lớp nhẹ, bóng mềm giúp nhận biết khối nội dung. Viền mảnh và thay đổi tông nền đi cùng bóng; bóng mạnh hơn dành cho hộp thoại, không áp một độ nổi cho mọi thành phần. Đông Hồ có các vùng chủ động bỏ bóng và dùng viền kép. Header dùng nền bán trong và backdrop blur; đây là cách thể hiện hiện có, không phải yêu cầu mọi thẻ đều có hiệu ứng kính.

### Shadow Vocabulary

| Vai trò | Giá trị đang khai báo | Nguồn |
| --- | --- | --- |
| card | `0 1px 8px rgba(0, 0, 0, 0.04)` | Tailwind |
| lift | `0 4px 16px -2px rgba(36, 55, 70, 0.05), 0 1px 2px rgba(36, 55, 70, 0.03)` | Tailwind |
| modal | `0 20px 32px -8px rgba(36, 55, 70, 0.12), 0 4px 8px -2px rgba(36, 55, 70, 0.04)` | Tailwind |
| glow | `0 0 20px -5px rgba(16, 185, 129, 0.25)` | Tailwind; màu cố định, không đại diện cho mọi chủ đề |
| room-card | `0 12px 40px -35px #243d35` | `features/rooms/rooms.css` |

Các giá trị này cũng nằm trong sidecar phục vụ công cụ, không tạo thêm utility CSS. Lớp ambient ở sau nội dung, không nhận pointer, không được cản nút hoặc che video.

## Shapes

Bo góc chung theo `--theme-radius`: xem các token `default`, `patterns`, `puppets`, `dongho`, `heritage`. `SurfaceCard` ban đầu dùng rounded-xl; selector article trong site shell và các CSS tính năng có thể ghi đè theo chủ đề. Không giả định mọi thẻ đều theo một bán kính.

Các biến thể hiện có bao gồm góc bất đối xứng Họa sắc Việt, đường cong Rối nước, khung kép Đông Hồ, và thẻ phong cảnh Dấu ấn Việt Nam. Nhãn trạng thái/avatar thường tròn; ô nhập và nút phòng dùng bo 11px, khối tạo phòng 22px, video tile 17px rồi 12px trên điện thoại.

Hình minh họa được dùng qua `ThemeArtwork`, không vẽ lại hoặc thay ảnh. Các tài sản cần giữ trong `frontend/src/assets/`: `vsl-connect-logo.png`, `vsl-hero-laptop.png`, `hoasac-hue.webp`, `puppets-water-theatre.webp`, `dongho-village.webp`, `heritage-landscapes.webp`. Bảo tồn các wrapper/chi tiết SVG đang có quanh ảnh.

## Components

### Buttons

Gần gũi, dễ nhận biết, thao tác rõ ràng. Không có một component Button trung tâm bao phủ mọi trang; hiện dùng utility và CSS theo tính năng.

- Phòng gọi: primary nền màu nhấn/chữ trắng; secondary nền pha màu nhấn 7% và viền pha 20%; subtle nền thẻ và viền trung tính. Min-height 44px, padding/bo góc theo frontmatter, font 0.85rem, weight 650 đang khai báo.
- Hồ sơ: nút màu nhấn, min-height 44px; hover dùng `--accent-700`, disabled opacity 0.6 và cursor not-allowed.
- Ôn tập: min-height 44px, bo 0.75rem, padding 0.7rem 1rem, font 0.8rem/700.
- Nút phòng hover chỉ khi không disabled: bóng nhẹ và brightness 0.97; disabled opacity 0.55, cursor wait. Không mô tả mọi disabled như cùng một trạng thái chờ.
- Focus toàn cục là outline 3px, offset 2px, theo màu nhấn; phòng dùng offset 3px. Nhiều component dùng ring Tailwind thay outline.

### Chips / Tags

Nhãn vai trò hồ sơ có viền, nền thẻ, chữ màu nhấn, bo 99px, padding 0.25rem 0.6rem. Bộ chọn công khai/riêng tư là radio có nhãn, icon và mô tả; trạng thái chọn có cả viền màu nhấn, nền nhạt và radio đã tích, không chỉ đổi màu.

### Cards / Containers

`SurfaceCard` cung cấp nền thẻ, rounded-xl và shadow-card; padding do nơi gọi quyết định. Thẻ hồ sơ có padding 1.5rem, viền surface-border và bán kính chủ đề. Khối tạo/tham gia phòng có padding 1.6rem và bóng riêng, xuống 1.2rem ở 700px. Các thẻ video giữ nội dung ký hiệu làm trọng tâm.

### Inputs / Fields

Ô nhập có nhãn nhìn thấy được, nền theo surface, viền 1px. Trường hồ sơ min-height 44px, bo 0.65rem; trường trong `.admin-workspace` min-height 48px. Ô nhập phòng dùng nền app, padding 0.8rem 0.9rem, không khai báo một chiều cao cố định cho mọi nội dung.

Readonly hồ sơ dùng nền thấp và chữ phụ; lỗi hiển thị khối thông báo có chữ, nền lỗi/chữ lỗi. Không dùng placeholder thay nhãn. Giá trị dài ở tên/email được ngắt dòng tại các vùng thông tin tương ứng.

### Navigation

Thanh chính giữ nhãn Trang chủ, Lộ trình, Từ điển, Luyện tập, Ôn tập, Giao tiếp. Mục đang chọn có nền nhạt/chữ đậm và `aria-current` từ NavLink; hover đổi nền/chữ, focus có ring. Link tài khoản hoặc đăng nhập theo session, mục quản trị theo vai trò. Có skip link đến nội dung.

`CommunicationNav` tách Công cụ giao tiếp và Phòng gọi video; flex-wrap trên màn hình hẹp, active dùng nền primary/chữ trắng. Duy trì tuyến `/giao-tiep/phong` và link phòng cụ thể, không gộp trở lại biểu mẫu tạo phòng trên trang công cụ.

### Theme Picker / Icons

Khách chưa đăng nhập chỉ thấy giao diện Mặc định theo `ThemeContext`; chọn chủ đề cá nhân cần session. Sáng/tối và bật/tắt chuyển động nền là các trạng thái độc lập được lưu trên trình duyệt.

`Icon` dùng Material Symbols Outlined; `ThemeIcon` dùng SVG riêng khi chủ đề văn hóa có biểu tượng tương ứng và fallback về Icon khi cần. Đông Hồ dùng nét vuông/miter, các chủ đề khác round; không ép đổi toàn bộ icon sang một thư viện khác. SVG trang trí đi cùng nhãn chữ có `aria-hidden`.

### Feedback / Progress / Media

- `LoadState`: chữ “Đang tải...” với role status. Lỗi tải có thông báo, mô tả và nút thử lại; dữ liệu trống dùng `EmptyState`, không dựng nội dung học giả.
- `ProgressBar`: track cao 0.5rem, bo tròn, phần fill đổi width với transition 500ms. Ngữ nghĩa và nhãn tiến độ phụ thuộc nơi sử dụng, không khẳng định component hiện tự có đủ ARIA.
- Phòng: trạng thái kết nối, tên người dùng, giơ tay và lỗi thiết bị bằng chữ/icon. Tile giơ tay có viền vàng; tile ghim chiếm cả hàng. Camera/micro có lựa chọn trước khi vào và nút điều khiển riêng.
- Video phòng dùng object-fit contain để giữ khung hình; trang trí không che bàn tay hoặc khuôn mặt. Không bổ sung chat, ghi hình hay âm thanh thông báo bắt buộc trong bước thiết kế.

### Motion

Hiệu ứng hiện có gồm float 7s, phản hồi điều khiển khoảng 150–250ms, progress 500ms, chuyển khung quản trị 260ms, ambient drift 22/28s. Họa tiết đèn lồng, mặt nước và phản chiếu có keyframe riêng. Đây là thời gian của các hiệu ứng khác nhau, không phải một duration chung.

`prefers-reduced-motion: reduce` giảm chuyển động toàn cục; `data-background-motion='off'` và `admin-reduced-motion` tắt các lớp chuyển động được nhắm tới. Trang luyện tập không render ambient toàn trang; khi có review-game, lớp ambient của shell bị ẩn. Bản xem trước chủ đề tắt animation artwork. Tôn trọng các khác biệt này khi mở rộng.

## Do's and Don'ts

### Do:

- **Do** dùng Be Vietnam Pro, token ngữ nghĩa và biến thể chủ đề đang có cho các màn hình mới.
- **Do** giữ logo, năm chủ đề, toàn bộ ảnh và các wrapper minh họa đã được chốt.
- **Do** giữ nhãn tiếng Việt, hành động có tên rõ ràng, focus nhìn thấy và thông báo trạng thái bằng chữ/icon.
- **Do** kiểm tra từng chủ đề, sáng/tối, màn hình hẹp và tùy chọn giảm chuyển động sau một thay đổi UI thực tế.
- **Do** giữ nội dung ký hiệu, bàn tay và khuôn mặt dễ quan sát; ưu tiên luồng học rồi thực hành trong PRODUCT.md.
- **Do** phân biệt token chung, ghi đè theo route và giá trị riêng của component khi chỉnh sửa.

### Don't:

- **Don't** thay React 18, TypeScript, Tailwind 3 hoặc thêm UI framework chỉ để đổi giao diện.
- **Don't** thay font bằng serif/Plus Jakarta Sans từ tài liệu mẫu hoặc sử dụng màu preview để ghi đè palette runtime.
- **Don't** ép tất cả chủ đề về một bố cục hay áp sidebar desktop lên trang chủ gọn.
- **Don't** dùng âm thanh hoặc màu làm tín hiệu duy nhất cho lỗi, thiết bị, kết nối hoặc kết quả học.
- **Don't** thay hợp đồng API, session, phân quyền, quy trình camera/micro hoặc dữ liệu khi chỉ tinh chỉnh UI.
- **Don't** coi tài liệu trích xuất này là chứng nhận font đã tải đúng, tương phản đạt chuẩn, responsive đã kiểm thử hoặc toàn bộ ứng dụng đạt chuẩn accessibility.
