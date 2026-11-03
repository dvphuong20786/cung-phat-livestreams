# Lịch sử thay đổi

## [v0.28.4] - 2026-11-03
- **Yêu cầu**: Không lưu Bảng Công Đức và danh sách Cúng dường phiên LIVE vào cơ sở dữ liệu; hai danh sách chỉ hiển thị dữ liệu người thật trong phiên hiện tại.
- **Chi tiết kỹ thuật**:
  - Thêm `LiveSessionListsStore` để giữ điểm công đức phiên và người cúng dường gần nhất hoàn toàn trong RAM của server, chỉ nhận nguồn thật TikTok, YouTube và Facebook, đồng thời loại bỏ dữ liệu giả lập.
  - `socketServer.ts` đồng bộ hai danh sách qua snapshot và sự kiện `session:lists`; danh sách được xóa khi bắt đầu phiên TikTok mới, khi reset thống kê hoặc khi server khởi động lại.
  - `MeritLeaderboard.tsx` và `RecentDonorsList.tsx` chỉ đọc danh sách phiên do server gửi, không còn lấy lịch sử nhân vật từ `/api/characters` hoặc tự dựng danh sách cúng dường phía trình duyệt.
  - `CharacterStore.ts` không còn đọc, ghi hoặc migrate `merit_points_in_session`; tổng điểm công đức và level của nhân vật vẫn được lưu vĩnh viễn như trước.
  - Bổ sung test cho việc đồng bộ, cộng điểm và reset hai danh sách chỉ tồn tại trong bộ nhớ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 50/50 unit test, TypeScript typecheck cho server/shared/web và production build web.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 844 kB; cảnh báo hiệu năng này không làm lỗi build.

## [v0.28.3] - 2026-11-03
- **Yêu cầu**: Cập nhật lại ảnh `hoa2.png` (1024x768, 4x3 frame) với kênh Alpha trong suốt hoàn toàn, loại bỏ toàn bộ background đệm khi chạy hiệu ứng hoa sen, và chuyển đổi hoa sen nở thành hoạt ảnh 12 khung hình liên hoàn tại đúng vị trí trang nghiêm trước điện Phật.
- **Chi tiết kỹ thuật**:
  - `hoa2.png`: Chuyển đổi toàn bộ nền đen của ảnh hoa sen sang True Transparent Alpha PNG (Format32bppArgb, 1024x768, 12 frame vuông 256x256), giữ trọn vẹn sắc hồng cánh sen và ánh sáng kim quang phát sáng rực rỡ.
  - `interaction-effects.css`:
    - Loại bỏ hoàn toàn background-color và các lớp nền phụ; thiết lập `background-color: transparent !important`.
    - Thêm hoạt ảnh keyframes `@keyframes lotus-spritesheet-play` tuần tự 12 bước (`steps(1)`) qua từng frame (4 cột x 3 hàng) từ nụ hoa hé nở -> bung cánh -> Phật quang tỏa sáng -> cánh hoa và bụi vàng xoay tròn tan biến.
  - `InteractionEffectsOverlay.tsx`:
    - `LotusBloom`: Loại bỏ lớp nền `radial-gradient` vòng tròn vàng phía sau; hoa sen nở trong suốt thanh tịnh 100%.
    - `GrandLotusCeremony`: Loại bỏ lớp phủ `radial-gradient` toàn màn hình; đưa vị trí đóa sen nở từ giữa màn hình (`50%`) xuống vị trí trang nghiêm trên thảm đỏ chánh điện (`top: 58%`), tránh che khuất tượng Phật và bàn thờ Tam Bảo.
    - `hasLotusFootBloom`: Căn chỉnh vị trí nở hoa tại chỗ về đúng đầu thảm đỏ nơi Phật tử hành lễ (`top: 61.5%`).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 50/50 unit test và TypeScript typecheck đạt 0 lỗi.

## [v0.28.2] - 2026-11-03
- **Yêu cầu**: Sửa Bảng Công Đức và danh sách Cúng dường phiên live còn hiển thị dữ liệu giả.
- **Chi tiết kỹ thuật**:
  - `TempleGameAction`: truyền rõ `source` từ sự kiện gốc xuống toàn bộ luồng game.
  - `useTempleGameStore.ts`: chỉ thêm người cúng dường khi nguồn được xác nhận là `TIKTOK`, `YOUTUBE` hoặc `FACEBOOK` và `isSimulated === false`; sự kiện `SIMULATOR` không thể lọt vào danh sách dù cờ giả lập bị thiếu hoặc sai.
  - `RecentDonorsList.tsx`: áp dụng lại kiểm tra nguồn thật ngay trước khi gom nhóm và hiển thị danh sách.
  - `MeritLeaderboard.tsx`: đổi sang nguyên tắc chỉ nhận nhân vật có `isSimulated === false`, không còn coi dữ liệu thiếu cờ là người thật.
  - `useTempleGameStore.test.ts`: bổ sung trường hợp sự kiện mang nguồn `SIMULATOR` nhưng cờ `isSimulated` sai vẫn phải bị loại; donor YouTube thật vẫn được nhận.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 49/49 unit test, TypeScript typecheck và production build cho server, shared package và web.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 844 kB; cảnh báo hiệu năng này không làm lỗi build.

## [v0.28.1] - 2026-11-03
- **Yêu cầu**: Sửa lỗi trên màn hình /overlay-2d (Desktop 2D Overlay): Sư Thầy ngồi quá cao đè lên bàn thờ và tượng Phật; khách tới hành lễ cùng đệ tử, Phật tử ngồi quỳ bị lơ lửng, tách rời khỏi toà sen đệm ngồi.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`:
    - `ChantingMonks2D`: Hạ toạ độ Y của 3 Sư Thầy trên Desktop từ `51% / 51.5%` xuống `58.2% / 58.8%` (đúng mặt sàn trước bệ thờ Tam Bảo); đóng gói đệm sen (`lotus-cushion.svg`) ở lớp nền (`z-0`) ôm khít dưới đáy thân người quỳ và mõ gỗ (`z-2`) ở phía trước, xoá bỏ hoàn toàn khoảng trống bị lơ lửng.
    - `Mobile2DSeatedVisitors`: Tích hợp đệm toà sen trực tiếp ôm chân nhân vật quỳ (`bottom-[-4px] z-0`), loại bỏ class không hợp lệ `-mt-4.5`; người ngồi và toà sen gắn kết thành khối liền mạch vững chãi.
    - `get2DSeatCoordinates`: Điều chỉnh toạ độ 2 hàng ghế Phật tử trên Desktop (`rowTops`) từ `[62, 76]` xuống `[67, 79]` với scale `[1.08, 1.3]`, khớp chuẩn xác với phối cảnh sàn gỗ 2 bên thảm đỏ chánh điện.
    - `Mobile2DCharacter`: Điều chỉnh điểm đứng hành lễ của khách dâng hoa / quỳ lạy cúng Phật (`worshipTop`) trên Desktop từ `54% / 56%` xuống `61.5% / 63.5%`, đưa nhân vật đứng trang nghiêm trên thảm đỏ trước bàn thờ Tam Bảo thay vì bay lơ lửng giữa không trung.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 49/49 unit test và hoàn thành TypeScript typecheck cho `apps/web` (0 errors).

## [v0.28.0] - 2026-11-03
- **Yêu cầu**: Thêm kết nối đồng thời YouTube LIVE và Facebook LIVE bên cạnh TikTok, chỉ nhận tương tác người thật và không tạo dữ liệu giả cho hai nền tảng mới.
- **Chi tiết kỹ thuật**:
  - `ConnectionPanel.tsx`: bổ sung hai ô dán URL YouTube LIVE và Facebook LIVE theo cùng bố cục TikTok; mỗi nền tảng có trạng thái, lỗi, nút kết nối và ngắt kết nối độc lập.
  - `YouTubeConnector.ts`: dùng YouTube Data API để tìm `activeLiveChatId`, nhận chat, Super Chat, Super Sticker và sự kiện membership; giữ avatar cùng ID kênh thật của người tương tác.
  - `FacebookConnector.ts`: dùng Facebook Graph API và Page access token để đọc bình luận mới của video LIVE; bỏ qua dữ liệu không có danh tính người dùng thay vì tạo nhân vật giả.
  - `socketServer.ts`: cho phép TikTok, YouTube và Facebook phát sự kiện đồng thời vào cùng hàng đợi nhân vật, điểm công đức, hiệu ứng và bảng thống kê; tự tắt giả lập tự động khi bất kỳ nền tảng thật nào kết nối.
  - `StatisticsService.ts`, `EventService.ts` và `useMonitorStore.ts`: mở rộng nguồn sự kiện thật đa nền tảng, cộng thống kê người thật từ cả ba nguồn và hỗ trợ lọc riêng từng nền tảng.
  - `CharacterStore.ts`: dùng ID có tiền tố nền tảng cho YouTube/Facebook để không gộp nhầm hai tài khoản trùng tên giữa các nền tảng.
  - `.env.example`: bổ sung `YOUTUBE_API_KEY`, `FACEBOOK_PAGE_ACCESS_TOKEN` và cấu hình tùy chọn `FACEBOOK_GRAPH_VERSION`.
  - Bổ sung test nhận diện URL, ánh xạ bình luận/avatar, Super Chat và thống kê đa nền tảng.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 49/49 unit test, TypeScript typecheck và production build cho server, shared package và web; đã kiểm tra trực tiếp bố cục tại `/admin/connection`.
  - Chưa thể kiểm thử kết nối LIVE thật khi máy hiện chưa có YouTube API key và Facebook Page access token hợp lệ.
  - API YouTube không cung cấp từng người chỉ vào xem, lượt like hoặc share theo tài khoản; Facebook chỉ trả các bình luận mà quyền của Page token cho phép. Hệ thống không sinh sự kiện giả để bù dữ liệu mà nền tảng không cung cấp.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 844 kB; cảnh báo hiệu năng này không làm lỗi build.

## [v0.27.2] - 2026-11-03
- **Yêu cầu**: Sửa dứt điểm lỗi hiệu ứng hoa sen bị viền khối vuông đen và xóa bỏ hoàn toàn các biểu tượng nút loa lơ lửng trên nhân vật.
- **Chi tiết kỹ thuật**:
  - `hoa2.png`: xử lý chuyển đổi toàn bộ nền đen của Sprite Sheet 4x3 hoa sen sang kênh Alpha trong suốt (True Transparent Alpha PNG), giúp hoa sen tỏa hào quang vàng hồng tự nhiên và không bao giờ bị khối vuông đen dù ở màn hình 2D hay 3D WebGL.
  - `interaction-effects.css`: tối ưu `.lotus-glow-sprite` với bộ lọc ánh sáng `filter: drop-shadow(0 0 18px rgba(255, 215, 100, 0.75))` và loại bỏ phụ thuộc `mix-blend-mode: screen`, giúp hiệu ứng hiển thị trong suốt mượt mà trên mọi layer trình duyệt.
  - `InteractionEffectsOverlay.tsx`: xóa bỏ hoàn toàn nút bật/tắt âm thanh dạng button lơ lửng ở góc dưới; âm thanh hiệu ứng tự động đồng bộ thống nhất với trạng thái âm thanh chung của hệ thống trên thanh `TempleToolbar`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test và build production Web thành công sạch sẽ.

## [v0.27.1] - 2026-11-03
- **Yêu cầu**: Ưu tiên hiển thị bong bóng bình luận nổi lên trên tất cả các tag tên nhân vật (không bị tên đè che mất); đồng bộ Bảng Công Đức và Danh Sách Cúng Dường bên trái thành bảng xếp hạng theo phiên live hiện tại.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`:
    + Thêm hàm `checkHasActiveComment`: phát hiện nhân vật đang có bình luận hợp lệ trong thời gian quy định (20s).
    + Tự động nâng tầng `zIndex` của nhân vật có bình luận lên `+400` đến `+500` (so với mức 10-35 thông thường của các hàng ghế), đảm bảo bong bóng bình luận luôn luôn nổi lên trên cùng, triệt để loại bỏ hiện tượng tag tên của nhân vật phía trước hoặc phía sau đè lên che khuất chữ.
    + Thêm `z-50` cho container `DevoteeHeadBadge` khi có comment; dọn dẹp các thẻ `InteractionEffectsOverlay` lọt vào các sub-components.
  - `CharacterStore.ts`:
    + Bổ sung trường và cột database `merit_points_in_session INTEGER DEFAULT 0` trong bảng SQLite `user_characters`.
    + Tích hợp cộng dồn điểm công đức riêng của phiên live hiện tại (`meritPointsInSession`), tự động reset về 0 khi bắt đầu phiên live mới hoặc bấm Reset Stats trên Admin.
  - `useTempleGameStore.ts` & `useSocket.ts`:
    + Thêm quản lý `sessionMeritPoints` và action `resetSession`.
    + Tự động dọn sạch điểm phiên live và danh sách người cúng dường khi nhận tín hiệu `events:reset` hoặc `characters:reset`.
  - `MeritLeaderboard.tsx`:
    + Chuyển Bảng Công Đức sang xếp hạng Top 5 thí chủ theo điểm công đức kiếm được trong phiên live hiện tại (`sessionMeritPoints`). Nếu phiên mới chưa có ai thì hiển thị *"Chưa có thí chủ công đức"*.
  - `RecentDonorsList.tsx`:
    + Chuyển danh sách bên trái sang Xếp Hạng Cúng Dường Phiên Live (`Cúng dường phiên live`): gom nhóm theo từng thí chủ và xếp hạng theo tổng số lượng/giá trị lễ vật cúng dường trong phiên live hiện tại.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test và hoàn thành build production Web sạch sẽ không có bất kỳ lỗi nào.

## [v0.27.0] - 2026-11-02
- **Yêu cầu**: Triển khai hệ thống điểm công đức, level nhân vật và toàn bộ hiệu ứng tương tác TikTok theo thời gian thực (Like, Comment, Share, Follow, Watch time, Hoa, Gift theo mốc coin, Lên level, Chuyển cấp bậc nhân vật).
- **Chi tiết kỹ thuật**:
  - `interactionEffectsConfig.ts`: tách riêng toàn bộ cấu hình điểm số, thời lượng, mốc coin quà tặng (1-9, 10-49, 50-99, 100-499, >=500 coin) và độ ưu tiên hàng đợi `EFFECT_PRIORITY`.
  - `interaction-effects.css`: bộ cắt sprite sheet chuẩn xác từng ô cho `hoa1.png` (4x4 cánh hoa rơi) và `hoa2.png` (4x3 đóa sen phát quang hòa trộn `screen` loại bỏ nền đen tự nhiên), cùng các hiệu ứng bay lượn, nở hoa chân, mưa hoa toàn màn hình và hào quang hoàng kim.
  - `useInteractionEffectsStore.ts`: quản lý Event Queue phân tầng, cho phép hiệu ứng nhỏ chạy song song (concurrent tối đa 40 hiệu ứng chống giật/lag) và hiệu ứng lớn sắp xếp tuần tự theo mức độ ưu tiên: `Chuyển cấp > Gift >=500 coin > Gift 100-499 coin > Lên level > Follow > Share > Like/Comment`. Hỗ trợ gộp combo hoa/gift liên tiếp trong 8s và chống lặp sự kiện bằng `seenEventIds`.
  - `InteractionEffectsOverlay.tsx`: component hiển thị đa tầng hiệu ứng (PetalRain, PetalsOrbit, LotusBloom, GrandLotusCeremony, EffectNoticeBanner) và nút bật/tắt âm thanh hiệu ứng tương tác.
  - Tích hợp lớp phủ `InteractionEffectsOverlay` vào cả `Mobile2DOverlayPage.tsx` và `TemplePage.tsx` (hỗ trợ cả 2D lẫn 3D WebGL).
  - `TempleAudioService.ts`: bổ sung alias `playBell` (chuông chùa) và `playMoktak` (gõ mõ) phục vụ âm thanh hiệu ứng tương tác chúc mừng thăng cấp và quà lớn.
  - `useSocket.ts`: kết nối bắt sự kiện `tiktok:event` và theo dõi cập nhật thời gian xem 15 phút từ server để kích hoạt hoa bay quanh nhân vật.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test và build production Web thành công sạch sẽ.
  - Cần khởi động Simulator hoặc kết nối TikTok LIVE thật để quan sát hoạt cảnh đại đóa sen và mưa hoa trực tiếp trên OBS Browser Source.

