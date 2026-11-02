# Lịch sử thay đổi

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
