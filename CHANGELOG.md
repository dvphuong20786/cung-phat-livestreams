# Lịch sử thay đổi

## [v0.4.0] - 2026-10-31
- **Yêu cầu**: Lưu lâu dài lịch sử sự kiện TikTok LIVE và simulator bằng SQLite.
- **Chi tiết kỹ thuật**:
 - Thêm `EventStore` dùng `better-sqlite3`, tự tạo `data/tiktok-live.db`, bảng/index và chế độ WAL.
 - `EventService` ghi từng sự kiện vào SQLite, nạp lại tối đa 500 sự kiện khi backend khởi động và khôi phục thống kê từ lịch sử.
 - Thêm `EVENT_RETENTION_DAYS` mặc định 30 ngày và tùy chọn `EVENT_DB_PATH`; dữ liệu hết hạn được dọn khi server khởi động.
 - Nút thùng rác trong bảng sự kiện gọi backend để xóa cả lịch sử SQLite, sự kiện trên dashboard và thống kê.
 - Health endpoint bổ sung trạng thái persistence, số sự kiện đang lưu và thời gian giữ dữ liệu; database/WAL được loại khỏi Git.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã thử ghi một gift giả lập vào database thật, restart backend vẫn đọc được 1 sự kiện, sau đó xóa dữ liệu thử và xác nhận event count trở về 0.
 - Build frontend/backend/shared, TypeScript lint và 19 test đều thành công. Vite còn cảnh báo chunk Three.js lớn nhưng build không thất bại.

## [v0.3.0] - 2026-10-31
- **Yêu cầu**: Thử cách kết nối TikTok LIVE miễn phí bằng EulerStream Cloud WebSocket và xử lý khi đạt giới hạn request/kết nối.
- **Chi tiết kỹ thuật**:
 - Thêm `EulerCloudConnector`, mặc định dùng `TIKTOK_CONNECTION_MODE=cloud` và API key `EULER_API_KEY`; tiếp tục hỗ trợ `TIKTOK_SIGN_API_KEY` cũ làm fallback.
 - Chuẩn hóa sự kiện Cloud WebSocket thành Like, Comment, Gift, Follow, Share và Join; quà streak chỉ phát sự kiện khi streak kết thúc.
 - Dừng tự reconnect khi nhận mã `4429`, key sai, thiếu quyền, tài khoản không LIVE hoặc LIVE kết thúc; lỗi mạng tạm thời retry theo exponential backoff tối đa 30 giây.
 - Thêm mode `direct` để giữ connector cũ dành cho tài khoản có quyền Signature/Business và bổ sung mode/config vào health endpoint.
 - Xóa API key thật khỏi `.env.example`, thay bằng placeholder và cập nhật hướng dẫn cấu hình/quota trong README.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã kết nối thật thành công với `vidoihihi` bằng Cloud WebSocket/Community, nhận acknowledgment `success: true`, sau đó chủ động ngắt kết nối.
 - Build frontend/backend/shared, TypeScript lint và 17 test đều thành công. Vite chỉ còn cảnh báo chunk Three.js lớn đã tồn tại, không làm build thất bại.
 - API key từng xuất hiện trong `.env.example`; nên rotate key trên EulerStream dù file hiện đã được làm sạch.

## [v0.2.6] - 2026-10-31
- **Yêu cầu**: Chẩn đoán trường hợp đã có `.env` và API key nhưng kết nối TikTok LIVE vẫn báo lỗi.
- **Chi tiết kỹ thuật**:
 - Bổ sung `tiktokSignConfigured` vào health endpoint để xác nhận server đã nạp key mà không để lộ giá trị.
 - Tách thông báo lỗi thành hai trường hợp: server chưa nạp key và key đã nạp nhưng EulerStream từ chối quyền TikTok LIVE Signature.
 - Thêm test cho cả hai nhánh chẩn đoán, không ghi log hoặc đưa API key xuống frontend.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã xác nhận `.env` đúng vị trí, key không rỗng và server sau restart trả `tiktokSignConfigured: true`.
 - Thử kết nối `@vidoihihi` cho kết quả EulerStream từ chối quyền Signature; cần kiểm tra hiệu lực key và quyền/gói/add-on trên tài khoản EulerStream.
 - Build, lint và 14 test đều thành công.