## [v0.26.3] - 2026-11-02
- **Yêu cầu**: Sửa dứt điểm lỗi backend vẫn báo thiếu `TIKTOK_SIGN_API_KEY` dù biến đã có trong `.env`.
- **Chi tiết kỹ thuật**:
  - `apps/server/src/index.ts`: nạp `.env` bằng đường dẫn tuyệt đối tính từ vị trí mã nguồn/build về thư mục gốc monorepo, không còn phụ thuộc working directory của `pnpm`, package filter hoặc file `.bat`.
  - Đã dừng đúng backend cũ trên cổng 3001 và khởi động backend mới từ `apps/server` để kiểm chứng trường hợp từng gây lỗi.
  - `/health` sau khi khởi động lại trả về `eulerApiKeyConfigured: true` và `tiktokSignConfigured: true`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test và build backend thành công. Chưa chạy lại build toàn web vì lỗi âm thanh ngoài phạm vi đã xác định ở lượt trước.

## [v0.26.2] - 2026-11-02
- **Yêu cầu**: Xóa biến trùng `EULER_API_KEY`, chỉ giữ một biến API key EulerStream và giải thích mục đích của key.
- **Chi tiết kỹ thuật**:
  - `.env` và `.env.1`: xóa dòng `EULER_API_KEY`, giữ nguyên `TIKTOK_SIGN_API_KEY` hiện có mà không hiển thị hoặc thay đổi giá trị bí mật.
  - `.env.example` và `README.md`: chuẩn hóa hướng dẫn Cloud WebSocket và direct connector cùng đọc `TIKTOK_SIGN_API_KEY`.
  - `EulerCloudConnector.ts`: bỏ fallback `EULER_API_KEY`; thông báo thiếu cấu hình giờ chỉ yêu cầu `TIKTOK_SIGN_API_KEY`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test và build riêng backend thành công. Build toàn workspace bị dừng bởi lỗi có sẵn ngoài phạm vi thay đổi: `useInteractionEffectsStore.ts` gọi `playBell`/`playMoktak` chưa tồn tại trên `TempleAudioService`.

## [v0.26.1] - 2026-11-02
- **Yêu cầu**: Đồng bộ hàng chờ và điều phối ưu tiên từ `/overlay-mobile-2d` sang `/overlay-2d`.
- **Chi tiết kỹ thuật**:
  - Nội điện `/overlay-2d` tiếp tục có tối đa 24 người ngồi, bố trí 2 hàng × 12 chỗ.
  - `Mobile2DOverlayPage.tsx`: mở bộ điều phối 24 ghế, thời gian ngồi khi đông, thay ghế theo ưu tiên Donate → Like/Share/Comment → Chỉ xem và cấu hình thời gian hành lễ cho cả hai route 2D.
  - Hàng chờ `/overlay-2d` hiển thị tối đa 12 người trải ngang từ 5% đến 95% chiều rộng; bản mobile tiếp tục hiển thị tối đa 7 người để phù hợp màn hình dọc.
  - `SettingsPanel.tsx`: đổi nhãn cài đặt từ Mobile 2D thành Nội điện 2D và ghi rõ áp dụng cho cả overlay ngang lẫn mobile.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test và production build; Vite vẫn cảnh báo chunk `TempleToolbar` lớn hơn 500 kB như trước.

## [v0.26.0] - 2026-11-02
- **Yêu cầu**: Rút ngắn và cho phép cấu hình thời gian hành lễ Mobile 2D; ưu tiên người tương tác và người donate thay chỗ khách chỉ xem trong Nội điện.
- **Chi tiết kỹ thuật**:
  - `useMonitorStore.ts` và `SettingsPanel.tsx`: thêm năm cài đặt hoạt cảnh Mobile 2D, mặc định khách thường lễ 3 giây, tặng quà quỳ 5 giây, dâng hoa 3,5 giây, đi vào 2,6 giây và đi về ghế 2,4 giây; đồng bộ sang overlay qua cấu hình dùng chung.
  - `Mobile2DOverlayPage.tsx`: áp dụng trực tiếp các thời gian Admin vào CSS transition và timer dự phòng; bổ sung ba tầng ưu tiên ghế Donate → Like/Share/Comment → Chỉ xem, giữ FIFO trong cùng tầng.
  - Khi đủ 24 ghế, Like/Share/Comment thay khách chỉ xem; Donate thay khách chỉ xem trước rồi tiếp tục thay người Like/Share/Comment nếu cần. Người đã bắt đầu đi vào được giữ chu trình để tránh biến mất giữa hoạt cảnh.
  - `useTempleGameStore.ts`: bật bộ đệm ưu tiên lớn riêng khi hàng chờ Nội điện Mobile 2D hoạt động để sự kiện donate mới không bị kẹt sau đám đông; hành vi mặc định của các overlay 3D và 2D desktop vẫn giữ giới hạn cũ.
  - `useTempleGameStore.test.ts`: thêm kiểm thử chế độ điều phối đám đông Mobile 2D.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 43/43 unit test, `git diff --check` cho các file mã nguồn và production build; Vite vẫn cảnh báo chunk `TempleToolbar` lớn hơn 500 kB như trước.

## [v0.25.9] - 2026-11-02
- **Yêu cầu**: Dàn đều người đang chờ vào Nội điện Mobile 2D và chỉ hiển thị người thật trong “Cúng dường mới nhất” trên cả bốn overlay.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`: trải tối đa 7 nhân vật đầu hàng chờ từ 7% đến 93% chiều ngang mép dưới, giảm nhẹ tỉ lệ nhân vật để tránh đứng co cụm hoặc chồng lên nhau; thứ tự FIFO và cơ chế vào theo số ghế trống được giữ nguyên.
  - `useTempleGameStore.ts`: chỉ ghi người cúng dường thật (`isSimulated !== true`) vào `recentDonors`; bổ sung cờ nguồn cho dữ liệu người tặng.
  - `RecentDonorsList.tsx`: lọc phòng vệ dữ liệu mô phỏng trước khi hiển thị, áp dụng chung cho `/overlay`, `/overlay-2d`, `/overlay-mobile` và `/overlay-mobile-2d`.
  - `useTempleGameStore.test.ts`: thêm kiểm thử xác nhận quà mô phỏng không xuất hiện và quà TikTok thật vẫn được ghi nhận.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 42/42 unit test và production build; Vite vẫn cảnh báo chunk `TempleToolbar` lớn hơn 500 kB như trước.

## [v0.25.8] - 2026-11-02
- **Yêu cầu**: Bổ sung hàng chờ FIFO cho Nội điện Mobile 2D khi có hơn 24 khách; cho phép bật/tắt và cấu hình thời gian ngồi tối đa khi đông tại Admin.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`: chỉ kích hoạt bộ điều phối tại `/overlay-mobile-2d` + Nội điện; giữ khách mới sát mép dưới, xếp theo thời gian đến và chỉ đưa đúng số khách tương ứng với số ghế vừa trống.
  - `useTempleGameStore.ts`: bổ sung chế độ cấp lượt FIFO được màn hình Mobile 2D bật khi dùng hàng chờ và tự trả về chế độ ưu tiên cũ khi rời màn hình, không thay đổi hành vi mặc định của 3D.
  - Khi tổng số khách hiện diện vượt 24, thời gian giữ ghế được giới hạn theo cấu hình (mặc định 20 giây); người đang hoạt cảnh hoặc đang chờ không còn xuất hiện sớm trên ghế.
  - `SettingsPanel.tsx`: thêm công tắc “Hàng chờ Nội điện Mobile 2D” và thanh cấu hình thời gian ngồi khi đông từ 10–120 giây.
  - `useMonitorStore.ts`: thêm hai tùy chọn `mobile2dQueueEnabled`, `mobile2dBusySeatSeconds` và đồng bộ thay đổi `localStorage` giữa cửa sổ Admin với tab/OBS overlay đang mở.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 41/41 unit test và production build; Vite vẫn cảnh báo chunk `TempleToolbar` lớn hơn 500 kB như trước.

## [v0.25.7] - 2026-11-02
- **Yêu cầu**: Màn hình 2D (nội điện):
  1. Kiểm tra và giải quyết dứt điểm hiện tượng khách đi tới nơi rồi vẫn đi tiếp, chậm mất 3-4s sau mới đổi hoạt ảnh chắp tay.
  2. Nâng 3 sư thầy và khách lên đứng lễ lên thêm 5~10px.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`:
    - Giải quyết dứt điểm độ trễ đổi hoạt ảnh: Thay vì phụ thuộc vào timer JS (dễ bị reset khi component re-render theo store event làm kéo dài thêm 3-4s), gắn sự kiện `onTransitionEnd` trực tiếp vào element nhân vật. Ngay khi CSS transition trục `top` vừa chạm đúng toạ độ đích, sự kiện phần cứng trình duyệt kích hoạt ngay lập tức chuyển trạng thái sang `PRAYING` (chắp tay niệm Phật) / `BOWING` (quỳ lạy) / `OFFERING_FLOWERS` (dâng hoa) không trễ 1 mili-giây.
    - Nâng vị trí 3 Vị Sư Thầy lên thêm 5~10px: Sư Trụ Trì từ `top: 63%` lên `top: 61.8%`, Thầy Minh Đạo & Thầy Tâm Từ từ `63.5%` lên `top: 62.3%`.
    - Nâng vị trí khách tới đứng lễ lên thêm 5~10px: `worshipTop` từ `64.5%` lên `top: 63.2%`, đứng ngay sau 3 Thầy trên thảm đỏ và cao hơn người ngồi hàng đầu (`top: 69%`).
    - Cập nhật tiến độ chi tiết trong ghi chú mã nguồn.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 41/41 unit test (`pnpm test`), `tsc -b` không có lỗi và build Vite production thành công.

## [v0.25.6] - 2026-11-02
- **Yêu cầu**: 
  1. Cả 2D và 3D: Comment giữ lâu quá bị rối mắt, cho tự động ẩn sau khoảng 20s và thêm tùy chỉnh cài đặt thời gian trong trang Admin.
  2. Màn hình 2D: Khách tới lễ đứng cao lên chút, hiện tại đang đứng thấp hơn người ngồi hàng đầu.
  3. Màn hình 2D: Khắc phục lệch tọa độ và đồng bộ lại thời gian đi lên lễ cho phù hợp.
- **Chi tiết kỹ thuật**:
  - `useMonitorStore.ts` & `SettingsPanel.tsx`:
    - Bổ sung cài đặt `commentDurationSeconds` (mặc định 20 giây, hỗ trợ slider từ 5s - 120s và các nút gán nhanh 10s, 15s, 20s, 30s, 60s), lưu trữ đồng bộ qua `localStorage`.
  - `Character.tsx` & `SeatedVisitors.tsx` (3D):
    - `CharacterHeadOverlay` đọc `commentDurationSeconds` từ `useMonitorStore` và tự động tắt bong bóng comment khi quá thời hạn (`now - createdAt > duration`), quay về tag tên mờ hổ phách trang nghiêm.
  - `Mobile2DOverlayPage.tsx` (2D):
    - `DevoteeHeadBadge`: đồng bộ tự động ẩn bong bóng comment sau thời gian cài đặt ở Admin (mặc định 20s).
    - Căn chỉnh toạ độ khách tới lễ: `worshipTop` dời lên `top: 64.5% - 66%`, trong khi 4 hàng ghế của Phật tử ngồi quỳ hai bên thảm đỏ được xếp ở `[69%, 77%, 85%, 93%]`. Nhờ đó khách tới lễ đứng chầu Phật hoàn toàn **CAO HƠN** người ngồi hàng đầu (69%) và đứng ngay sau lưng 3 Thầy (62% - 63%).
    - Căn chỉnh toạ độ bước đi thẳng theo trục giữa thảm đỏ (`left: 50 + laneOffset * 0.15`), không bị lệch mép thảm đỏ.
    - Chuẩn hóa thời gian bước đi từ cửa lên trước điện thành **3.0s** (`3000ms`), nhịp bước chân khoan thai khớp đúng thời điểm dừng chân hành lễ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 41/41 unit test (`pnpm test`), `tsc -b` không có lỗi và build Vite production thành công.

## [v0.25.5] - 2026-11-02
- **Yêu cầu**: Tinh chỉnh màn hình 2D theo ảnh phản hồi thực tế:
  1. 3 vị trí sư thầy ngồi cao quá, hạ xuống đúng khu vực khoanh màu xanh ở đầu thảm đỏ trên sàn.
  2. Người chơi đi bộ đến điện dừng chân là lễ ngay, không còn tình trạng đứng im bước tại chỗ một lúc mới lễ.
  3. Khách ngồi quỳ xa quá, cho ngồi dịch lên trên các hàng đệm sen phía trên.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`:
    - Đặt lại vị trí 3 Vị Sư Thầy: Sư Trụ Trì (`top: 63%`, `left: 50%`), Thầy Minh Đạo (`top: 63.5%`, `left: 36%`), Thầy Tâm Từ (`top: 63.5%`, `left: 64%`), nằm chuẩn xác trong khung chữ nhật màu xanh lá cây trên đầu thảm đỏ sát chân bàn thờ Tam Bảo.
    - Dịch 24 chỗ ngồi của Phật tử lên trên: 4 hàng ghế chuyển từ `[80, 86, 92, 98]` lên `[67, 75, 83, 91]`, scale tương ứng `[0.96, 1.08, 1.22, 1.38]`, lấp đầy các hàng đệm sen hai bên thảm đỏ từ gần bàn thờ xuống dưới, không còn bị tụt tít ra xa ở đáy màn hình.
    - Đồng bộ nhịp bước đi và hành lễ: Rút ngắn thời gian bước từ cửa vào còn đúng `2.6s` (khoảng cách thực tế từ cửa 106% đến điểm hành lễ 72%), ngay khi vừa chạm mốc 2.6s là lập tức dừng chân chuyển sang tư thế quỳ lạy / niệm Phật / dâng hoa, dứt điểm hiện tượng đứng dậm chân tại chỗ trước khi lễ.
    - Thời gian bước về chỗ ngồi sau khi lễ xong đồng bộ còn `2.4s`, quay mặt về camera (`WALK_FRONT`).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 41/41 unit test (`pnpm test`), `tsc -b` không có lỗi và build Vite production thành công.

