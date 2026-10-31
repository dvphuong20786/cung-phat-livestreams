# TikTok LIVE Realtime Event Monitor

Dashboard tiếng Việt để kiểm thử thu thập sự kiện TikTok LIVE trước khi nối vào game Three.js. Ứng dụng gồm React/Vite, Node/Express, Socket.IO, adapter `tiktok-live-connector`, bộ giả lập và thống kê tách riêng dữ liệu thật/mô phỏng.

## Chạy nhanh

Yêu cầu Node.js 20+ và pnpm 9+.

```bash
pnpm install
pnpm dev
```

- Dashboard: http://localhost:5173
- API/Socket.IO: http://localhost:3001
- Kiểm tra máy chủ: http://localhost:3001/health

Sao chép `.env.example` thành `.env` nếu cần đổi cổng hoặc origin. Không có thông tin đăng nhập nào được lưu trong trình duyệt.

Mặc định server dùng EulerStream Cloud WebSocket (`cloud`), phù hợp với API key gói Community và không cần quyền Signature/Business:

```env
TIKTOK_CONNECTION_MODE=cloud
EULER_API_KEY=your_eulerstream_api_key
```

Muốn quay lại connector trực tiếp cũ, đặt `TIKTOK_CONNECTION_MODE=direct` và `TIKTOK_SIGN_API_KEY`; cách này cần quyền TikTok LIVE Signature. Khởi động lại server sau khi đổi `.env`. Không đưa API key vào frontend hoặc commit lên Git; `.env` đã nằm trong `.gitignore`. Chế độ simulator và toàn bộ chùa 3D không cần API key.

Khi EulerStream trả mã `4429` (quá nhiều kết nối/request), server chuyển sang trạng thái lỗi và **không tự reconnect** để tránh tiêu thêm quota. Hãy đóng Cloud WebSocket cũ trong dashboard EulerStream hoặc chờ giới hạn được reset, rồi bấm **Kết nối** lại. Các lỗi mạng tạm thời vẫn retry theo exponential backoff, tối đa 30 giây; simulator vẫn dùng bình thường.

## Kiểm thử chấp nhận

1. Mở dashboard, bấm **Gửi 10 Like**: bảng có sự kiện và thống kê tăng 10.
2. Bấm **Tặng Rose**: bảng hiển thị Rose và hành động `OFFER_FLOWERS`.
3. Nhập username TikTok không có `@`, bấm **Kết nối**. Trạng thái/lỗi thật từ connector sẽ được hiển thị.

## Lệnh

```bash
pnpm dev       # chạy web và server
pnpm build     # build toàn bộ workspace
pnpm test      # chạy Vitest
pnpm lint      # kiểm tra TypeScript
```

## Lưu ý TikTok

`tiktok-live-connector` dựa trên cơ chế TikTok LIVE không chính thức. Kết nối có thể thất bại vì LIVE không tồn tại, thay đổi phía TikTok, CAPTCHA, giới hạn vùng hoặc rate limit. Ứng dụng không né CAPTCHA, xác thực hay giới hạn nền tảng và không giả trạng thái kết nối thành công. Quà dạng streak chỉ được ghi khi streak kết thúc; số like dùng `likeCount` của gói sự kiện thay vì giả định mỗi event là một like.

Server mặc định chỉ bind `127.0.0.1`, CORS chỉ cho phép `WEB_ORIGIN`, bộ nhớ sự kiện được giới hạn 500 mục và mọi socket command đều được Zod xác thực.

## Lưu lịch sử SQLite

Backend lưu sự kiện TikTok và simulator vào `data/tiktok-live.db`, đồng thời giữ tối đa 500 sự kiện gần nhất trong RAM để gửi nhanh cho dashboard. Khi khởi động lại server, 500 sự kiện gần nhất được nạp lại từ SQLite và thống kê được khôi phục.