## [v0.2.5] - 2026-10-31
- **Yêu cầu**: Xử lý lỗi EulerStream yêu cầu Business plan khi kết nối TikTok LIVE thật.
- **Chi tiết kỹ thuật**:
 - Thêm biến môi trường `TIKTOK_SIGN_API_KEY` và truyền server-side vào `tiktok-live-connector`; API key không được gửi xuống frontend hoặc ghi log.
 - Sửa lỗi backend từng trả acknowledgment `success: true` dù `TikTokLiveConnection.connect()` đã thất bại.
 - Chuẩn hóa lỗi EulerStream, tài khoản offline và CAPTCHA thành thông báo tiếng Việt có hướng xử lý rõ ràng.
 - Bổ sung README và `.env.example` với hướng dẫn cấu hình dịch vụ ký WebSocket; simulator vẫn hoạt động không cần key.
 - Thêm test cho thông báo EulerStream Business plan và tài khoản không LIVE.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build, lint và 13 test đều thành công. Đã thử lại không có API key: backend trả `success: false` cùng thông báo tiếng Việt đúng, không còn báo kết nối thành công giả.
 - Kết nối TikTok thật phụ thuộc quyền TikTok LIVE Signature của nhà cung cấp hoặc một sign provider hợp lệ; dự án không triển khai cơ chế vượt chữ ký, CAPTCHA hay kiểm soát truy cập của TikTok.

## [v0.2.4] - 2026-10-31
- **Yêu cầu**: Sửa ô kết nối TikTok LIVE báo `Invalid` khi người dùng dán URL đầy đủ.
- **Chi tiết kỹ thuật**:
 - Thêm chuẩn hóa đầu vào để chấp nhận username, `@username` hoặc URL dạng `https://www.tiktok.com/@username/live`.
 - Chỉ chấp nhận URL thuộc `tiktok.com`, trích username từ pathname và giữ validation ký tự an toàn phía backend.
 - Cập nhật placeholder, mô tả ô kết nối và thông báo validation bằng tiếng Việt.
 - Thêm test cho URL `@an.nhien..9999/live`, dạng `@username` và URL sai hostname.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build, lint và 11 test đều thành công. Đã thử kết nối thực tế một lần với `an.nhien..9999`, connector trả `success: true`, sau đó chủ động ngắt kết nối và không bật tự động reconnect.

## [v0.2.3] - 2026-10-31
- **Yêu cầu**: Sửa giao diện `/test` bị mất layout và chạy thử lại toàn bộ ứng dụng.
- **Chi tiết kỹ thuật**:
 - Sửa `tailwind.config.js` dùng đường dẫn tuyệt đối theo thư mục `apps/web`, không phụ thuộc working directory của lệnh khởi động.
 - Sửa `postcss.config.js` nạp trực tiếp cấu hình Tailwind, tránh Vite chạy từ root tìm nhầm hoặc không tìm thấy `content`.
 - Cấu hình `vite.config.ts` đặt rõ `root` là `apps/web` và cập nhật script `pnpm dev` sử dụng config này.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã xác minh cảnh báo Tailwind biến mất; CSS dev có đủ class grid/responsive, backend health trả `ok: true`, build thành công, 9 test và kiểm tra TypeScript đều đạt.
 - Công cụ chụp cửa sổ Chrome bị timeout khi trang có WebGL; kiểm tra runtime được thực hiện qua Vite output, CSS response, accessibility tree và health endpoint.

## [v0.2.2] - 2026-10-31
- **Yêu cầu**: Sửa lỗi không mở được chế độ test 3D và làm rõ lệnh kiểm tra backend.
- **Chi tiết kỹ thuật**:
 - Sửa script `pnpm dev` để `concurrently` gọi trực tiếp `tsx` và Vite, tránh hai tiến trình pnpm con tranh package-store lock làm backend cổng 3001 bị treo.
 - Cố định Vite tại `127.0.0.1:5173` với `strictPort` để URL test không tự đổi sang cổng khác.
 - Cập nhật `3_CHAY_UNG_DUNG.bat` để tự mở `http://localhost:5173/test` sau khi khởi động.
 - Thêm `4_MO_TEST_3D.bat` để kiểm tra backend rồi mở trực tiếp chế độ thử nghiệm.
 - Cập nhật `DEV_COMMANDS.md`, giải thích `Invoke-RestMethod` chỉ là health check và không có chức năng khởi động ứng dụng.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã xác minh `pnpm build` thành công, backend health trả `ok: true` và `/test` trả HTTP 200 khi chạy `pnpm dev`.