## [v0.25.4] - 2026-11-02
- **Yêu cầu**: Đối với màn hình 2D (/overlay-2d, /overlay-mobile-2d):
  1. Đưa 3 sư thầy ngồi lên vị trí cao ở khu vực khoanh màu xanh sát chân bàn thờ.
  2. Tăng 50% kích thước các nhân vật và 3 sư thầy.
  3. Sửa lỗi người không đi từ cửa vào.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`:
    - Đưa 3 Vị Thầy Chùa lên vị trí trang nghiêm đúng khu vực khoanh màu xanh (top: 42.5% - 43%), trên phần đầu thảm đỏ sát chân bàn thờ Tam Bảo: Sư Trụ Trì (`top: 42.5%`, `left: 50%`), Thầy Minh Đạo (`top: 43%`, `left: 38%`), Thầy Tâm Từ (`top: 43%`, `left: 62%`).
    - Tăng 50% kích thước 3 Sư Thầy: scale tăng từ 0.72 / 0.68 lên 1.08 / 1.02.
    - Tăng 50% kích thước Phật tử 24 chỗ ngồi: scale tăng từ 0.74 - 0.98 lên 1.11 - 1.47 (mobile) và từ 0.72 - 0.88 lên 1.08 - 1.32 (desktop).
    - Tăng 50% kích thước nhân vật hành lễ: scale tăng từ 0.76 - 0.82 lên 1.14 - 1.23, điểm hành lễ điều chỉnh về `top: 56% - 60%` đứng/quỳ sau các Thầy chầu Phật.
    - Sửa triệt để lỗi "người không đi từ cửa vào": Sử dụng state quản lý vị trí ban đầu tại cửa phòng (top: 106% dưới đáy màn hình) rồi kích hoạt chuyển động CSS transition 4.5s bước dọc theo thảm đỏ vào chánh điện hành lễ, sau đó bước về chỗ ngồi với hoạt ảnh quay mặt về trước (`WALK_FRONT`).
    - Cập nhật ghi chú tiến độ chi tiết ở đầu file ("ĐÃ CÓ, ĐANG CÓ, SẮP CÓ").
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua toàn bộ 41/41 unit test (`pnpm test`), `tsc -b` không có lỗi và build Vite production thành công.

## [v0.25.3] - 2026-11-02
- **Yêu cầu**: Sửa lỗi hiển thị nhân vật 2D bị cắt sai (lộ chân lên đầu), sửa hoạt ảnh đi lùi đằng lưng cả 2D và 3D, chỉnh lại vị trí 3 Thầy Chùa, bỏ hoa bay ngang tượng Phật và tinh gọn Danh sách Cúng Dường mới nhất.
- **Chi tiết kỹ thuật**:
  - Mobile2DOverlayPage.tsx:
    - Tạo component DevoteeSprite2D cắt ảnh sprite 4x3 bằng container overflow: hidden theo kích thước pixel chuẩn xác, giải quyết dứt điểm lỗi chân hàng trên (Row 1) lộ lên đầu hàng quỳ (Row 2).
    - Khắc phục lỗi đi lùi đằng lưng: khi Phật tử hoàn thành lễ Phật từ trên điện bước xuống chỗ ngồi (EXITING), chuyển sang dùng hoạt ảnh walk-front (female-walk.png Row 1) với khuôn mặt hướng về phía người xem.
    - Đặt lại vị trí 3 Vị Thầy Chùa đúng trên mặt sàn trước bàn thờ Tam Bảo (top: 67%-68%), không còn bị bay lơ lửng trên đèn lồng hay tượng Phật.
    - Chuyển toạ độ 4 hàng ghế Phật tử xuống đúng mặt sàn gỗ (top: 80% - 98%), chừa thảm đỏ ở giữa cho lối đi hành lễ.
    - Loại bỏ dải hoa emoji bay ngang thân tượng Phật.
  - Character.tsx: bổ sung frontWalkTextures từ female-walk.png khi isWalkingFront (state === 'EXITING'), khắc phục triệt để lỗi đi lùi đằng lưng trên cả 2 màn hình 3D (/overlay và /overlay-mobile).
  - RecentDonorsList.tsx: bỏ khung viền và nền gradient nâu dày thô, chuyển sang dạng danh sách trong suốt có bóng chữ nổi bật, thanh thoát và không chiếm diện tích.
  - mobile2d.css: bổ sung lớp .mobile-2d-clipper và .mobile-2d-sheet-img hỗ trợ cắt sprite chính xác.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 41/41 unit test (pnpm test), không có lỗi TypeScript (tsc -b), production build thành công (ite build).

## [v0.25.2] - 2026-11-02
- **Yêu cầu**: Bỏ tự giả lập riêng trong từng overlay và đồng bộ giả lập 1–2 người/5 giây với đúng nút bật/tắt tại Admin.
- **Chi tiết kỹ thuật**:
  - `socketServer.ts`: chuyển timer giả lập tự động lên server thành một nguồn duy nhất; bổ sung lệnh `simulator:auto-control` và sự kiện đồng bộ `simulation:auto-status`.
  - Snapshot/state request trả thêm `simulation.autoEnabled`, giúp Admin, 2D và 3D nhận đúng trạng thái hiện hành kể cả khi mở trang sau khi đã bật giả lập.
  - `SimulatorPanel.tsx`: nút `Bật/Dừng tự động` điều khiển trực tiếp timer server; không còn tạo vòng lặp riêng trong tab Admin.
  - `TemplePage.tsx` và `Mobile2DOverlayPage.tsx`: loại bỏ hoàn toàn `useEffect` tự tạo 1–2 người mỗi 5 giây; overlay chỉ nhận sự kiện do server phát.
  - `TempleToolbar.tsx`: nút `Giả lập: Bật/Tắt` gọi chung lệnh server với nút Admin, không còn là cờ cục bộ độc lập.
  - `useSocket.ts`, `useMonitorStore.ts` và `Snapshot`: đồng bộ trạng thái giả lập server xuống toàn bộ client; cờ hiển thị người giả trong game store thay đổi theo cùng trạng thái này.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 41/41 unit test, TypeScript typecheck và production build.
  - Đã kiểm tra trực tiếp Socket: lệnh bật trả `enabled: true`, lệnh tắt trả `enabled: false` và client nhận đủ hai sự kiện trạng thái `[true, false]`.
  - Giả lập mặc định tắt sau khi server khởi động lại; người dùng bật lại tại `/admin/simulator` khi cần kiểm thử.
  - Các nút gửi sự kiện thủ công và `Vào ngay 1-2 người` tại Admin vẫn hoạt động độc lập theo thao tác người dùng.

## [v0.25.1] - 2026-11-02
- **Yêu cầu**: Tinh chỉnh và đồng bộ giao diện /overlay-mobile-2d giống hoàn toàn bản 3D /overlay-mobile, chỉ khác ở cơ chế hiển thị 2D.
- **Chi tiết kỹ thuật**:
  - Mobile2DOverlayPage.tsx:
    - Tái cấu trúc toàn bộ layout theo tỉ lệ toàn màn hình (100vw x 100vh), bỏ giới hạn co cụm màn hình hẹp trên desktop để hiển thị khoáng đạt y hệt bản 3D.
    - Bổ sung 3 Vị Thầy Chùa quỳ tụng kinh trước điện: Sư Trụ Trì (Lv.100, `nam6.png`, hào quang Phật quang rực rỡ, đệm sen to, mõ gỗ gõ nhịp), Thầy Minh Đạo (Lv.61), Thầy Tâm Từ (Lv.61).
    - Đồng bộ 24 chỗ ngồi quỳ niệm Phật: 4 hàng x 6 chỗ trên mobile (3 chỗ bên trái, 3 chỗ bên phải, thảm đỏ rộng rãi ở giữa), mỗi chỗ ngồi đều có Đệm sen toà thêu vàng (`lotus-cushion.svg`).
    - Đồng bộ huy hiệu DevoteeHeadBadge: Bong bóng comment hoàng kim viền hổ phách, avatar tròn, huy hiệu cấp độ Level, mũi tên trỏ xuống; Tag tên mờ hổ phách bo tròn khi chỉ có tên; ẩn tên Khán giả ảo generic y hệt 3D.
    - Đồng bộ vòng hào quang Phật pháp xoay tròn sau đầu cho Phật tử đạt cấp bậc cao (Lv.81-100).
    - Chu trình di chuyển nhân vật mượt mà bằng CSS transitions: đi vào dọc theo thảm đỏ -> dâng hoa (addFlower) / quỳ lạy 3 lạy / niệm Phật -> bước sang mép thảm đỏ rồi đi về đúng vị trí đệm sen của mình trong 24 chỗ ngồi.
    - Sử dụng trực tiếp thanh điều khiển TempleToolbar chuẩn kèm nút Ẩn/Hiện Eye/EyeOff, link chuyển về "Bản 3D", Bảng Công Đức góc phải và Danh sách Donate góc trái.
  - TempleToolbar.tsx: bổ sung prop extraAction và phản hồi lập tức các nút Tạm dừng, Xóa cảnh.
  - mobile2d.css: chuẩn hóa sprite sheet 4x3 (đứng/chắp tay/dâng hoa, đi bộ 4 frame, quỳ lạy 4 frame, quỳ niệm Phật), hiệu ứng hào quang, mõ gỗ và đốm bụi vàng lơ lửng.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã vượt qua 41/41 unit test (`pnpm test`), không có lỗi TypeScript (`tsc -b`), production build thành công (`vite build`).
  - Ghi chú đầy đủ tiến độ "đã có, đang có, sắp có" và hướng dẫn chi tiết trong file mã nguồn để dễ dàng đọc hiểu và chỉnh sửa thủ công.

## [v0.25.0] - 2026-11-02
- **Yêu cầu**: Đồng bộ bản 2D thành bản sao đầy đủ chức năng của bản 3D, chỉ khác công nghệ và hiệu ứng dựng cảnh.
- **Chi tiết kỹ thuật**:
  - `Mobile2DOverlayPage.tsx`: bổ sung tự giả lập 1–2 người mỗi 5 giây khi chưa kết nối TikTok, đọc tham số `sound`/`muted`, hoa tích lũy, tăng tụng niệm và đầy đủ chu kỳ đi vào → dâng hoa/quà → quỳ lễ → đi vòng → về ghế.
  - `Overlay2DToolbar.tsx`: bổ sung lựa chọn `Ngoại cảnh/Nội điện` và `Lễ gần tượng/Lễ cuối thảm`, đồng bộ tên góc nhìn `Toàn cảnh/Lối vào hoặc Cổng chùa/Điện Phật` với toolbar 3D.
  - Nhân vật 2D dùng chung asset cấp bậc `nu1..nu6`/`nam1..nam6`, công thức giới tính, level, danh hiệu và hào quang với 3D thay vì một sprite nữ cố định.
  - `mobile2d.css`: đồng bộ khoảng cách hành lễ bằng biến chiều sâu, ba góc nhìn, ba mức chất lượng, pause animation, bàn hoa tích lũy và bố trí nội/ngoại cảnh cho desktop/mobile.
  - Thêm hai backdrop ngoại cảnh độc lập `temple-courtyard-2d-desktop.png` và `temple-courtyard-2d-mobile.png`, có lối đi trung tâm và vùng trống hai bên dành cho nhân vật/ghế 2D.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 41/41 unit test, TypeScript typecheck và production build.
  - Đã xác nhận `/overlay-2d`, `/overlay-mobile-2d` và `/overlay` trả HTTP 200 trên preview cục bộ.
  - Khác biệt còn lại là chủ đích: 3D dùng WebGL, mesh, camera phối cảnh, đèn/bóng đổ; 2D dùng ảnh nền, sprite và CSS transform nên nhẹ hơn và không có xoay camera tự do/chiều sâu vật lý.

## [v0.24.1] - 2026-11-02
- **Yêu cầu**: Làm toolbar của overlay 2D giống toolbar 3D và tách biệt hoàn toàn trạng thái điều khiển giữa hai form.
- **Chi tiết kỹ thuật**:
  - Thêm `Overlay2DToolbar.tsx` độc lập, giữ cùng bố cục và nhóm công cụ của `TempleToolbar`: tạm dừng, xóa cảnh, bật/tắt giả lập, nhạc/âm lượng, Mõ–Chuông–Khánh, góc nhìn, chất lượng và chuyển về bản 3D.
  - Tạm dừng và xóa cảnh trên form 2D chỉ tác động store/trạng thái cục bộ của tab 2D, không còn phát lệnh `game:control` điều khiển đồng thời form 3D.
  - Thêm ba góc hiển thị 2D `Toàn cảnh`, `Lối vào`, `Điện Phật`; thêm chế độ đồ họa thấp/vừa/cao điều khiển hiệu ứng ánh sáng riêng của 2D.
  - Khi tạm dừng, cả timer nghiệp vụ và CSS animation của nhân vật/ánh sáng/lễ vật đều dừng; tiếp tục sẽ khởi động lại đúng trên form 2D.
  - Bổ sung phát nhạc nền và mở khóa audio theo tương tác người dùng cho các route 2D.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 41/41 unit test, TypeScript typecheck và production build.
  - Đã xác nhận `/overlay-2d` và `/overlay-mobile-2d` trả HTTP 200 trên preview cục bộ.
  - Hai form chỉ dùng chung nguồn sự kiện TikTok và cấu hình audio đã lưu; state camera/góc nhìn, chất lượng, pause và xóa cảnh được tách riêng.

## [v0.24.0] - 2026-11-02
- **Yêu cầu**: Bổ sung phiên bản 2D cho overlay màn hình ngang `/overlay` mà vẫn giữ nguyên bản 3D hiện tại.
- **Chi tiết kỹ thuật**:
  - Thêm route `/overlay-2d`, tái sử dụng dữ liệu và vòng đời nhân vật của `Mobile2DOverlayPage.tsx` nhưng dùng ảnh `temple-interior-full-backdrop.png` theo bố cục ngang 16:9.
  - Bố trí 24 chỗ ngồi thành 2 hàng, mỗi hàng 12 vị trí hai bên lối đi; điều chỉnh tỉ lệ nhân vật theo chiều sâu cho khung hình desktop.
  - Thêm bộ keyframe riêng cho người đi vào, JOIN và đi vòng hai bên khi rời điện Phật trên bản ngang.
  - Giữ nguyên `/overlay`, `/overlay-mobile` và `/overlay-mobile-2d`; thêm nút trở về bản 3D tương ứng và link `/overlay-2d` trong menu quản trị/Không gian chùa.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 41/41 unit test, TypeScript typecheck và production build.
  - Đã xác nhận `/overlay-2d`, `/overlay-mobile-2d` và `/overlay` đều trả HTTP 200 trên preview cục bộ.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 883 kB của renderer 3D cũ; cảnh báo không làm lỗi build.

## [v0.23.0] - 2026-11-02
- **Yêu cầu**: Thêm một màn hình overlay mobile 2D nhẹ mà không thay đổi hoặc phá vỡ các màn hình 3D hiện tại.
- **Chi tiết kỹ thuật**:
  - Thêm route `/overlay-mobile-2d` và component `Mobile2DOverlayPage.tsx`, dùng ảnh chánh điện full màn hình cùng các lớp DOM/CSS 2D thay cho Three.js.
  - Dùng chung store TikTok hiện tại cho hàng đợi, ưu tiên người thật, comment, avatar, hoa/gift, điểm công đức và danh sách người ngồi.
  - Bổ sung chu trình nhân vật 2D: đi từ cuối thảm lên khu vực lễ Phật, quỳ/lễ, mang hoa hoặc gift kích thước lớn, đi vòng sang hai bên rồi trở về chỗ ngồi.
  - Thêm hiệu ứng sprite đi bộ/quỳ lễ, ánh sáng và đốm bụi nhẹ bằng CSS; hỗ trợ `prefers-reduced-motion` để giảm chuyển động khi thiết bị yêu cầu.
  - Thêm nút ẩn/hiện thanh công cụ, tạm dừng, xóa cảnh và chuyển về `/overlay-mobile`; bổ sung link mở bản 2D trong menu quản trị và trang Không gian chùa.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 41/41 unit test, TypeScript typecheck và production build; route preview cục bộ trả HTTP 200.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 883 kB của màn 3D cũ; route 2D mới được tách riêng khoảng 5,15 kB và không phụ thuộc renderer Three.js khi hiển thị.

## [v0.22.15] - 2026-11-02
- **Yêu cầu**: Sửa toàn bộ lỗi còn lại trong bảng quy đổi điểm, thời gian xem liên tục và phân bổ ghế nhân vật.
- **Chi tiết kỹ thuật**:
  - `CharacterStore.ts` và `useTempleGameStore.ts`: lưu số like tích lũy theo phiên, chỉ cộng 3 điểm khi hoàn thành từng nhóm đủ 10 like và giữ số like dư cho sự kiện tiếp theo.
  - `LiveEvent`, `TikTokConnector.ts` và `EulerCloudConnector.ts`: truyền `coinValue` của gift xuyên suốt từ dữ liệu TikTok đến server và game action; gift không phải hoa được tính đúng bậc coin thay vì luôn rơi về bậc 1–9 coin.
  - `WatchTimeTracker.ts` và `socketServer.ts`: bắt đầu theo dõi từ sự kiện JOIN, tự cộng 20 điểm sau mỗi 5 phút liên tục và dừng theo dõi khi LIVE mất kết nối hoặc kết thúc.
  - `seatingDuration.ts`: dùng chung một công thức thời gian giữ ghế cho cả cấp ghế và hiển thị, tránh cấp lại ghế khi người cúng dường cũ vẫn còn ngồi.
  - `cultivationLevel.ts`: cập nhật mô tả bảng điểm hiện hành và loại bỏ cách đọc gift bằng `any`.
  - Bổ sung test hồi quy cho tích lũy like, bậc coin gift, chu kỳ xem 5 phút và thời gian giữ ghế.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã đạt 41/41 unit test, TypeScript typecheck và production build cho server, shared package và web.
  - TikTok không cung cấp sự kiện rời phòng tương ứng cho từng người xem trong luồng hiện tại, nên thời gian xem được tính liên tục từ JOIN đến khi LIVE mất kết nối hoặc kết thúc.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 883 kB; cảnh báo hiệu năng này không làm lỗi build.

## [v0.22.14] - 2026-11-02
- **Yêu cầu**: Cập nhật toàn bộ bảng quy đổi điểm công đức theo cấu hình mới từ người dùng.
- **Chi tiết kỹ thuật**:
  - `CharacterStore.ts` & `cultivationLevel.ts`:
    - 10 lượt Like: **+3 điểm** (không giới hạn số lượt).
    - Comment hợp lệ: **+5 điểm** (mỗi comment đều được tính điểm).
    - Share livestream: **+30 điểm** (mỗi lượt chia sẻ đều được tính).
    - Follow kênh: **+100 điểm** (tính khi có follow mới).
    - Tham gia livestream (JOIN): **+5 điểm** (mỗi lần tham gia phiên live).
    - Xem liên tục 5 phút: **+20 điểm** (bổ sung hàm `awardWatchTime` cứ đủ 5 phút cộng tiếp 20 điểm).
    - Tặng Hoa/Hoa hồng: **+10 điểm** x số lượng quà.
    - Gift từ 1–9 coin: **+15 điểm** x số lượng gift.
    - Gift từ 10–49 coin: **+40 điểm** x số lượng gift.
    - Gift từ 50–99 coin: **+100 điểm** x số lượng gift.
    - Gift từ 100–499 coin: **+250 điểm** x số lượng gift.
    - Gift từ 500 coin trở lên: **+600 điểm** x số lượng gift.
  - `CharacterStore.test.ts`: Bổ sung test kiểm tra tính điểm watch time (+20 điểm mỗi 5 phút) và kiểm tra tính điểm comment theo thang điểm mới (+5 điểm).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 35/35 unit test đạt; TypeScript và Vite build thành công 100%.


## [v0.22.13] - 2026-11-02
- **Yêu cầu**: Hoàn thành toàn bộ các task còn lại (Task 3, Task 4, Task 5, Task 6):
  - Task 3: Bổ sung danh sách Avatar Donate bên trái màn hình (5 người cúng dường mới nhất).
  - Task 4: Phóng to Bảng Công Đức và kích cỡ chữ thêm 20%.
  - Task 5: Cấu hình riêng cho Overlay-Mobile hàng ngang ngồi 3 người bên trái, 3 người bên phải và thêm 3 hàng ngồi ở dưới (tổng cộng 4 hàng x 6 chỗ = 24 chỗ).
  - Task 6: Bỏ giới hạn thời gian (cooldown) và hạn mức trần khi người dùng tương tác nhanh nhiều cùng lúc.
- **Chi tiết kỹ thuật**:
  - `RecentDonorsList.tsx`: Tạo component hiển thị danh sách 5 người cúng dường mới nhất ở góc bên trái màn hình với avatar tròn viền vàng, tên nickname, tên món quà cúng Phật và số lượng.
  - `useTempleGameStore.ts`: Thêm mảng `recentDonors` cập nhật tự động khi có sự kiện tặng quà (`GIFT`) hoặc dâng hoa (`OFFER_FLOWERS`).
  - `MeritLeaderboard.tsx`: Mở rộng kích thước bảng từ `w-56`/`w-44` lên `w-[270px]`/`w-[210px]`, tăng cỡ chữ tiêu đề, tên thí chủ, điểm số và cấp bậc thêm ~20%.
  - `SeatedVisitors.tsx`: Cập nhật hàm `getMobileSeatPosition` phân bổ 4 hàng ngồi dọc (Hàng đầu + 3 hàng dưới), mỗi hàng gồm 3 người bên trái và 3 người bên phải.
  - `CharacterStore.ts`: Bỏ giới hạn 30 giây trong COMMENT (`now - character.lastCommentAt >= 30_000`), bỏ trần 50 điểm LIKE, bỏ giới hạn 3 lần SHARE; toàn bộ tương tác dồn dập được ghi nhận điểm số realtime không bị ngắt quãng.
  - `CharacterStore.test.ts`: Thêm test xác nhận comment gửi dồn dập liên tiếp vẫn được tính điểm đầy đủ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 34/34 unit test đạt; TypeScript và Vite production build thành công 100%.


## [v0.22.12] - 2026-11-02
- **Yêu cầu**: Điều chỉnh tần suất giả lập ngẫu nhiên 1, 2 người đi vào 1 lần, 5 giây sau lại vào 1, 2 người; không tràn vào ồ ạt (Task 2).
- **Chi tiết kỹ thuật**:
  - `simulatorService.ts`: Xây dựng module phát sinh người giả lập nhịp nhàng:
    - Danh sách tên Phật tử và bình luận cầu an thanh tịnh.
    - Hàm `sendSimulatedBatch()`: mỗi lượt gửi ngẫu nhiên 1 hoặc 2 người (`count = Math.random() < 0.5 ? 1 : 2`), giữa 2 người có giãn cách 600ms tránh đè hoạt ảnh.
  - `TemplePage.tsx`: Tự động kích hoạt luồng giả lập khi bật `allowSimulated` (hoặc bật trên thanh Toolbar chùa); mỗi đợt vào 1-2 người, hẹn giờ đúng 5 giây sau mới vào tiếp 1-2 người tiếp theo, tạm dừng khi có kết nối TikTok thật.
  - `SimulatorPanel.tsx`: Cải tiến giao diện bảng giả lập Admin/Test:
    - Bổ sung nút "Tự động giả lập (1-2 người / 5s)" có thể bật/tắt linh hoạt.
    - Nút "Vào ngay 1-2 người".
    - Nút chạy số lượng (ví dụ 20 người) tuân thủ đúng nhịp 1-2 người mỗi 5 giây, có nút dừng đợt chạy bất cứ lúc nào.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 33/33 unit test đạt; TypeScript và Vite build thành công 100%.


## [v0.22.11] - 2026-11-02
- **Yêu cầu**: Sửa lỗi nhân vật đi về chỗ ngồi bên phải nhưng lại ngồi bên trái; đảm bảo nhân vật đi về đâu thì ngồi đúng vị trí đó; người chơi ngồi ngẫu nhiên theo hàng, hàng đầu full mới đến hàng 2, rồi đến hàng cuối (Task 1).
- **Chi tiết kỹ thuật**:
  - `packages/shared/src/index.ts`: bổ sung trường `seatIndex?: number` trong interface `TempleGameAction`.
  - `useTempleGameStore.ts`:
    - Xây dựng hàm `allocateSeatIndex(seatedVisitors, active, userId, totalSeats)`: kiểm tra ghế trống trong thời hạn, ưu tiên lấp đầy toàn bộ các ghế trống của Hàng đầu (Row 0, 0..11) bằng cách chọn ngẫu nhiên vị trí trống; khi Hàng đầu đầy mới chuyển sang chọn ngẫu nhiên ở Hàng 2 (Row 1, 12..23).
    - Giữ nguyên `seatIndex` cố định cho cùng một người khi họ gửi thêm lượt tương tác mới.
    - Cấp phát `seatIndex` ngay khi đưa action vào hàng đợi/active.
  - `Character.tsx`: tính toạ độ đích đệm sen `[seatX, seatY, seatZ]` trực tiếp từ `action.seatIndex` thay vì tính động theo index mảng; nhân vật đi về bên nào thì về đúng tọa độ của ghế đó.
  - `SeatedVisitors.tsx`: `SeatedFigure` đọc toạ độ theo `visitor.seatIndex`, không còn phụ thuộc vào số thứ tự `index` trong mảng `map()`; khi có người mới vào hoặc có người rời đi, các vị trí ngồi cũ không còn bị đảo lộn.
  - `useTempleGameStore.test.ts`: bổ sung 2 unit test xác nhận hàng đầu được ưu tiên lấp đầy trước khi chuyển sang hàng 2 và giữ nguyên ghế khi tương tác lặp lại.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 33/33 unit test đạt; TypeScript web/server và Vite production build thành công 100%.


## [v0.22.10] - 2026-11-02
- **Yêu cầu**: Bảng Công Đức chỉ được hiển thị người xem TikTok thật, không nhận nhân vật từ trình giả lập.
- **Chi tiết kỹ thuật**:
  - `CharacterStore.ts`: bổ sung cờ SQLite `is_simulated`, tự migration database cũ và nhận diện dữ liệu giả lập từ lịch sử `live_events` cùng quy ước ID/tên `sim-*`, `sim_*`.
  - Tài khoản từng dùng trong giả lập nhưng sau đó xuất hiện qua event TikTok thật được chuyển thành người thật, giữ nguyên điểm và hồ sơ.
  - API `/api/characters`, socket snapshot, `state:request` và `characters:request` chỉ trả danh sách nhân vật thật.
  - `socketServer.ts`: không phát `character:updated` của sự kiện SIMULATOR vào bảng Công Đức.
  - `MeritLeaderboard.tsx`: luôn loại cờ giả lập ở frontend, không còn phụ thuộc cấu hình ẩn/hiện người giả lập của cảnh 3D.
  - Bổ sung test xác nhận database vẫn có thể lưu nhân vật thử nghiệm nhưng danh sách bảng Công Đức chỉ trả người thật.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 31/31 unit test đạt; TypeScript web/server và Vite production build thành công.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 883 KB; đây là cảnh báo tối ưu hiệu năng, không làm build thất bại.

## [v0.22.9] - 2026-11-02
- **Yêu cầu**: Hiển thị đúng avatar TikTok trên tên, bình luận và nhân vật trong chánh điện.
- **Chi tiết kỹ thuật**:
  - `EulerCloudConnector.ts`: đọc avatar từ URL trực tiếp và các cấu trúc TikTok/Euler `profilePicture`, `avatarThumb`, `avatarMedium`, `avatarLarger`, hỗ trợ `urlList`, `url_list`, `urls` và `url`.
  - `TikTokConnector.ts`: chuẩn hóa `profilePictureUrl` khi SDK trả chuỗi hoặc mảng URL.
  - `socketServer.ts`: sau khi nhận diện đúng nhân vật, bổ sung username, nickname và avatar đã lưu trong SQLite vào event thiếu thông tin trước khi tạo action gửi xuống giao diện.
  - Bổ sung test avatar lồng trong payload Euler và test COMMENT thiếu avatar vẫn giữ ảnh của nhân vật cũ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 30/30 unit test đạt; TypeScript web/server và Vite production build thành công.
  - Avatar cũ chỉ được bổ sung sau khi TikTok gửi ít nhất một event có URL ảnh hợp lệ cho nhân vật đó.

## [v0.22.8] - 2026-11-02
- **Yêu cầu**: Giữ âm thanh overlay-mobile khi thao tác ở tab Admin và ngăn COMMENT tạo nhân vật trùng.
- **Chi tiết kỹ thuật**:
  - `TempleAudioService.ts`: lắng nghe `storage` event để tab overlay nhận ngay thay đổi bài hát, âm lượng và trạng thái mute từ tab Admin; bỏ qua `blob:` URL vì URL file cục bộ không dùng được giữa hai tab.
  - `CharacterStore.ts`: khi event có `userId` khác hoặc thiếu ID, tìm nhân vật hiện có theo username TikTok không phân biệt hoa thường trước khi tạo mới.
  - `socketServer.ts`: chuẩn hóa `event.user.id` về ID bền vững trong SQLite trước khi lưu sự kiện và phát socket, để COMMENT tiếp tục đúng nhân vật trên giao diện.
  - `CharacterStore.test.ts`: bổ sung test COMMENT có ID khác vẫn cộng điểm vào nhân vật cũ và không tạo bản ghi thứ hai.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 29/29 unit test đạt; TypeScript web/server và Vite production build thành công.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 883 KB; đây là cảnh báo tối ưu hiệu năng, không làm build thất bại.

## [v0.22.7] - 2026-11-02
- **Yêu cầu**: Sửa toàn bộ lỗi chọn và đổi bài nhạc nền trên trang chùa và trang Cài đặt âm thanh.
- **Chi tiết kỹ thuật**:
  - `TempleAudioService.ts`: đổi bài mặc định sang file MP3 thực tế đang có trong `public/audio`; tự chuyển cấu hình mặc định cũ đã lưu sang bài mới.
  - Chuẩn hóa URL bài hát bằng `new URL()` để tên file tiếng Việt, dấu cách và URL đã encode không làm bài phát lại từ đầu.
  - Khi file nhạc phát thành công, dừng ambient synth fallback; bỏ qua kết quả Promise của bài cũ sau khi người dùng đã chuyển bài.
  - `AudioSettingsPanel.tsx`: khởi tạo nút Play/Pause theo trạng thái phát thật từ service và bỏ các lệnh phát trùng khi đổi preset hoặc URL.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 28/28 unit test đạt; TypeScript web và Vite production build thành công.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 883 KB; đây là cảnh báo tối ưu hiệu năng, không làm build thất bại.

## [v0.22.6] - 2026-11-02
- **Yêu cầu**: Thêm tính năng tự động phát nhạc nền trên các trang overlay OBS (`/overlay`, `/overlay-mobile`) và trang chùa 3D (`/temple`).
- **Chi tiết kỹ thuật**:
  - `TempleAudioService.ts`: Đặt mặc định `isMuted: false` khi khởi tạo (chỉ mute nếu người dùng chủ động tắt trong `localStorage`); bổ sung method `getIsBgmPlaying()`; tối ưu hàm `startBgm()` tự động resume `AudioContext` và khởi tạo lại đối tượng `Audio` khi đổi URL bài hát.
  - `TemplePage.tsx`: Thêm hook `useEffect` tự động phát nhạc nền khi mount trang `/overlay`, `/overlay-mobile` hoặc `/temple`; hỗ trợ điều khiển qua URL query params `?sound=1` hoặc `?muted=1` (tiện ích cho OBS Studio Browser Source); thêm listener mở khóa chính sách Autoplay Policy của trình duyệt khi có tương tác đầu tiên; ngắt nhạc sạch sẽ khi unmount.
  - `Character.tsx`: Khắc phục cảnh báo kiểu `CharacterState` trong `tsc -b`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 28/28 unit test đạt; `tsc -b` và Vite production build thành công 100%.


## [v0.22.5] - 2026-11-02
- **Yêu cầu**: Tắt tự động phát 3 âm thanh nghi lễ (Gõ Mõ, Đại Hồng Chung, Khánh Dâng Hoa), chuyển sang cơ chế admin chủ động gõ; load danh sách nhạc nền trực tiếp từ các file thực tế trong thư mục `apps/web/public/audio/`.
- **Chi tiết kỹ thuật**:
  - `ChantingMonks.tsx`: Gỡ bỏ lệnh tự động phát `templeAudio.playWoodenFish(0)` theo nhịp frame của Sư Trụ Trì; giữ chuyển động 3D của dùi mõ mà không phát âm thanh ngoài ý muốn.
  - `useTempleGameStore.ts`: Gỡ bỏ tự động phát chuông và khánh khi nhận sự kiện dâng hoa (`OFFER_FLOWERS`) và tặng quà (`GIFT`).
  - `TempleToolbar.tsx`: Bổ sung 3 nút chủ động `[🪵 Mõ]`, `[🔔 Chuông]`, `[✨ Khánh]` trên thanh công cụ chánh điện 3D để admin chủ động gõ theo ý muốn.
  - `AudioSettingsPanel.tsx`: Thêm nút chủ động gõ mõ, đánh chuông, đánh khánh với nhãn rõ ràng; cập nhật Combobox tự động fetch danh sách file audio thực tế từ thư mục `apps/web/public/audio/` kèm nút "Làm mới danh sách" (Refresh) để cập nhật ngay khi copy file mới vào folder Windows Explorer.
  - `apps/server/src/index.ts` & `apps/web/vite.config.ts`: Thêm API endpoint `/api/audio-files` quét thư mục `public/audio` và trả về danh sách file nhạc (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 28/28 unit test đạt; TypeScript web/server compile không có lỗi.


## [v0.22.4] - 2026-11-02
- **Yêu cầu**: Sửa rò rỉ bộ nhớ khi người dùng tải và đổi nhiều file nhạc nền từ máy tính.
- **Chi tiết kỹ thuật**:
  - `TempleAudioService.ts`: thu hồi `blob:` URL cũ bằng `URL.revokeObjectURL()` khi chuyển sang file hoặc preset khác.
  - Giữ nguyên object URL của bài đang phát để nhạc không bị ngắt khi người dùng rời trang Cài đặt âm thanh.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 28/28 unit test đạt; TypeScript web và Vite production build thành công.
  - Vite vẫn cảnh báo chunk `TempleToolbar` khoảng 882 KB; đây là cảnh báo tối ưu hiệu năng, không làm build thất bại.

## [v0.22.3] - 2026-11-02
- **Yêu cầu**: Cải tiến cấu hình nhạc nền BGM thành Combobox chọn bài có sẵn, hỗ trợ nạp file trực tiếp từ máy tính và tạo sẵn file âm thanh mẫu trong thư mục audio.
- **Chi tiết kỹ thuật**:
  - `AudioSettingsPanel.tsx`:
    - Thay thế ô nhập URL thô bằng thẻ `<select>` (Combobox) với các tùy chọn bài nhạc mẫu có sẵn (`/audio/bgm-thien-tinh-tam.wav`, `/audio/bgm.wav`), chế độ âm thiền tự sinh (`synth`) và tùy chọn nhập URL tùy biến.
    - Bổ sung nút "Chọn file nhạc từ máy tính (.mp3, .wav)" qua `<input type="file">` giúp người dùng nạp bài nhạc bất kỳ từ máy tính để phát ngay lập tức bằng `URL.createObjectURL(file)`.
    - Bổ sung bảng hướng dẫn nguồn tải nhạc nền Phật giáo (Nam Mô A Di Đà Phật, Chú Đại Bi, YouTube Audio Library, Pixabay Music, FreePD).
  - `TempleAudioService.ts`: Bổ sung hàm `setBgmTrack(url)` và `getCurrentBgmUrl()` hỗ trợ chuyển đổi linh hoạt giữa các track BGM, cập nhật tức thời khi người dùng chọn trong combobox.
  - `apps/web/public/audio/`: Tạo sẵn 2 file âm thanh chuẩn 16-bit PCM Stereo 44.1kHz (`bgm-thien-tinh-tam.wav` và `bgm.wav`) với âm sắc chuông thiền Tây Tạng êm dịu.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 28/28 unit tests passed. TypeScript web/server compile không có lỗi.


## [v0.22.2] - 2026-11-02
- **Yêu cầu**: Sửa hạn mức tích điểm giữa các buổi livestream và đồng bộ username mới của nhân vật vào SQLite.
- **Chi tiết kỹ thuật**:
  - `CharacterStore.ts`: thêm `resetLiveSessionLimits()` để bắt đầu lại hạn mức LIKE, COMMENT cooldown, SHARE, JOIN và watch time cho mỗi lần kết nối live thành công; giữ nguyên vĩnh viễn tổng điểm, level, cấp bậc, hồ sơ và trạng thái thưởng FOLLOW.
  - `CharacterStore.ts`: cập nhật `username` mới khi TikTok trả cùng `userId`, tránh giữ tên đăng nhập cũ trong database.
  - `socketServer.ts`: gọi reset hạn mức phiên sau khi kết nối TikTok thành công; kết nối thất bại không làm thay đổi hạn mức.
  - `CharacterStore.test.ts`: bổ sung kiểm thử reset phiên không mất tiến trình nhân vật và lưu username mới.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 9/9 test CharacterStore và game store đạt; TypeScript server không có lỗi.

## [v0.22.1] - 2026-11-02
- **Yêu cầu**: Sửa các lỗi đồng bộ điểm, level và thông tin nhân vật tồn tại vĩnh viễn giữa các buổi live; rà soát thêm lỗi runtime.
- **Chi tiết kỹ thuật**:
  - `apps/web/vite.config.ts`: thêm proxy `/api` sang server `127.0.0.1:3001` để API nhân vật hoạt động trong môi trường development.
  - `useTempleGameStore.ts`: lưu điểm offline khi một nhân vật gửi LIKE liên tiếp; thao tác xóa cảnh không còn xóa điểm/level nhân vật đã đồng bộ; sửa quà Hoa phát đúng tiếng khánh dâng hoa.
  - `socketServer.ts`: `state:request` luôn đọc danh sách nhân vật mới nhất từ SQLite thay vì trả snapshot cũ lúc kết nối.
  - `MeritLeaderboard.tsx`: hiển thị cấp bậc `rankName` đã tính từ level trên server, không tự tạo hệ thống danh hiệu khác theo vị trí bảng xếp hạng.
  - `ChantingMonks.tsx`: cập nhật trực tiếp texture của material khi đổi frame để hoạt ảnh tụng kinh thực sự chuyển động.
  - `useTempleGameStore.test.ts`: bổ sung kiểm thử cộng điểm LIKE liên tiếp và giữ điểm nhân vật khi xóa cảnh.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 7/7 test game store đạt; TypeScript web/server và Vite production build thành công.
  - Vite cảnh báo chunk `TempleToolbar` sau minify khoảng 882 KB; cần tách bundle ở một lượt tối ưu hiệu năng riêng.

## [v0.22.0] - 2026-11-02
- **Yêu cầu**: Thêm hệ thống âm thanh chánh điện (nhạc thiền BGM, tiếng gõ mõ, chuông đại hồng chung, khánh dâng hoa) và trang Cài đặt Nhạc & Âm thanh trong Admin.
- **Chi tiết kỹ thuật**:
  - File TempleAudioService.ts: Xây dựng service quản lý âm thanh bằng Web Audio API:
    - Tiếng Gõ Mõ (Wooden Fish): Xung tần số 540Hz kèm hoạ âm gỗ mộc và bandpass filter buồng rỗng.
    - Đại Hồng Chung (Temple Bell): Tiếng chuông chùa ngân vang 5.5s với 5 tầng hoạ âm ấm trầm uy nghiêm.
    - Tiếng Khánh Dâng Hoa (Chime): Âm kim loại trong trẻo ngân nga khi thí chủ cúng dường.
    - Nhạc nền chánh điện (BGM): Tự động phát lặp lại file /audio/bgm.mp3 (hoặc phát nhạc thiền Ambient Drone tự sinh nếu chưa có file MP3).
  - File AudioSettingsPanel.tsx & AdminPage.tsx: Thêm mục "Cài đặt Nhạc & Âm thanh" (/admin/audio) trong menu Admin với giao diện tùy chỉnh âm lượng, bật/tắt tiếng, nghe thử tiếng chuông mõ và đổi URL nhạc nền.
  - File TempleToolbar.tsx: Bổ sung nút Bật/Tắt âm thanh kèm thanh trượt âm lượng (Volume Slider) trực tiếp trên thanh điều khiển chánh điện 3D.
  - File ChantingMonks.tsx & useTempleGameStore.ts: Đồng bộ tiếng gõ mõ theo nhịp chuyển động của Sư Trụ Trì và phát tiếng chuông/khánh khi có sự kiện SHARE hoặc GIFT.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 24/24 unit tests passed. TypeScript check và Vite build thành công 100%.


## [v0.21.4] - 2026-11-02
- **Yêu cầu**: Chuyển bảng Công Đức sang lấy 100% dữ liệu thật từ Database SQLite, loại bỏ hoàn toàn danh sách mẫu seedDonors.
- **Chi tiết kỹ thuật**:
  - File MeritLeaderboard.tsx: Xóa bỏ toàn bộ danh sách mẫu seedDonors. Bảng xếp hạng giờ đây kết nối trực tiếp với danh sách nhân vật thực tế từ SQLite (API /api/characters và socket realtime).
  - Tự động vinh danh Top 5 thí chủ có điểm công đức cao nhất: Top 1 (Đại Hộ Pháp), Top 2-3 (Hộ Pháp), Top 4-5 (Thí Chủ). Khi chưa có ai công đức sẽ hiển thị thông báo "Chưa có thí chủ công đức".
  - File useTempleGameStore.ts & useSocket.ts: Bổ sung characterList vào store và đồng bộ đầy đủ các trường thông tin nhân vật từ SQLite database.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 24/24 unit tests passed. TypeScript check 0 lỗi.


## [v0.21.3] - 2026-11-02
- **Yêu cầu**: Hiển thị số Level thuần túy trên đầu nhân vật (không có chữ Lv. và danh hiệu); đặt Sư Trụ Trì ở giữa (Lv.100), 2 thầy bên cạnh là Lv.61.
- **Chi tiết kỹ thuật**:
  - File Character.tsx: Cập nhật CharacterHeadOverlay hiển thị số level thuần túy trong huy hiệu màu gradient (không kèm tiền tố "Lv." và không kèm danh hiệu chữ). Tên và bong bóng bình luận giữ nguyên.
  - File ChantingMonks.tsx:
    - Thầy ngồi giữa (Sư Trụ Trì): Giữ cấp 100 với asset nam6.png và vòng hào quang Phật quang rực rỡ.
    - 2 Thầy ngồi cạnh (Thầy Minh Đạo & Thầy Tâm Từ): Chuyển sang cấp 61 (nam5.png, phẩm cấp Tỳ kheo).
    - Huy hiệu trên đầu 3 thầy hiển thị số level thuần túy (100 và 61).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 24/24 unit tests passed. TypeScript check không có lỗi.


## [v0.21.2] - 2026-11-02
- **Yêu cầu**: Sửa lỗi tọa độ UV cắt sprite sheet khiến nhân vật đi bộ bị dính bàn chân của hàng trên vào đầu.
- **Chi tiết kỹ thuật**:
  - File Character.tsx, SeatedVisitors.tsx, ChantingMonks.tsx: Phân tích lại ranh giới thực tế của 12 bộ ảnh spritesheet (hàng 0 chiếm 38%, hàng 1 chiếm 33%, hàng 2 chiếm 27% chiều cao).
  - Cập nhật UV Three.js:
    - Hàng 0 (đứng): offset.y = 0.62, repeat.y = 0.38 (V: [0.62 .. 1.00])
    - Hàng 1 (đi bộ): offset.y = 0.28, repeat.y = 0.33 (V: [0.28 .. 0.61]) -> triệt tiêu hoàn toàn phần chân của hàng 0
    - Hàng 2 (quỳ lễ): offset.y = 0.00, repeat.y = 0.27 (V: [0.00 .. 0.27])
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã chạy kiểm tra Vite build (npx vite build) thành công 100%. Đã kiểm thử quét pixel 12 file spritesheet.


## [v0.21.1] - 2026-11-02
- **Yêu cầu**: Sửa lỗi cú pháp syntax thừa dòng ở file ChantingMonks.tsx khiến Vite báo lỗi Pre-transform error.
- **Chi tiết kỹ thuật**:
  - File ChantingMonks.tsx: Loại bỏ khối ternary và thẻ HTML trùng lặp ở cuối file (dòng 197–209).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Đã chạy kiểm tra Vite build (npx vite build) thành công 100%. 24/24 unit tests passed.


## [v0.21.0] - 2026-11-02
- **Yêu cầu**: Tích hợp 12 bộ hoạt ảnh nhân vật theo level (nam1-6, nu1-6), thiết lập bảng quy đổi điểm công đức kèm giới hạn đề xuất, lập trình 20 mốc level (Lv.1-100, mở hào quang từ Lv.90) và lưu trữ nhân vật bền vững vào database SQLite.
- **Chi tiết kỹ thuật**:
  - **12 bộ hoạt ảnh theo level (Character.tsx, SeatedVisitors.tsx, ChantingMonks.tsx)**: Tích hợp đầy đủ 12 bộ sprite sheet lưới 4 cột x 3 hàng (nam1..6.png, nu1..6.png). Cắt 3 hàng: hàng 0 (đứng & nghi lễ), hàng 1 (đi bộ), hàng 2 (quỳ cúi lễ). Tự động xác định asset theo giới tính và level. 3 Thầy chùa mặc trang phục Trụ trì cao nhất (Lv.100, nam6.png).
  - **Bảng điểm công đức & Mốc Level (cultivationLevel.ts)**: Áp dụng bảng điểm theo đúng quy định (Like, Comment 30s cooldown, Share, Follow, Join, Hoa/Rose và Gift các bậc coin). Phân tầng 6 cấp bậc tu tập với 20 mốc nội suy điểm chính xác từ Lv.1 đến Lv.100, mở hào quang xoay sáng từ Lv.90 (>= 17.000 điểm).
  - **Lưu trữ SQLite Database (CharacterStore.ts, apps/server/src/index.ts, socketServer.ts, packages/shared/src/index.ts)**: Tạo bảng user_characters trong SQLite (data/tiktok-live.db), tự động tính và cộng dồn điểm, kiểm tra các giới hạn đề xuất (like max 50/buổi, comment 30s, share max 3, follow 1 lần, join 1 lần). Bổ sung API GET /api/characters và socket event character:updated, đồng bộ trực tiếp điểm và level vào giao diện web realtime.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 24/24 unit tests passed. TypeScript typecheck 0 lỗi trên cả server, shared và web. Đã cập nhật tasks.md.


## [v0.20.0] - 2026-11-02
- **Yêu cầu**: Tinh chỉnh 3 luồng hành lễ và thời gian ngồi: Khách JOIN đi thẳng vào chỗ ngồi quỳ giữ 2 phút rồi đi ra; Comment/tim hiện lên đầu hành lễ 5s về ngồi 2 phút; Donate hoa/quà hành lễ 10s về ngồi 4 phút (kèm thưởng thêm giờ cho level cao và tặng nhiều).
- **Chi tiết kỹ thuật**:
  - **Khách JOIN (`useTempleGameStore.ts`, `Character.tsx`, `SeatedVisitors.tsx`)**: Đưa sự kiện JOIN vào queue đi bộ từ cổng chùa, thiết lập lộ trình `path` rẽ thẳng vào vị trí đệm sen `[seatX, 0, seatZ]` mà không đi lên bàn thờ; khi đến nơi lập tức ngồi quỳ niệm Phật và tự động rời đi sau đúng 2 phút (120 giây).
  - **Tương tác like/comment (`Character.tsx`, `SeatedVisitors.tsx`)**: Khi có lượt thích (`LIKE`), tự động hiển thị biểu tượng `❤️ Thả tim cúng Phật` lên đầu; nhân vật bước lên bàn thờ chắp tay cầu nguyện 5.0s rồi quay về chỗ ngồi quỳ giữ đúng 2 phút (120 giây).
  - **Tương tác donate (`Character.tsx`, `SeatedVisitors.tsx`)**: Nhân vật dâng hoa/lễ vật quỳ lạy sâu 10.0s rồi quay về hàng đệm toà sen; thời gian ngồi cơ bản là 4 phút (240 giây), cộng thêm thời gian phụ thuộc vào cấp độ tu tập và số lượng quà tặng (`bonus = level * 2s + giftCount * 2s`, tối đa cộng thêm 3 phút).
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 23/23 unit tests đều passed. Toàn bộ danh sách tác vụ được cập nhật trong `tasks.md`.


## [v0.19.1] - 2026-11-02
- **Yêu cầu**: Đặt mặc định chế độ giả lập luôn BẬT trên tất cả các trang; sửa lỗi chuyển trạng thái và lộ trình về chỗ ngồi của nhân vật sau khi cúng lễ (gift, rose, like).
- **Chi tiết kỹ thuật**:
  - **Mặc định giả lập BẬT (`TemplePage.tsx`, `useTempleGameStore.ts`)**: Loại bỏ lệnh tự động tắt giả lập ở overlay, đảm bảo cờ `allowSimulated: true` là mặc định xuyên suốt trên toàn bộ ứng dụng (`/temple`, `/test`, `/overlay`, `/overlay-mobile`). Người dùng có thể bật/tắt thủ công qua nút trên thanh điều khiển khi cần.
  - **Sửa luồng về chỗ ngồi sau khi cúng lễ (`Character.tsx`, `useTempleGameStore.ts`)**:
    - Nâng ngưỡng nhận diện waypoint đến đích từ `0.12m` lên `Math.max(0.25, delta * 3.5)` và ép vị trí `position.copy(target)` khi đến đích cuối, giải quyết triệt để lỗi overshoot khiến nhân vật bị kẹt không chuyển sang `COMPLETED`.
    - Tính toán `resolvedSeatIndex` chuẩn xác để mỗi nhân vật luôn có vị trí ghế cụ thể trong 2 hàng quỳ, tránh trường hợp lệch index hoặc dồn về ghế 0.
    - Trong `complete()`: Tự động ghi nhận `seatedAt` và bổ sung người dùng vào danh sách `seatedVisitors` ngay khi bước về đến đệm sen.
    - Điều chỉnh thời gian quỳ lạy `BOWING` về 10.0 giây (2 lạy sâu ngũ thể đầu địa trang nghiêm, đúng khung 10-20s theo yêu cầu) để luồng di chuyển diễn ra nhịp nhàng, dứt khoát và tự nhiên.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 23/23 unit tests đều passed. TypeScript check không có lỗi.


## [v0.19.0] - 2026-11-02
- **Yêu cầu**: Sửa triệt để Task 9 (mặc định Nội điện) và triển khai hoàn thiện Task 11 (nút bật/tắt người giả lập), Task 12 (thêm link overlay và overlay-mobile vào menu left), Task 13 (hệ thống Level tu tập và thăng cấp đạo hạnh, 3 thầy max level).
- **Chi tiết kỹ thuật**:
  - **Task 9 (`TestPage.tsx`, `TempleScene.tsx`, `TemplePage.tsx`)**: Đổi dứt điểm giá trị khởi tạo theme mặc định sang `'INTERIOR'` tại `TestPage.tsx` (Phòng thử nghiệm 3D) và default prop của `TempleScene.tsx`. Đảm bảo người dùng vào bất kỳ trang nào đều hiển thị ngay Nội điện chánh điện Phật.
  - **Task 11 (`TempleToolbar.tsx`, `useTempleGameStore.ts`, `TemplePage.tsx`)**: Bổ sung nút chuyển đổi `[Giả lập: Bật / Tắt]` trên thanh điều khiển; thêm cờ `allowSimulated` và logic chặn enqueue nhân vật giả lập khi ở chế độ Tắt.
  - **Task 12 (`AdminPage.tsx`)**: Thêm 2 đường dẫn điều hướng trực tiếp `Overlay OBS (Ngang)` (`/overlay`) và `Overlay Mobile (Dọc)` (`/overlay-mobile`) vào menu Sidebar bên trái.
  - **Task 13 (`cultivationLevel.ts`, `Character.tsx`, `SeatedVisitors.tsx`, `ChantingMonks.tsx`)**: Xây dựng hệ thống cấp bậc tu tập Phật giáo theo lộ trình: Khách hành hương (Lv.1-10) → Phật tử (Lv.11-25) → Cư sĩ (Lv.26-40) → Sa di (Lv.41-60) → Tỳ kheo (Lv.61-80) → Trụ trì (Lv.81-100). Cứ 10 lần tương tác tăng 1 cấp. Hiển thị huy hiệu Level trên đầu và trong khung thoại bình luận. Mặc định 3 thầy chùa mang cấp độ tối cao **Lv.100 Trụ trì**.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 23/23 unit tests đều passed. TypeScript compile 0 lỗi. Toàn bộ 13 tác vụ được lưu trong `tasks.md` chờ nghiệm thu từ người dùng.


## [v0.18.0] - 2026-11-02
- **Yêu cầu**: Cập nhật 5 tác vụ tiếp theo (Task 7 - 11): khách quan sát ngồi 2 phút; khách donate/tương tác xong xuống ngồi 4 phút rồi mất; mặc định chọn "Nội điện"; 3 thầy chùa mặc áo vàng đồng phục lễ; ẩn khách giả lập tại `/overlay` và `/overlay-mobile`.
- **Chi tiết kỹ thuật**:
  - **Task 7 & 8 (`useTempleGameStore.ts`, `SeatedVisitors.tsx`, `packages/shared/src/index.ts`)**: Bổ sung trường `seatedAt` theo dõi thời điểm bắt đầu ngồi. Khách chỉ ngồi quan sát (`JOIN`/`WELCOME`) có thời gian ngồi tối đa 2 phút (120 giây). Khách có tương tác dâng lễ cúng Phật (GIFT, COMMENT, LIKE) khi hoàn tất lễ và đi về hàng ghế sẽ được tính mốc `seatedAt` ngồi 4 phút (240 giây) rồi tự động ẩn đi.
  - **Task 9 (`TemplePage.tsx`)**: Đổi cấu hình theme khởi tạo mặc định sang `'INTERIOR'` (Nội điện) thay vì `'COURTYARD'` (Ngoại cảnh).
  - **Task 10 (`ChantingMonks.tsx`, `monk-kneeling-yellow.png`)**: Tạo asset hình ảnh mới `monk-kneeling-yellow.png` (nhà sư đầu cạo mặc áo cà sa vàng đồng phục lễ trang nghiêm nhìn từ phía sau) và cập nhật texture hiển thị cho 3 thầy chùa tụng kinh.
  - **Task 11 (`TemplePage.tsx`, `TempleScene.tsx`, `SeatedVisitors.tsx`, `MeritLeaderboard.tsx`)**: Bổ sung cờ `hideSimulated={overlay}` cho các trang `/overlay` và `/overlay-mobile`, tự động lọc bỏ toàn bộ nhân vật giả lập (`isSimulated === true`) ở cả hàng đi lễ, hàng quỳ và bảng xếp hạng Công Đức ✦.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - 23/23 unit tests đều đạt kết quả pass. TypeScript typecheck không có lỗi. Toàn bộ 11 tác vụ được lưu trong `tasks.md` chờ nghiệm thu từ người dùng.


## [v0.17.0] - 2026-11-02
- **Yêu cầu**: Triển khai trọn bộ 6 cải tiến chánh điện 3D (luồng lễ 10-20s, kích thước nhân vật, avatar TikTok & bong bóng bình luận, phân bổ khán giả JOIN ngồi 2 hàng, bảng xếp hạng Công Đức ✦ và 3 thầy chùa tụng kinh gõ mõ).
- **Chi tiết kỹ thuật**:
  - **Task 1 & 2 (`apps/web/src/game/components/Character.tsx`)**: Kéo dài thời gian quỳ lạy cúng Phật lên 14 giây (3 chu kỳ lạy sâu); thiết lập trạm cắm hương riêng `incenseStation` tại `z = 1.35`; điều chỉnh tỷ lệ chiều sâu `depthScale = 0.90 + 0.10 * depthProgress` và kích thước sprite `1.9m x 2.6m` giúp nhân vật tiến vào gần bàn thờ giữ lại ~90% kích thước ban đầu, không bị thu nhỏ quá mức.
  - **Task 3 (`Character.tsx`)**: Tích hợp `CharacterHeadOverlay` hiển thị avatar tròn TikTok trên đỉnh đầu nhân vật. Khi người dùng bình luận (`message`), tự động ẩn nickname và bung khung thoại bong bóng vàng hổ phách hiển thị lời bình kèm avatar nổi bật.
  - **Task 4 (`useTempleGameStore.ts`, `SeatedVisitors.tsx`)**: Chuyển hướng sự kiện `JOIN` (khán giả mới vào livestream chưa có tương tác sâu) trực tiếp vào danh sách người ngồi quỳ `seatedVisitors`, không xếp vào hàng diễu hành dâng hương. Xếp ngay ngắn thành 2 hàng toà sen ở 2 bên thảm đỏ (`z = 4.8` và `z = 7.2`), tránh che khuất bàn thờ và lư hương.
  - **Task 5 (`apps/web/src/game/components/MeritLeaderboard.tsx`, `TemplePage.tsx`)**: Thêm bảng xếp hạng nổi "✦ Công Đức ✦" bằng gỗ viền vàng ở góc trên bên phải, vinh danh Top 5 thí chủ đóng góp với các cấp bậc danh hiệu: Đại Hộ Pháp (Top 1), Hộ Pháp (Top 2-3), Thí Chủ (Top 4-5) kèm cập nhật điểm số công đức thời gian thực.
  - **Task 6 (`apps/web/src/game/components/ChantingMonks.tsx`, `TempleScene.tsx`)**: Thêm 3 vị sư tụng kinh trước bàn thờ chính trong Nội điện: Sư Trụ Trì ở giữa có vòng hào quang xoay sáng, Thầy Minh Đạo bên trái và Thầy Tâm Từ bên phải, kèm mô hình mõ gỗ và dùi gõ chuyển động nhịp nhàng theo chu kỳ tụng kinh 1.2s.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Toàn bộ 23/23 unit tests đều passed. Đã kiểm tra typecheck TypeScript hoàn tất không có lỗi. Các task đã hoàn thành về mặt kỹ thuật và đang chờ người dùng kiểm tra thực tế trên trình duyệt để xác nhận đóng task.


## [v0.16.1] - 2026-11-02
- **Yêu cầu**: Sửa lỗi cú pháp Babel unexpected token ở cuối file `SeatedVisitors.tsx`.
- **Chi tiết kỹ thuật**:
  - Loại bỏ các thẻ đóng dư thừa (`</group>`, `);`, `}`) ở cuối `apps/web/src/game/components/SeatedVisitors.tsx`.
  - Kiểm tra chạy lại `vite build` và xác nhận build thành công trơn tru.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Không có. Build production Vite và TypeScript typecheck đều hoàn tất thành công.

## [v0.16.0] - 2026-11-02
- **Yêu cầu**: Thay thế hình ảnh người que/khối thô bằng bộ assets Phật tử, hoạt ảnh cúi lạy, đệm sen và khói hương từ dự án chuaonline (PhatMTV3).
- **Chi tiết kỹ thuật**:
  - Sao chép toàn bộ bộ assets đồ họa từ `D:\WORK\HKD\another-products\chuaonline\PhatMTV3\app\public\assets\` vào `apps/web/public/assets/`, bao gồm: `female-walk.png`, `female-standing.png`, `female-bow.png`, `lotus-cushion.svg`, `luxury-cushion.svg`, `golden-lotus.svg`, `peach-blossom.svg`, `temple-warm-carpet.png`, `tiktok-gifts-atlas.png`, `top-supporter-frame.svg`.
  - Thay thế các khối hình học người que 3D (`capsuleGeometry`, `sphereGeometry`) trong `apps/web/src/game/components/Character.tsx` bằng `DevoteeSprite` cắt frame spritesheet 2D sống động: bước đi vào chánh điện (walk cycle 4 frames), đứng niệm Phật/dâng hoa/hương (standing 4 frames) và quỳ lạy sát đất ngũ thể đầu địa (bow cycle 4 frames).
  - Cập nhật `apps/web/src/game/components/SeatedVisitors.tsx`: Bỏ các hộp khối nâu và người que 3D, thay bằng đệm toà sen thêu vàng `lotus-cushion.svg` và Phật tử áo lam ngồi chắp tay niệm Phật, có hoạt ảnh cúi lạy nhẹ nhàng định kỳ.
  - Cập nhật `apps/web/src/game/components/TempleInterior.tsx`: Nâng cấp làn khói hương `IncenseSmoke` uốn lượn bay lên mềm mại cùng đốm than đỏ rực sáng và ánh sáng dịu nhẹ ở đầu các nén nhang trên bàn thờ chính.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
  - Toàn bộ 22 unit tests đều pass. Đã kiểm tra build TypeScript không có lỗi. Các texture frame được tạo và tái sử dụng hiệu quả, đảm bảo hiệu năng 60 FPS mượt mà.

## [v0.15.1] - 2026-10-31
- **Yêu cầu**: Thay ni cô bằng nữ Phật tử có tóc và làm hoa/gift thật lớn, dễ nhìn trên mobile.
- **Chi tiết kỹ thuật**:
 - Thêm `female-worshipper-walking-mobile.png` và `female-worshipper-kneeling-mobile.png`: nữ Phật tử tóc búi, áo lam, nhìn từ phía sau; thay cho hai cutout ni cô ở tỷ lệ nữ 11/12.
 - Thêm `MobileOfferingBadge` tách khỏi mô hình người: hoa hiển thị bằng bó `💐`, gift bằng hộp `🎁` cỡ lớn, có tên gift và số lượng `×N`.
 - Lễ vật có nền tương phản, viền vàng, bóng sáng và chuyển động nhún nhẹ; chỉ ẩn khi nhân vật rời khu lễ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Hai cutout nữ Phật tử được tạo bằng công cụ imagegen tích hợp. Build frontend/backend/shared thành công; 22 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.15.0] - 2026-10-31
- **Yêu cầu**: Khán giả chủ yếu là ni cô nữ, hiển thị avatar TikTok, đưa người tặng quà lên hàng lễ gần Phật, sửa lỗi người xuất hiện giữa tượng và tăng kích thước nhân vật.
- **Chi tiết kỹ thuật**:
 - Thêm hai cutout ni cô `nun-walking-mobile.png`/`nun-kneeling-mobile.png`; mobile chọn ni cô cho 11/12 tài khoản và chỉ giữ khoảng 1/12 nhân vật nam.
 - Mang `avatarUrl` từ `LiveEvent.user` vào game action; nhãn người đi và người ngồi hiển thị avatar TikTok cạnh nickname khi có dữ liệu.
 - Tăng kích thước billboard mobile khoảng 20% cho cả người đi và người quỳ/ngồi.
 - Gift/hoa dùng hàng lễ thứ nhất tại `z≈4.7`, gần Phật hơn; tương tác khác dừng từ `z≈6`, vẫn chia làn và vị trí để tránh chồng nhau.
 - Khởi tạo root nhân vật ngay tại `spawn z=14` trước frame đầu tiên, loại bỏ hiện tượng lóe/xuất hiện từ giữa tượng Phật.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Hai cutout ni cô được tạo bằng công cụ imagegen tích hợp. Build frontend/backend/shared thành công; 22 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.14.0] - 2026-10-31
- **Yêu cầu**: Làm luồng người đi/khấn tự nhiên, không xếp thẳng hoặc chồng vị trí; ưu tiên người thật và xếp hạng chỗ ngồi theo mức tương tác.
- **Chi tiết kỹ thuật**:
 - Thêm `eventType` vào game action và điểm ưu tiên: người thật luôn trên simulator; trong từng nguồn lần lượt `GIFT/hoa → LIKE/thả tim → COMMENT → FOLLOW/SHARE → JOIN`.
 - Hàng chờ được sắp theo điểm ưu tiên trước khi đưa nhân vật vào cảnh; chỗ ngồi cũng sắp theo ưu tiên rồi theo thời gian tương tác mới nhất.
 - Nhân vật dùng bốn làn đi lệch trái/phải và tối đa ba hàng vị trí khấn, tránh nối đuôi một đường thẳng hoặc đứng chồng cùng tọa độ; mobile có lộ trình riêng từ cửa đến cuối thảm.
 - Mobile hiển thị 24 người ưu tiên cao nhất. Người thật ngồi tối đa 15 phút, nhân vật giả ngồi 90 giây; danh sách tự làm mới mỗi 5 giây.
 - Đường quay về ghế tiếp tục đi qua lối bên và bám theo vị trí ghế sau khi danh sách được xếp hạng.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 22 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.13.2] - 2026-10-31
- **Yêu cầu**: Chỉ nhân vật giả mới có thoại giả; người TikTok thật luôn ưu tiên và hiển thị comment thật.
- **Chi tiết kỹ thuật**:
 - Thêm cờ `TempleGameAction.isSimulated` lấy trực tiếp từ `LiveEvent.source`, không còn suy đoán nhân vật giả chỉ bằng nickname.
 - Chỉ action từ `SIMULATOR` mới được gán câu lễ Phật tự động; action từ `TIKTOK` không có comment sẽ không hiện thoại giả.
 - Comment thật luôn dùng `TempleGameAction.message` và ưu tiên trước câu tự động; tên `Khán giả <số>` chỉ bị ẩn khi chính action đó là dữ liệu mô phỏng.
 - Thêm test xác nhận comment TikTok giữ nguyên message và được đánh dấu `isSimulated: false`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 22 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.13.1] - 2026-10-31
- **Yêu cầu**: Không hiện tên đối với khán giả mẫu và tự tạo các câu lễ Phật ngẫu nhiên không trùng nhau.
- **Chi tiết kỹ thuật**:
 - Nhận diện `Khán giả`/`Khán giả <số>` không phân biệt dấu và chữ hoa; ẩn nhãn tên ở cả người đi, người quỳ mobile và người ngồi desktop.
 - Thêm 18 câu lễ Phật/cầu bình an; danh sách được chọn với vị trí bắt đầu ngẫu nhiên mỗi lần tải trang.
 - Các khán giả mẫu đang hoạt động cùng lúc nhận câu khác nhau theo thứ tự trong hàng active, không trùng trong giới hạn tối đa 12 nhân vật; comment thật luôn được ưu tiên hiển thị.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Khi thứ tự nhân vật active thay đổi, câu tự động có thể được phân lại nhưng vẫn không trùng giữa những người đang hiện diện cùng lúc.

## [v0.13.0] - 2026-10-31
- **Yêu cầu**: Khi người xem comment, tạo hoạt ảnh người và hiển thị câu comment trên đầu.
- **Chi tiết kỹ thuật**:
 - Thêm action `SAY_COMMENT`; mọi comment thông thường tạo nhân vật đi vào chùa, còn comment chứa “Nam mô/A Di Đà Phật” tiếp tục dùng action cầu nguyện.
 - Lưu nội dung comment trong `TempleGameAction.message` và hiển thị bong bóng thoại trắng trên đầu nhân vật ở cả desktop/mobile.
 - Bong bóng giới hạn 100 ký tự hiển thị, giữ nội dung đầy đủ trong tooltip để tránh che màn hình; trạng thái mới nhất cũng hiển thị tên và comment.
 - Cập nhật test mapping để xác nhận comment thường tạo đúng `SAY_COMMENT` và giữ nguyên message.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.12.2] - 2026-10-31
- **Yêu cầu**: Sửa người đi ra từ giữa tượng Phật, bỏ hoàn toàn người que trên mobile và chỉnh lại bố cục ghế.
- **Chi tiết kỹ thuật**:
 - Tạo đường đi riêng cho mobile `z=8.5 → 10 → 7.2 → 6`, đưa điểm hành lễ xuống cuối thảm; đường rời lễ bắt đầu tại `z=6.5`, không còn chiếu người lên tượng Phật.
 - Thay toàn bộ người ngồi mobile bằng billboard cutout quỳ áo lam chân thực; mô hình viên nang chỉ còn ở desktop.
 - Bố trí mobile thành 4 cột × 6 hàng ở hai bên thảm, tối đa 24 người gần nhất; giảm kích thước nhãn và thêm lật/biến thiên tỷ lệ nhẹ để đám đông bớt đồng dạng.
 - Đồng bộ đường quay về ghế với 24 vị trí mới và lối biên mobile tại `x≈±5.1`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.12.1] - 2026-10-31
- **Yêu cầu**: Bỏ bốn hàng người ngồi đầu trên mobile để khu hành lễ rộng hơn.
- **Chi tiết kỹ thuật**:
 - `/overlay-mobile` bỏ 32 vị trí của bốn hàng sát bàn Phật, chỉ hiển thị tối đa 48 người gần nhất ở sáu hàng phía dưới.
 - Thêm hàm tọa độ ghế mobile riêng, bắt đầu từ hàng thứ năm và giữ hệ số thu ngang 43%.
 - Đồng bộ đường quay về ghế của nhân vật với danh sách 48 vị trí mobile mới; desktop vẫn giữ nguyên tối đa 80 người và 10 hàng.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.12.0] - 2026-10-31
- **Yêu cầu**: Giữ nguyên màn hình mobile hiện tại và thay hoạt ảnh người theo phong cách người thật trong ảnh tham khảo.
- **Chi tiết kỹ thuật**:
 - Giữ nguyên hậu cảnh `/overlay-mobile`; thêm hai cutout trong suốt `worshipper-walking-mobile.png` và `worshipper-kneeling-mobile.png` cho nhân vật đang hoạt động.
 - Trên mobile, người đi dùng dáng áo lam nhìn từ sau với chuyển động nhún bước/nghiêng nhẹ; khi cầu nguyện, dâng hoa hoặc cúi lạy tự đổi sang dáng quỳ chắp tay.
 - Dùng billboard 2D luôn hướng camera, giữ nhãn TikTok và toàn bộ đường đi/trở về ghế; desktop tiếp tục dùng mô hình 3D cũ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Hai cutout được tạo bằng công cụ imagegen tích hợp. Build frontend/backend/shared thành công; 21 test đều đạt. Billboard nhẹ hơn model GLB có xương nhưng chưa có hoạt ảnh chân tay nhiều khung hình.

## [v0.11.2] - 2026-10-31
- **Yêu cầu**: Co chiều cao ảnh nền mobile để nhìn được toàn bộ chánh điện.
- **Chi tiết kỹ thuật**:
 - Đổi cách fit hậu cảnh `/overlay-mobile` từ `background-size: cover` sang `100% 100%`.
 - Ảnh luôn khớp toàn bộ chiều rộng và chiều cao viewport, không còn crop phần đầu tượng Phật hoặc phần sàn dưới.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Ở viewport không đúng tỷ lệ 9:16 ảnh có thể co nhẹ theo chiều cao; Browser Source `1080 × 1920` giữ tỷ lệ gần nguyên bản.

## [v0.11.1] - 2026-10-31
- **Yêu cầu**: Sửa hậu cảnh overlay mobile bị kéo dãn và chưa phủ đúng chiều rộng màn hình.
- **Chi tiết kỹ thuật**:
 - Chuyển riêng `/overlay-mobile` từ `scene.background` của Three.js sang CSS background `cover`, giữ nguyên tỷ lệ 9:16 và chỉ crop phần thừa theo kích thước màn hình.
 - Bật canvas trong suốt cho mobile để người, ghế và hiệu ứng 3D hiển thị trên ảnh nền CSS; desktop `/overlay` giữ nguyên cơ chế cũ.
 - Căn ảnh nền ở chính giữa, không lặp và phủ kín toàn bộ `100vw × 100vh`.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Trên cửa sổ ngang, ảnh dọc sẽ crop trên/dưới hoặc hai cạnh để giữ tỷ lệ; khung OBS chuẩn `1080 × 1920` sẽ hiển thị đầy đủ nhất.

## [v0.11.0] - 2026-10-31
- **Yêu cầu**: Giữ nguyên màn hình overlay hiện tại và thêm một màn hình view mới dành riêng cho mobile.
- **Chi tiết kỹ thuật**:
 - Giữ nguyên `/overlay`; thêm route `/overlay-mobile` với hậu cảnh Nội điện dọc 9:16 tại `apps/web/public/assets/temple-interior-mobile-backdrop.png`.
 - Thu hẹp tọa độ ngang của người ngồi và đường quay về ghế còn 43% trên mobile, không làm méo mô hình nhân vật và không ảnh hưởng bố cục desktop.
 - Thanh điều khiển mobile tự xuống dòng trong chiều rộng màn hình; vẫn có nút Ẩn/Hiện như overlay ngang.
 - Thêm thẻ mở Overlay mobile tại `/admin/temple` và hướng dẫn Browser Source `1080 × 1920` trong README.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Hậu cảnh 9:16 được tạo bằng công cụ imagegen tích hợp. Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.10.2] - 2026-10-31
- **Yêu cầu**: Sửa lỗi người đi ra từ giữa tượng Phật.
- **Chi tiết kỹ thuật**:
 - Đồng bộ lại tọa độ nhân vật sau khi hậu cảnh chuyển từ mặt phẳng 3D sang `scene.background`: điểm hành lễ được đưa từ `z=-3.65` ra `z=0.15` ở cuối thảm.
 - Chuyển điểm dâng hoa về `z=0.25`, điểm tiếp cận về `z=1.4` và lối rẽ trái/phải về `z=0.65`.
 - Sắp lại lộ trình Nội điện theo thứ tự tiến liên tục `z=8.5 → 3.4 → 1.4 → 0.15`, không còn đi quá điểm lễ rồi quay ngược từ tượng Phật.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.10.1] - 2026-10-31
- **Yêu cầu**: Khôi phục đốm sáng và thêm hiệu ứng ánh sáng đẹp nhưng không làm nặng overlay.
- **Chi tiết kỹ thuật**:
 - Thay lớp 30 hạt cũ bằng hai lớp bụi sáng vàng/trắng dùng `Points` và additive blending, trôi ngược chiều và nhấp nháy mềm.
 - Thêm một nguồn sáng vàng dao động nhẹ gần bàn Phật ở mức MEDIUM/HIGH; LOW bỏ nguồn sáng này để giảm tải.
 - Số hạt tự điều chỉnh theo chất lượng: LOW 18, MEDIUM 36, HIGH 64; vị trí được sinh cố định để không nhảy ngẫu nhiên khi render lại.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Không dùng bloom hay post-processing. Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.10.0] - 2026-10-31
- **Yêu cầu**: Thêm thanh công cụ chỉnh cảnh ngay trên overlay và cho phép ẩn sau khi chỉnh xong.
- **Chi tiết kỹ thuật**:
 - `/overlay` hiển thị thanh điều khiển ở cạnh dưới gồm Tạm dừng/Tiếp tục, Xóa cảnh, Ngoại cảnh/Nội điện, ba góc camera và chất lượng đồ họa.
 - Thêm nút `Ẩn` cạnh thanh công cụ; khi ẩn chỉ giữ nút con mắt mờ ở góc dưới bên phải để mở lại khi cần.
 - Nút mở lại có tooltip, nhãn trợ năng và tăng độ rõ khi rê chuột, hạn chế che nội dung overlay lúc phát OBS.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.9.5] - 2026-10-31
- **Yêu cầu**: Sửa ảnh Nội điện bị co, nghiêng và không phủ kín màn hình.
- **Chi tiết kỹ thuật**:
 - Bỏ cách dựng hậu cảnh bằng mặt phẳng 3D kích thước `54 × 30.375`, nguyên nhân làm lộ cạnh ảnh và biến dạng hình thang khi camera lệch.
 - Gắn texture Nội điện trực tiếp vào `scene.background` của Three.js để ảnh luôn phủ toàn bộ renderer và không chịu phối cảnh camera.
 - Khôi phục background trước đó khi rời Nội điện để không ảnh hưởng giao diện Ngoại cảnh.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.9.4] - 2026-10-31
- **Yêu cầu**: Giảm hẳn chiều cao của người đang đi vào khu bàn Phật.
- **Chi tiết kỹ thuật**:
 - Thêm tỷ lệ nhân vật theo chiều sâu Nội điện: từ 80% ở gần camera giảm liên tục xuống 34% tại điểm hành lễ.
 - Toàn bộ thân người, lễ vật và nhãn tên cùng thu nhỏ theo tọa độ `z`, mô phỏng đúng phối cảnh của ảnh toàn cảnh.
 - Khi nhân vật quay về khu ghế, tỷ lệ tăng dần trở lại; lúc sinh nhân vật luôn khởi tạo ở tỷ lệ 80% để tránh nháy sai kích thước.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.9.3] - 2026-10-31
- **Yêu cầu**: Hạ thấp hẳn khán giả ngồi và người đang cúng Phật.
- **Chi tiết kỹ thuật**:
 - Thu mô hình khán giả ngồi từ 72% xuống 48%, hạ thân về `y=0.1` và nhãn tên về `y=0.98` để thể hiện tư thế ngồi/quỳ thấp.
 - Thêm chuyển động dáng quỳ cho người hành lễ: khi cầu nguyện, cúi lạy hoặc dâng hoa, thân hạ từ `y=1.05` xuống `y=0.48` và co chiều cao còn 62%.
 - Đưa nhãn tên vào cùng nhóm thân người để nhãn tự hạ theo tư thế quỳ; nhân vật trở lại chiều cao bình thường khi rời bàn Phật.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.9.2] - 2026-10-31
- **Yêu cầu**: Xếp người ngồi theo đường chéo phối cảnh và ngăn người hành lễ đi sâu sát tượng Phật.
- **Chi tiết kỹ thuật**:
 - Thu các cột ghế ở hàng xa về 72% và tăng dần độ xòe 4,5% mỗi hàng về phía camera, tạo hai cụm ghế chạy chéo theo phối cảnh sàn trong ảnh.
 - Kéo điểm tiếp cận về `z=-2.4`, điểm hành lễ về `z≈-3.6` và điểm rẽ sang lối bên về `z=-3.15`, tránh nhân vật bị chiếu lên khu bàn thờ.
 - Giữ nguyên cơ chế trở về đúng tọa cụ sau khi hoàn tất nghi lễ với tọa độ ghế mới.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.9.1] - 2026-10-31
- **Yêu cầu**: Không cho người hành lễ đi quá sâu vào bàn Phật và hạ thấp người đang ngồi.
- **Chi tiết kỹ thuật**:
 - Kéo điểm tiếp cận từ `z=-8.7` về `z=-5.8` và điểm hành lễ từ `z≈-10.2` về `z≈-7.1`, tương ứng khu đầu thảm trước bàn thờ được đánh dấu.
 - Dịch điểm rẽ trái/phải khi rời khu hành lễ về `z=-6.65` để đường quay về ghế bắt đầu từ vị trí mới.
 - Thu người ngồi xuống 72% và hạ nhãn tên từ `y=1.9` xuống `y=1.42`, tạo dáng quỳ/ngồi thấp trên tọa cụ.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.9.0] - 2026-10-31
- **Yêu cầu**: Dùng một ảnh toàn cảnh duy nhất cho toàn bộ Nội điện.
- **Chi tiết kỹ thuật**:
 - Thêm `apps/web/public/assets/temple-interior-full-backdrop.png`, bao gồm tượng Phật, bàn lễ, hoa/hương/ngũ quả, cột, đèn, sàn, thảm giữa và khu tọa cụ trong cùng một phối cảnh 16:9.
 - Thay tường, cột, sàn, thảm và bệ 3D rời bằng một mặt ảnh toàn cảnh; chỉ giữ mặt phẳng trong suốt nhận bóng, ánh sáng, người LIVE và hiệu ứng tương tác.
 - Bỏ 80 tọa cụ trống dạng khối để không chồng lên các đệm ngồi có sẵn trong ảnh; người đang hiện diện vẫn có tọa cụ riêng khi được render.
 - Hạ điểm hành lễ về mặt sàn do bệ thờ nay đã nằm trong ảnh toàn cảnh, tránh nhân vật bị nổi trên không.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Asset được tạo bằng công cụ imagegen tích hợp. Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.8.3] - 2026-10-31
- **Yêu cầu**: Không crop ảnh Phật; phóng lớn toàn bộ ảnh để tượng Phật nhìn gần hơn mà vẫn giữ nguyên không gian.
- **Chi tiết kỹ thuật**:
 - Khôi phục UV đầy đủ của texture (`repeat=1`, `offset=0`) để hiển thị nguyên bản toàn bộ hậu cảnh.
 - Tăng mặt ảnh từ `25 × 14.05` lên `28 × 15.75`, đúng tỷ lệ gốc và vừa chiều rộng chánh điện; nâng tâm ảnh để cạnh dưới vẫn chạm mặt sàn.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.8.2] - 2026-10-31
- **Yêu cầu**: Cho phép nhân vật đi sâu vào ảnh chánh điện để hành lễ sát tượng Phật hơn.
- **Chi tiết kỹ thuật**:
 - Thêm điểm tiếp cận mép bệ tại `z=-8.7`, sau đó nhân vật bước lên cao độ `y=0.95` và tiến đến `z≈-10.2`, ngay trước mặt hậu cảnh Phật.
 - Bệ vàng che phần chân theo chiều sâu tự nhiên trong khi thân nhân vật vẫn hiển thị trước ảnh, tạo cảm giác bước vào khu bàn thờ.
 - Dịch đường rẽ khi rời bàn Phật sâu hơn và giữ cao độ bệ ở đoạn đầu trước khi nhân vật xuống lối bên để về ghế.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.8.1] - 2026-10-31
- **Yêu cầu**: Làm tượng Phật gần hơn, đưa bệ vàng sát ảnh và cho người hành lễ tiến gần bàn Phật.
- **Chi tiết kỹ thuật**:
 - Crop 74% vùng trung tâm của hậu cảnh để phóng lớn tượng Phật và bàn thờ mà không làm thay đổi kích thước khung Nội điện.
 - Đẩy bệ vàng từ `z=-10.15` đến `z=-10.65`, gần mặt ảnh chánh điện hơn.
 - Đưa điểm hành lễ đến `z≈-8.7`; đồng thời dịch điểm rẽ trái/phải khi quay về ghế để phù hợp vị trí mới.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.8.0] - 2026-10-31
- **Yêu cầu**: Thêm hoạt ảnh mang hoa/quà lên cúng Phật, đi vòng về đúng chỗ ngồi và cải thiện hình dáng nhân vật.
- **Chi tiết kỹ thuật**:
 - Nhân vật `OFFER_FLOWERS` cầm bó hoa; gift thường được thể hiện bằng hộp lễ màu đỏ có dải nơ vàng và giữ thêm `giftName` từ sự kiện TikTok.
 - Khi mang lễ vật, hai tay giữ ở tư thế nâng đồ thay vì đánh tay xuyên qua vật phẩm.
 - Sau khi hành lễ, nhân vật rẽ trái/phải theo phía ghế, đi dọc lối biên, vòng xuống đúng hàng rồi trở về tọa cụ đã gán cho tài khoản.
 - Nâng hình dáng nhân vật với tỷ lệ thân người cân đối hơn, khuôn đầu chi tiết hơn, tóc và phần mặt nhô thay cho kiểu viên nang đơn giản.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Nhân vật vẫn là mô hình procedural nhẹ để giữ hiệu năng khi có nhiều người, chưa sử dụng model người GLB có xương.

## [v0.7.5] - 2026-10-31
- **Yêu cầu**: Sửa sàn Nội điện còn tối và đưa bàn lễ/người hành lễ đến gần tượng Phật hơn.
- **Chi tiết kỹ thuật**:
 - Chuyển texture sàn sang vật liệu không bị ánh sáng scene nhân tối, giữ đúng độ sáng và màu vàng nâu của ảnh gốc.
 - Đẩy bệ lễ từ trục `z=-8.8` đến `z=-10.15`, sát hậu cảnh chánh điện hơn.
 - Tách đường đi trong Nội điện khỏi Ngoại cảnh; nhân vật đi hết lối giữa và hành lễ tại `z≈-8.2` trước bàn Phật thay vì dừng ở giữa sân.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.7.4] - 2026-10-31
- **Yêu cầu**: Thay vùng sàn đen của Nội điện bằng ảnh nền phù hợp với chánh điện.
- **Chi tiết kỹ thuật**:
 - Thêm asset `apps/web/public/assets/temple-floor-texture.png` là texture sàn gỗ chùa tối, có vân và phản chiếu ánh vàng.
 - Phủ texture mới lên toàn bộ mặt sàn 3D bên dưới khu ghế ngồi, đồng thời cân chỉnh độ nhám, phản sáng và sắc độ để nối tự nhiên với hậu cảnh.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Asset được tạo bằng công cụ imagegen tích hợp. Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.7.3] - 2026-10-31
- **Yêu cầu**: Làm tự nhiên phần tiếp giáp giữa chánh điện chân thực và các vật thể 3D phía trước.
- **Chi tiết kỹ thuật**:
 - Bỏ bàn lễ, hoa quả, nến, đèn tròn và chuông 3D dạng khối khỏi Nội điện để không chồng lên đồ lễ rõ nét có sẵn trong hậu cảnh.
 - Giữ hậu cảnh chánh điện làm lớp thờ tự chính; chuông 3D chỉ còn hiển thị ở Ngoại cảnh.
 - Đổi sàn Nội điện sang màu gỗ tối, độ nhám thấp và phản sáng nhẹ để giảm đường cắt đột ngột với sàn trong hậu cảnh.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.7.2] - 2026-10-31
- **Yêu cầu**: Bỏ thanh ngang và mảng trần đang che góc nhìn rộng của Nội điện.
- **Chi tiết kỹ thuật**:
 - Loại bỏ khối trần kín và năm xà ngang 3D khỏi `TempleInterior`; giữ nguyên tường, cột, đèn, khu ngồi và chánh điện.
 - Dọn chú thích camera không còn phù hợp sau khi bỏ trần để cấu hình cảnh phản ánh đúng mô hình hiện tại.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.7.1] - 2026-10-31
- **Yêu cầu**: Sửa lỗi khối trần Nội điện che gần hết màn hình ở góc camera Toàn cảnh.
- **Chi tiết kỹ thuật**:
 - Hạ camera `OVERVIEW` và `ENTRANCE` của Nội điện xuống dưới cao độ trần, đồng thời chỉnh điểm nhìn để vẫn bao quát khu Phật tử và bàn thờ.
 - Thêm chú thích ngay tại cấu hình camera để tránh đưa camera xuyên lên trên trần trong các lần chỉnh cảnh sau.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng không làm build thất bại.

## [v0.7.0] - 2026-10-31
- **Yêu cầu**: Mở rộng chánh điện, thêm khu ngồi theo người đang có mặt trong LIVE và làm tượng Phật/đồ lễ rõ nét.
- **Chi tiết kỹ thuật**:
 - Mở rộng Nội điện lên 80 tọa cụ chia hai bên lối giữa; sự kiện JOIN, Like và Gift ghi nhận một vị trí ngồi duy nhất theo tài khoản TikTok.
 - Khi Phật tử đang lên lễ, vị trí ngồi được để trống; sau khi lễ Phật/dâng hoa/dâng hương xong, nhân vật đi về lối khu ngồi rồi xuất hiện lại tại tọa cụ của mình.
 - Overlay dùng camera toàn cảnh rộng để thấy chánh điện, lối đi và khu Phật tử; giới hạn camera Nội điện được mở rộng.
 - Thêm ảnh chánh điện rõ nét tạo riêng làm backdrop cục bộ, gồm tượng Phật, hào quang, hoa sen, lư hương, ngũ quả và nến; vẫn giữ lớp lễ vật/khói hương 3D phản ứng theo sự kiện.
 - Tăng chiều rộng sàn, tường, trần, xà và hàng cột của Nội điện để phù hợp khu ngồi đông người.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 21 test đều đạt. Khu ngồi giữ tối đa 80 Phật tử gần nhất để bảo vệ hiệu năng overlay.

## [v0.6.1] - 2026-10-31
- **Yêu cầu**: Sửa overlay chưa hiển thị Nội điện, bỏ các bảng thông tin và làm cảnh bên trong chùa giống không gian điện Phật tham khảo.
- **Chi tiết kỹ thuật**:
 - `/overlay` mặc định dùng theme `INTERIOR`, camera `SHRINE` và góc nhìn chính diện vào bàn thờ.
 - Loại bỏ tiêu đề Chùa An Lạc, trạng thái mô phỏng/kết nối, hàng chờ và nhãn nhân vật khỏi lớp UI overlay; chỉ giữ scene 3D sạch.
 - Nâng cấp Nội điện với tượng Phật và hào quang riêng, bệ nhiều tầng, bàn lễ, hoa sen, nến, trái cây, lư hương và khói hương chuyển động.
 - Điều chỉnh camera Nội điện để các preset Toàn cảnh, Lối vào và Điện Phật hướng đúng vào khu vực thờ tự.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 19 test đều đạt. Cảnh vẫn là mô hình procedural Three.js, không sao chép trực tiếp ảnh tham khảo.

## [v0.6.0] - 2026-10-31
- **Yêu cầu**: Chuyển khu vực admin thành menu quản trị có nhiều trang.
- **Chi tiết kỹ thuật**:
 - Thêm layout admin responsive với sidebar desktop, menu cuộn ngang trên mobile và trạng thái active theo route.
 - Tách các route `/admin`, `/admin/events`, `/admin/connection`, `/admin/simulator`, `/admin/temple`, `/admin/settings`.
 - Trang Không gian chùa cung cấp lối vào Chùa tương tác, Phòng thử nghiệm và Overlay OBS; các route 3D cũ được giữ nguyên.
 - Dashboard Tổng quan vẫn hiển thị thống kê, kết nối, tốc độ xử lý và sự kiện gần nhất; các chức năng cũ được phân bổ sang trang chuyên biệt.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 19 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng build không thất bại.

## [v0.5.0] - 2026-10-31
- **Yêu cầu**: Thêm chức năng thay đổi giao diện chùa và một giao diện bên trong chùa.
- **Chi tiết kỹ thuật**:
 - Thêm bộ chọn `Ngoại cảnh / Nội điện` vào thanh điều khiển tại `/temple` và `/test`.
 - Thêm scene `TempleInterior` gồm sàn gỗ, thảm lễ, cột gỗ, xà trần, cửa phát sáng, đèn lồng, bệ điện Phật, sương và hệ ánh sáng ấm.
 - Điều chỉnh màu nền, giới hạn OrbitControls và ba vị trí camera riêng cho Nội điện; nhãn `Cổng chùa` tự đổi thành `Lối vào`.
 - Giữ nguyên tượng Phật, bàn lễ, lư hương, chuông, hiệu ứng và toàn bộ luồng nhân vật khi chuyển giao diện.
- **Lưu ý kỹ thuật & chưa kiểm thử**:
 - Build frontend/backend/shared thành công; 19 test đều đạt. Vite còn cảnh báo chunk Three.js lớn nhưng build không thất bại.

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