```env
EVENT_RETENTION_DAYS=30
# EVENT_DB_PATH=F:\\tools\\data\\tiktok-live.db
```

Dữ liệu quá thời hạn được dọn khi server khởi động. Nút thùng rác ở bảng sự kiện xóa cả lịch sử đang hiển thị và dữ liệu SQLite. Các file database/WAL đã được loại khỏi Git; API key chỉ nằm trong `.env`, không được ghi vào database.

## Mapping cho game tương lai

- LIKE → `ENTER_TEMPLE`
- COMMENT chứa “nam mo”/“nam mô” → `PRAY`
- Rose → `OFFER_FLOWERS`
- Quà khác → `OFFER_INCENSE`
- FOLLOW/SHARE → `WELCOME`

Scene 3D dùng hình học procedural, không phụ thuộc model tải ngoài.

## Chùa 3D tương tác

Ứng dụng hiện có bốn màn hình dùng chung một kết nối Socket.IO:

- `http://localhost:5173/admin` — dashboard quản trị hiện tại.
- `http://localhost:5173/temple` — chùa 3D toàn màn hình, có OrbitControls, camera và cấu hình đồ họa.
- `http://localhost:5173/overlay` — cảnh sạch dành cho OBS Browser Source, không bật điều khiển chuột.
- `http://localhost:5173/overlay-mobile` — overlay dọc 9:16 riêng cho điện thoại và livestream mobile.
- `http://localhost:5173/test` — simulator và log bên trái, cảnh 3D trực tiếp bên phải.

Admin có menu nhiều trang: `/admin` (Tổng quan), `/admin/events`, `/admin/connection`, `/admin/simulator`, `/admin/temple` và `/admin/settings`. Trên màn hình nhỏ, menu được hiển thị thành thanh cuộn ngang phía dưới header.

### Kiểm thử hoạt ảnh

1. Chạy `3_CHAY_UNG_DUNG.bat` hoặc `pnpm dev`.
2. Mở `/test`.
3. Bấm **Tặng Rose** để nhân vật mang hoa qua cổng, đi tới bàn lễ, dâng hoa, chắp tay, cúi lạy và rời cảnh.
4. Thử Like, lời bình “Nam mô A Di Đà Phật”, Follow và Share để kiểm tra các hành vi còn lại.
5. Dùng **Giả lập 50 người** hoặc **Stress Test 500 sự kiện** để kiểm tra hàng đợi. Scene chỉ giữ tối đa 12 nhân vật và 2 nghi lễ tại điện Phật cùng lúc.

Thanh điều khiển 3D có bộ chọn **Ngoại cảnh / Nội điện**. Nội điện dùng camera và ánh sáng riêng nhưng vẫn giữ nguyên nhân vật, dâng hoa, thắp hương, lạy Phật và hiệu ứng quà tặng.

### Dùng với OBS

Thêm một **Browser Source** trỏ tới `http://localhost:5173/overlay` cho khung ngang. Với livestream dọc, dùng `http://localhost:5173/overlay-mobile` và đặt kích thước Browser Source là `1080 × 1920`; route này có hậu cảnh 9:16 và bố cục người/ghế thu gọn riêng. Nội điện có tối đa 80 tọa cụ đại diện cho các tài khoản đang hiện diện/tương tác trong LIVE; người lên lễ sẽ rời chỗ và quay lại khu ngồi sau khi hoàn tất nghi lễ. Có thể chọn preset đồ họa thấp trên thanh công cụ overlay nếu GPU hạn chế, sau đó bấm **Ẩn** để làm sạch cảnh phát.

Các hoạt ảnh đang chạy nằm trong bộ nhớ của trình duyệt. Refresh overlay sẽ khởi động lại hoạt ảnh phía client; sự kiện mới sau khi Socket.IO kết nối lại vẫn tiếp tục hoạt động. Không có âm thanh tự phát nên không bị chặn bởi chính sách autoplay của trình duyệt.