## [v0.2.1] - 2026-10-31
- **Yêu cầu**: Thêm tài liệu câu lệnh cài đặt, build, kiểm thử và chạy dự án dành cho developer.
- **Chi tiết kỹ thuật**:
 - Thêm `DEV_COMMANDS.md` với lệnh PowerShell/pnpm cho toàn workspace và từng frontend/backend riêng biệt.
 - Bổ sung lệnh production preview, health check, test riêng, format, kiểm thử luồng chùa 3D và cấu hình OBS Browser Source.
 - Liệt kê quan hệ giữa các file `.bat` hiện có và câu lệnh pnpm tương ứng.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã kiểm tra các lệnh và URL bắt buộc xuất hiện đầy đủ trong tài liệu; thay đổi chỉ liên quan tài liệu nên không chạy lại build.

## [v0.2.0] - 2026-10-31
- **Yêu cầu**: Mở rộng TikTok LIVE Monitor với ngôi chùa 3D tương tác và hoạt ảnh nhân vật theo sự kiện realtime.
- **Chi tiết kỹ thuật**:
 - Thêm các route `/temple`, `/overlay` và `/test`; giữ dashboard hiện tại tại `/admin` và trang gốc.
 - Thêm scene React Three Fiber procedural gồm cổng chùa, mái cong, chính điện, tượng Phật, bàn dâng hoa, lư hương, sân đá, cây, đèn lồng, ánh sáng, bóng đổ và hiệu ứng hạt.
 - Thêm nhân vật procedural có tên người xem, chuyển động delta-time, đi bộ, chắp tay, dâng hoa, cúi lạy và rời cảnh.
 - Mở rộng backend Socket.IO với `TempleGameAction`, mapping Like/Comment/Gift/Follow/Share và các lệnh tạm dừng, tiếp tục, xóa cảnh.
 - Thêm hàng đợi ưu tiên nghi lễ quà tặng, giới hạn 12 nhân vật, 2 nghi lễ đồng thời và 500 hành động chờ.
 - Thêm camera toàn cảnh/cổng chùa/điện Phật, ba mức đồ họa, màn thử nghiệm chia đôi và overlay dành cho OBS.
 - Cập nhật `README.md` với hướng dẫn kiểm thử chùa 3D và thiết lập OBS Browser Source dọc 1080 × 1920.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - `pnpm build`, 9 test tự động và kiểm tra TypeScript đều thành công; đã xác nhận `/temple` và `/test` tải đúng trong Chrome. Công cụ capture không chụp được khung WebGL nên chưa thực hiện đánh giá hình ảnh bằng ảnh chụp tự động.
 - Kết nối TikTok thật vẫn chưa được xác minh với một tài khoản đang LIVE công khai; refresh overlay sẽ khởi động lại hoạt ảnh phía client.

## [v0.1.1] - 2026-10-31
- **Yêu cầu**: Tách riêng file lệnh cho từng bước cài đặt, build và chạy ứng dụng.
- **Chi tiết kỹ thuật**:
 - Thêm `1_CAI_DAT.bat` để kiểm tra Node.js, tự cài pnpm khi thiếu và chạy `pnpm install`.
 - Thêm `2_BUILD.bat` để kiểm tra điều kiện cài đặt rồi chạy `pnpm build`.
 - Thêm `3_CHAY_UNG_DUNG.bat` để khởi động frontend và backend bằng `pnpm dev`.
 - Bổ sung chế độ CI cho các file lệnh để pnpm không yêu cầu xác nhận tương tác khi kiểm tra dependency.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã chạy trực tiếp `2_BUILD.bat` thành công; bước cài đặt cần Internet nếu máy chưa có dependency.

## [v0.1.0] - 2026-10-31
- **Yêu cầu**: Thêm file lệnh để khởi động ứng dụng TikTok LIVE Monitor trên Windows.
- **Chi tiết kỹ thuật**:
 - Thêm `CHAY_UNG_DUNG.bat` tại thư mục gốc, tự chuyển về đúng thư mục dự án và kiểm tra Node.js cùng pnpm.
 - Tự chạy `pnpm install` khi chưa có `node_modules`, sau đó khởi động frontend và backend bằng `pnpm dev`.
 - Hiển thị URL dashboard `http://localhost:5173` và backend `http://localhost:3001` ngay trong cửa sổ lệnh.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Đã chạy `pnpm build` thành công; file lệnh dành cho Windows và cần Node.js cùng pnpm trong PATH.
