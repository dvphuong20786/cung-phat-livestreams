# Developer commands

Các lệnh dưới đây dùng PowerShell tại thư mục gốc dự án:

```powershell
Set-Location F:\tools
```

## 1. Yêu cầu môi trường

```powershell
node --version
pnpm --version
```

Nếu chưa có pnpm:

```powershell
npm install --global pnpm
```

Khuyến nghị Node.js 20+ và pnpm 9+.

## 2. Cài dependency

```powershell
pnpm install
```

Nếu lockfile vừa thay đổi trong môi trường CI:

```powershell
pnpm install --no-frozen-lockfile
```

Tạo file môi trường cục bộ khi cần tùy chỉnh cổng:

```powershell
Copy-Item .env.example .env
```

## 3. Chạy development

Chạy đồng thời backend và frontend:

```powershell
pnpm dev
```

Chạy riêng backend:

```powershell
pnpm --filter @live/server dev
```

Chạy riêng frontend:

```powershell
pnpm --filter @live/web dev
```

Các URL mặc định:

```text
Admin:      http://localhost:5173/admin
Temple:     http://localhost:5173/temple
OBS:        http://localhost:5173/overlay
3D test:    http://localhost:5173/test
API health: http://localhost:3001/health
```

Kiểm tra health endpoint:

```powershell
Invoke-RestMethod http://localhost:3001/health
```

Lệnh trên chỉ kiểm tra backend có đang sống hay không. Nó không khởi động ứng dụng. Nếu lệnh lỗi hoặc timeout, chạy `pnpm dev` trước và giữ terminal đó mở.

Nhấn `Ctrl+C` tại terminal đang chạy để dừng dev server.

## 4. Build và kiểm tra

```powershell
pnpm build
pnpm test
pnpm lint
```

Chạy test ở chế độ watch:

```powershell
pnpm vitest
```

Chạy riêng một test:

```powershell
pnpm vitest apps/web/src/game/useTempleGameStore.test.ts
pnpm vitest packages/shared/src/index.test.ts
```

Kiểm tra định dạng và tự format toàn bộ workspace:

```powershell
pnpm exec prettier --check .
pnpm format
```

## 5. Chạy production build cục bộ

Build tất cả workspace:

```powershell
pnpm build
```

Terminal 1 — chạy backend đã build:

```powershell
pnpm --filter @live/server start
```

Terminal 2 — preview frontend đã build:

```powershell
pnpm --filter @live/web exec vite preview --host 127.0.0.1 --port 5173
```

## 6. Kiểm thử luồng chùa 3D

```powershell
pnpm dev
```

Sau đó mở `http://localhost:5173/test` và kiểm tra:

1. `Gửi Like` → một nhân vật đi vào chùa.
2. `Gửi 10 Like` → like được cộng theo quantity, không tạo vô hạn nhân vật cùng user.
3. `Tặng Rose` → nhân vật mang hoa, dâng hoa, lễ Phật rồi rời cảnh.
4. `Tặng Gift` → nghi lễ dâng hương/quà chung.
5. Bình luận `Nam mô A Di Đà Phật` → hoạt ảnh cầu nguyện.
6. `Giả lập 50 người` → tối đa 12 nhân vật hoạt động, phần còn lại vào queue.
7. `Stress Test 500 sự kiện` → queue vẫn bị giới hạn và UI tiếp tục phản hồi.

## 7. OBS Browser Source

```text
URL:    http://localhost:5173/overlay
Width:  1080
Height: 1920
```

Không bật `Shutdown source when not visible` nếu muốn giữ nguyên hàng đợi và hoạt ảnh khi chuyển scene OBS.

## 8. Các file `.bat` tương đương

```text
1_CAI_DAT.bat          pnpm install
2_BUILD.bat            pnpm build
3_CHAY_UNG_DUNG.bat    pnpm dev
4_MO_TEST_3D.bat       kiểm tra backend rồi mở /test
CHAY_UNG_DUNG.bat      tự cài dependency nếu thiếu rồi chạy pnpm dev
```
