/**
 * ============================================================================
 * TRANG OVERLAY CHÙA 2D (MOBILE & DESKTOP)
 * Route: /overlay-mobile-2d (mobile) và /overlay-2d (desktop)
 *
 * TIẾN ĐỘ PHÁT TRIỂN:
 * 1. ĐÃ CÓ:
 *    - Đưa 3 Vị Thầy Chùa lên vị trí cao trang nghiêm đúng khu vực khoanh xanh (top: 42.5% - 43%),
 *      ngay trên đầu thảm đỏ sát chân bàn thờ Tam Bảo.
 *    - Tăng 50% kích thước cho tất cả nhân vật Phật tử và 3 Vị Sư Thầy.
 *    - Khắc phục triệt để lỗi người không đi từ cửa vào: Nhân vật xuất phát từ ngoài cửa (top: 106%),
 *      bước đi dọc theo thảm đỏ vào chánh điện hành lễ đầy đủ chu trình trong 4.5s.
 *    - Cắt ảnh Sprite Sheet 4x3 chính xác từng pixel bằng container overflow:hidden,
 *      loại bỏ hoàn toàn lỗi lộ chân của hàng trên (Row 1) lên đầu hàng dưới (Row 2).
 *    - Khắc phục lỗi "đi lùi đằng lưng": Khi Phật tử hành lễ xong bước từ trên chánh điện
 *      xuống chỗ ngồi, sử dụng hoạt ảnh đi hướng về phía trước (walk-front, quay mặt về camera).
 *    - Loại bỏ dải hoa emoji bay ngang tượng Phật gây mất thẩm mỹ.
 *    - Tinh gọn Danh sách Cúng Dường mới nhất (RecentDonorsList), loại bỏ khung nền tối thô kệch
 *      để hiển thị thanh thoát, không chiếm chỗ.
 *    - Đồng bộ 24 chỗ ngồi quỳ niệm Phật: chia 4 hàng trên mobile (3 người trái, 3 người phải, thảm đỏ
 *      ở giữa), mỗi chỗ ngồi đều có Đệm sen toà thêu vàng (lotus-cushion.svg) đặt ngay ngắn dưới sàn.
 *    - Huy hiệu DevoteeHeadBadge chuẩn 3D: Bong bóng comment có avatar, số level, mũi tên trỏ xuống;
 *      Tag tên mờ hổ phách bo tròn khi chỉ có tên; ẩn tên Khán giả ảo generic.
 *    - Vòng hào quang Phật quang tròn xoay sau đầu cho Phật tử đạt cấp bậc cao (Lv.81-100).
 *    - Thanh điều khiển TempleToolbar chuẩn của bản 3D kèm nút Ẩn/Hiện Eye/EyeOff và link Bản 3D.
 *    - Tự động phát nhạc nền và mở khóa âm thanh khi người dùng chạm màn hình.
 *
 * 2. ĐANG CÓ:
 *    - Dựng toàn bộ đồ họa và chuyển động bằng thuần React DOM, CSS Clipper & CSS GPU transform.
 *    - Hoạt động nhẹ nhàng, mượt mà trên mọi thiết bị di động yếu không hỗ trợ WebGL tốt.
 *
 * 3. SẮP CÓ (HƯỚNG PHÁT TRIỂN TIẾP THEO):
 *    - Bổ sung hiệu ứng ánh nến lung linh 2D và khói trầm hương bay lượn ở lư hương.
 *    - Bổ sung hiệu ứng cánh hoa sen bay rơi khi có người tặng quà lớn.
 * ============================================================================
 */

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { TempleGameAction } from '@live/shared';
import { MeritLeaderboard } from '../game/components/MeritLeaderboard';
import { RecentDonorsList } from '../game/components/RecentDonorsList';
import { TempleToolbar } from '../game/TempleToolbar';
import type { CameraPreset, TempleTheme, WorshipDistance } from '../game/TempleScene';
import { calculateSeatingDuration } from '../game/seatingDuration';
import { getCultivationInfo } from '../game/cultivationLevel';
import { isGenericAudienceName } from '../game/components/SeatedVisitors';
import { templeAudio } from '../game/services/TempleAudioService';
import {
  useTempleGameStore,
  type ActiveCharacter,
  type CharacterState,
} from '../game/useTempleGameStore';
import { sendSimulatedBatch } from '../services/simulatorService';
import { useMonitorStore } from '../stores/useMonitorStore';

/**
 * Danh sách câu nguyện tự động cho người dùng giả lập
 */
const prayerPhrases = [
  'Nam mô A Di Đà Phật',
  'Con xin thành tâm lễ Phật',
  'Nguyện gia đình bình an',
  'Nguyện mọi người được an lành',
  'Cầu thân tâm an lạc',
  'Nguyện tiêu trừ phiền não',
  'Cầu cha mẹ mạnh khỏe',
  'Nguyện chúng sinh bình an',
  'Con xin hồi hướng công đức',
  'Nguyện lòng luôn hướng thiện',
  'Cầu vạn sự bình an',
  'Nguyện trí tuệ sáng suốt',
  'Xin giữ tâm thanh tịnh',
  'Nguyện duyên lành tăng trưởng',
  'Cầu tai qua nạn khỏi',
  'Nguyện ngày mới an vui',
  'Xin thành kính tri ân Tam Bảo',
  'Nguyện phước lành đến muôn nơi',
];

/**
 * Hàm băm chuỗi sang số nguyên dương để sinh dữ liệu ngẫu nhiên ổn định theo ID
 */
function hashText(value: string): number {
  return Math.abs([...value].reduce((total, char) => total + char.charCodeAt(0), 0));
}

/**
 * Lấy nội dung hiển thị trong bong bóng bình luận (comment, tim, hoặc lời cầu nguyện)
 */
function getDisplayedMessage(action: TempleGameAction): string | undefined {
  if (action.message && action.message.trim().length > 0) {
    return action.message.trim();
  }
  if (action.eventType === 'LIKE') {
    const qty = action.quantity ?? 1;
    return qty > 1 ? `❤️ Thả ${qty} tim cúng Phật` : '❤️ Thả tim cúng Phật';
  }
  if (action.isSimulated) {
    const phraseIndex = hashText(action.userId) % prayerPhrases.length;
    return prayerPhrases[phraseIndex];
  }
  return undefined;
}

/**
 * Tính toán toạ độ tỉ lệ phần trăm (%) cho 24 chỗ ngồi quỳ niệm Phật
 * Đặt chính xác trên mặt sàn gỗ và thảm đỏ của chánh điện:
 * - Mobile: 4 hàng x 6 chỗ (3 chỗ bên trái, 3 chỗ bên phải, thảm đỏ ở giữa)
 * - Desktop: 2 hàng x 12 chỗ (6 chỗ bên trái, 6 chỗ bên phải)
 */
export function get2DSeatCoordinates(
  index: number,
  mobile: boolean,
): { left: number; top: number; scale: number; zIndex: number } {
  const safeIndex = Math.max(0, index) % 24;

  if (mobile) {
    const rowIndex = Math.floor(safeIndex / 6); // 0, 1, 2, 3
    const colInRow = safeIndex % 6; // 0..2 bên trái, 3..5 bên phải
    const isRightSide = colInRow >= 3;
    const sideIndex = isRightSide ? colInRow - 3 : colInRow; // 0, 1, 2

    // 4 hàng ghế trên mặt sàn gỗ (top: 80% đến 98%), không bị bay lên tượng Phật
    const rowTops = [80, 86, 92, 98];
    // Tăng 50% kích thước nhân vật (từ 0.74 - 0.98 lên 1.11 - 1.47)
    const rowScales = [1.11, 1.23, 1.35, 1.47];

    // 3 cột bên trái và 3 cột bên phải (chừa khoảng 34% - 66% cho thảm đỏ ở giữa)
    const leftCols = [11, 21, 31];
    const rightCols = [69, 79, 89];
    const colX = isRightSide ? rightCols[sideIndex] : leftCols[sideIndex];

    return {
      left: colX,
      top: rowTops[rowIndex],
      scale: rowScales[rowIndex],
      zIndex: 20 + rowIndex * 2,
    };
  }

  // Khung hình Desktop màn hình ngang (16:9)
  const rowIndex = Math.floor(safeIndex / 12); // 0, 1
  const colInRow = safeIndex % 12; // 0..5 bên trái, 6..11 bên phải
  const isRightSide = colInRow >= 6;
  const sideIndex = isRightSide ? colInRow - 6 : colInRow;

  const rowTops = [68, 82];
  // Tăng 50% kích thước nhân vật (từ 0.72 - 0.88 lên 1.08 - 1.32)
  const rowScales = [1.08, 1.32];
  const leftCols = [8, 14, 20, 26, 32, 38];
  const rightCols = [62, 68, 74, 80, 86, 92];
  const colX = isRightSide ? rightCols[sideIndex] : leftCols[sideIndex];

  return {
    left: colX,
    top: rowTops[rowIndex],
    scale: rowScales[rowIndex],
    zIndex: 20 + rowIndex * 2,
  };
}

/**
 * ============================================================================
 * COMPONENT CẮT SPRITE 2D CHUẨN XÁC TỪNG PIXEL (DevoteeSprite2D)
 * Khắc phục hoàn toàn lỗi chân của hàng trên lộ lên đầu hàng dưới
 * Hỗ trợ đi lùi -> quay mặt về phía trước (walk-front) khi bước xuống chỗ ngồi
 * ============================================================================
 */
type DevoteePose = 'SEATED' | 'BOWING' | 'WALK_BACK' | 'WALK_FRONT' | 'PRAYING' | 'OFFERING';

function DevoteeSprite2D({
  assetUrl,
  pose,
  animTick = 0,
}: {
  assetUrl: string;
  pose: DevoteePose;
  animTick?: number;
}) {
  // 1. Tư thế ngồi quỳ niệm Phật tĩnh tại (Row 2 của sprite sheet nu/nam)
  if (pose === 'SEATED') {
    return (
      <div
        className="mobile-2d-clipper mobile-2d-seated-bob"
        style={{ width: '72px', height: '70px' }}
      >
        <img
          src={assetUrl}
          alt=""
          className="mobile-2d-sheet-img"
          style={{
            width: '288px',
            height: '264px',
            top: '-194px',
            left: '0px',
          }}
        />
      </div>
    );
  }

  // 2. Tư thế quỳ lạy cúng Phật (Row 2, chu kỳ 4 frame cúi lễ)
  if (pose === 'BOWING') {
    const bowFrame = animTick % 4;
    return (
      <div className="mobile-2d-clipper" style={{ width: '72px', height: '70px' }}>
        <img
          src={assetUrl}
          alt=""
          className="mobile-2d-sheet-img"
          style={{
            width: '288px',
            height: '264px',
            top: '-194px',
            left: `${-bowFrame * 72}px`,
          }}
        />
      </div>
    );
  }

  // 3. Tư thế bước đi từ cửa vào chánh điện (Row 1: lưng hướng về phía người xem, đi lên)
  if (pose === 'WALK_BACK') {
    const walkFrame = animTick % 4;
    return (
      <div
        className="mobile-2d-clipper mobile-2d-walking-bob"
        style={{ width: '72px', height: '90px' }}
      >
        <img
          src={assetUrl}
          alt=""
          className="mobile-2d-sheet-img"
          style={{
            width: '288px',
            height: '264px',
            top: '-102px',
            left: `${-walkFrame * 72}px`,
          }}
        />
      </div>
    );
  }

  // 4. Tư thế bước đi từ trên điện Phật xuống chỗ ngồi (Row 1 của female-walk: MẶT HƯỚNG VỀ PHÍA TRƯỚC)
  // Khắc phục triệt để lỗi đi lùi đằng lưng!
  if (pose === 'WALK_FRONT') {
    const walkFrame = animTick % 4;
    return (
      <div
        className="mobile-2d-clipper mobile-2d-walking-bob"
        style={{ width: '72px', height: '90px' }}
      >
        <img
          src="/assets/female-walk.png"
          alt=""
          className="mobile-2d-sheet-img"
          style={{
            width: '288px',
            height: '144px',
            top: '-72px',
            left: `${-walkFrame * 72}px`,
          }}
        />
      </div>
    );
  }

  // 5. Tư thế chắp tay niệm Phật trước bàn thờ (Row 0, Col 1)
  if (pose === 'PRAYING') {
    return (
      <div className="mobile-2d-clipper" style={{ width: '72px', height: '98px' }}>
        <img
          src={assetUrl}
          alt=""
          className="mobile-2d-sheet-img"
          style={{
            width: '288px',
            height: '264px',
            top: '0px',
            left: '-72px',
          }}
        />
      </div>
    );
  }

  // 6. Tư thế dâng hoa / lễ vật (Row 0, Col 3)
  return (
    <div className="mobile-2d-clipper" style={{ width: '72px', height: '98px' }}>
      <img
        src={assetUrl}
        alt=""
        className="mobile-2d-sheet-img"
        style={{
          width: '288px',
          height: '264px',
          top: '0px',
          left: '-216px',
        }}
      />
    </div>
  );
}

/**
 * Huy hiệu Avatar + Level + Tên hoặc Bong bóng bình luận trên đầu Phật tử
 * Thiết kế hoàn toàn đồng nhất với CharacterHeadOverlay của bản 3D
 */
function DevoteeHeadBadge({
  action,
  isFemale,
}: {
  action: TempleGameAction;
  isFemale: boolean;
}) {
  const interactions = useTempleGameStore((s) => s.userInteractions[action.userId] || 0);
  const cultivation = getCultivationInfo(interactions, isFemale);
  const message = getDisplayedMessage(action);
  const hasComment = Boolean(message && message.trim().length > 0);
  const isGenericAudience = isGenericAudienceName(action.nickname);
  const shouldHideGenericName = action.isSimulated === true && isGenericAudience && !hasComment;

  if (shouldHideGenericName) return null;

  const visibleMessage = message && message.length > 80 ? `${message.slice(0, 80)}…` : message;

  return (
    <div className="pointer-events-none mb-1 flex flex-col items-center select-none">
      {hasComment ? (
        /* KHI CÓ COMMENT / LỜI NGUYỆN: BONG BÓNG COMMENT HOÀNG KIM CÓ AVATAR VÀ LEVEL */
        <div className="animate-in fade-in zoom-in relative mb-1 flex max-w-56 items-center gap-1.5 rounded-2xl border border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-100/95 px-3 py-1.5 text-center text-[11px] font-bold leading-snug text-amber-950 shadow-2xl backdrop-blur-sm duration-200">
          {action.avatarUrl ? (
            <img
              src={action.avatarUrl}
              alt=""
              className="h-5 w-5 shrink-0 rounded-full border border-amber-400 object-cover shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-800 text-[9px] text-amber-100">
              🙏
            </div>
          )}
          {cultivation.level > 0 && (
            <span
              className={`shrink-0 rounded bg-gradient-to-r ${cultivation.badgeColor} px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow-sm`}
            >
              {cultivation.level}
            </span>
          )}
          <span className="truncate">{visibleMessage}</span>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-amber-100" />
        </div>
      ) : (
        /* KHI CHỈ CÓ TÊN: TAG BO TRÒN MÀU ĐEN HỔ PHÁCH SANG TRỌNG */
        <div className="flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-amber-100 shadow-xl backdrop-blur-md whitespace-nowrap">
          {action.avatarUrl ? (
            <img
              src={action.avatarUrl}
              alt=""
              className="h-5 w-5 rounded-full border-2 border-amber-400 object-cover shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-amber-400 bg-amber-900/80 text-[10px] font-bold text-amber-200 shadow-sm">
              {action.nickname.slice(0, 1).toUpperCase()}
            </div>
          )}
          {cultivation.level > 0 && (
            <span
              className={`rounded bg-gradient-to-r ${cultivation.badgeColor} px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow-sm`}
            >
              {cultivation.level}
            </span>
          )}
          <span>{action.nickname}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Vòng hào quang Phật pháp phát sáng xoay tròn cho Phật tử đạt cấp bậc cao (Lv.81-100)
 */
function DevoteeHalo2D({ color = '#ffd966' }: { color?: string }) {
  return (
    <div
      className="mobile-2d-halo-ring pointer-events-none"
      style={{
        border: `3px solid ${color}`,
        boxShadow: `0 0 16px ${color}, inset 0 0 12px ${color}`,
      }}
    />
  );
}

/**
 * Vòng hào quang riêng của Sư Trụ Trì ở giữa điện Phật
 */
function AbbotAura2D() {
  return <div className="mobile-2d-abbot-aura pointer-events-none" />;
}

/**
 * Mô hình Mõ Gỗ sơn son thếp vàng kèm dùi gõ chuyển động
 */
function WoodenFish2D({ isAbbot = false }: { isAbbot?: boolean }) {
  return (
    <div className="relative -mt-2.5 flex flex-col items-center select-none" aria-hidden="true">
      {/* Thân chiếc Mõ Gỗ sơn son */}
      <div
        className="relative h-4 w-5.5 rounded-full border border-amber-600/40 shadow-md"
        style={{
          background: isAbbot
            ? 'linear-gradient(180deg, #963426 0%, #4a1814 100%)'
            : 'linear-gradient(180deg, #7a281c 0%, #3a1510 100%)',
        }}
      >
        <div className="absolute top-0.5 right-1 h-1.5 w-1.5 rounded-full bg-amber-400/80" />
      </div>
      {/* Chiếc dùi gõ mõ */}
      <div className="mobile-2d-mallet absolute -right-2 top-0.5 h-3.5 w-0.5 rounded-full bg-[#c29663]" />
    </div>
  );
}

/**
 * 3 Vị Thầy Chùa quỳ tụng kinh trang nghiêm trước điện Phật:
 * Đặt chính xác trên mặt sàn gỗ trước bàn thờ Tam Bảo (top: 67%-68%):
 * - Sư Trụ Trì (Lv.100, nam6.png, hào quang Phật quang, đệm sen to, gõ mõ)
 * - Thầy Minh Đạo bên trái (Lv.61, nam5.png, đệm sen, gõ mõ)
 * - Thầy Tâm Từ bên phải (Lv.61, nam5.png, đệm sen, gõ mõ)
 */
function ChantingMonks2D({ mobile }: { mobile: boolean }) {
  const monks = useMemo(
    () => [
      {
        title: 'Thầy Minh Đạo',
        level: 61,
        isAbbot: false,
        assetUrl: '/assets/nam5.png',
        left: mobile ? 36 : 44,
        top: mobile ? 67.5 : 55,
      },
      {
        title: 'Sư Trụ Trì',
        level: 100,
        isAbbot: true,
        assetUrl: '/assets/nam6.png',
        left: 50,
        top: mobile ? 67 : 54,
      },
      {
        title: 'Thầy Tâm Từ',
        level: 61,
        isAbbot: false,
        assetUrl: '/assets/nam5.png',
        left: mobile ? 64 : 56,
        top: mobile ? 67.5 : 55,
      },
    ],
    [mobile],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-15" aria-hidden="true">
      {monks.map((monk) => (
        <div
          key={monk.title}
          className="mobile-2d-figure"
          style={{
            left: `${monk.left}%`,
            top: `${monk.top}%`,
            transform: `translate(-50%, -50%) scale(${monk.isAbbot ? 0.72 : 0.68})`,
            zIndex: monk.isAbbot ? 18 : 16,
          }}
        >
          {/* Nhãn tên vàng trang nghiêm kèm số Level trên đầu */}
          <div className="mb-1 select-none">
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-serif text-center shadow-xl backdrop-blur-md whitespace-nowrap ${
                monk.isAbbot
                  ? 'border-amber-300 bg-gradient-to-r from-[#3e1b0c] via-[#5c2a12] to-[#3e1b0c] text-xs font-black text-amber-200 ring-2 ring-amber-400/40'
                  : 'border-amber-400/60 bg-[#28150c]/90 text-[11px] font-bold text-amber-100'
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.5 text-[8px] font-black text-slate-950 shadow ${
                  monk.isAbbot
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                }`}
              >
                {monk.level}
              </span>
              <span>{monk.title}</span>
            </div>
          </div>

          {/* Hào quang Phật quang rực rỡ riêng cho Sư Trụ Trì */}
          {monk.isAbbot && <AbbotAura2D />}

          {/* Thân Thầy chùa ngồi quỳ tụng kinh (Row 2 của sprite sheet) */}
          <DevoteeSprite2D assetUrl={monk.assetUrl} pose="SEATED" />

          {/* Chiếc Mõ gỗ sơn son */}
          <WoodenFish2D isAbbot={monk.isAbbot} />

          {/* Đệm ngồi toà sen thêu vàng */}
          <img
            src="/assets/lotus-cushion.svg"
            alt=""
            className="pointer-events-none -mt-4.5 h-7 w-18 object-contain drop-shadow"
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Huy hiệu lễ vật / hoa cúng mang theo khi Phật tử đang vào hành lễ
 */
function OfferingBadge2D({
  action,
  state,
}: {
  action: TempleGameAction;
  state: CharacterState;
}) {
  const isFlower = action.actionType === 'OFFER_FLOWERS';
  const isGift = action.eventType === 'GIFT' || action.actionType === 'OFFER_INCENSE';
  const isLeaving = state === 'EXITING' || state === 'COMPLETED';

  if ((!isFlower && !isGift) || isLeaving) return null;

  const offeringName = isFlower
    ? action.giftName || 'Hoa dâng Phật'
    : action.giftName || 'Lễ vật cúng dường';

  return (
    <div className="animate-in fade-in zoom-in absolute -right-16 top-4 z-30 flex min-w-20 flex-col items-center rounded-2xl border border-amber-200/60 bg-amber-950/85 px-2.5 py-1 text-center text-amber-50 shadow-2xl backdrop-blur-md duration-200">
      <div className="animate-bounce text-3xl leading-none drop-shadow-[0_4px_8px_rgba(255,190,50,.8)]">
        {isFlower ? '💐' : '🎁'}
      </div>
      <div className="mt-1 max-w-28 truncate text-[10px] font-bold text-amber-100">
        {offeringName}
      </div>
      {(action.quantity ?? 1) > 1 && (
        <div className="text-xs font-black text-amber-300">×{action.quantity}</div>
      )}
    </div>
  );
}

/**
 * Đốm sáng bụi vàng (dust motes) bay lơ lửng trong chánh điện theo mức đồ họa
 */
function TempleEffects2D({ quality }: { quality: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  if (quality === 'LOW') return null;
  const count = quality === 'MEDIUM' ? 18 : 30;

  return (
    <div className="pointer-events-none absolute inset-0 z-8 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const left = ((i * 37 + 13) % 94) + 3;
        const top = ((i * 53 + 7) % 84) + 6;
        const size = (i % 3) * 2 + 3;
        const delay = (i % 7) * 0.7;
        const duration = 4.5 + (i % 5) * 1.2;

        return (
          <div
            key={i}
            className="absolute rounded-full bg-amber-200/65 shadow-[0_0_8px_#ffd54f]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${size}px`,
              height: `${size}px`,
              animation: `float-mote ${duration}s ease-in-out ${delay}s infinite alternate`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * 24 Chỗ ngồi quỳ niệm Phật của Phật tử (Seated Visitors)
 * - Mỗi người đều ngồi trên Đệm sen toà thêu vàng (lotus-cushion.svg)
 * - Quỳ chắp tay tĩnh tại, thỉnh thoảng cúi đầu nhẹ theo tiếng kinh
 * - Có vòng hào quang nếu đạt cấp bậc cao (Lv.81-100)
 */
function Mobile2DSeatedVisitors({
  hideSimulated,
  mobile,
}: {
  hideSimulated: boolean;
  mobile: boolean;
}) {
  const seatedVisitors = useTempleGameStore((state) => state.seatedVisitors);
  const active = useTempleGameStore((state) => state.active);
  const userInteractions = useTempleGameStore((state) => state.userInteractions);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(interval);
  }, []);

  const activeUsers = useMemo(() => new Set(active.map((item) => item.action.userId)), [active]);

  const visibleVisitors = useMemo(
    () =>
      seatedVisitors
        .filter((visitor) => {
          if (hideSimulated && visitor.isSimulated) return false;
          if (activeUsers.has(visitor.userId)) return false;
          const duration = calculateSeatingDuration(visitor, userInteractions[visitor.userId] || 0);
          return now - (visitor.seatedAt ?? visitor.createdAt) <= duration;
        })
        .slice(0, 24),
    [activeUsers, hideSimulated, now, seatedVisitors, userInteractions],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-16" aria-hidden="true">
      {visibleVisitors.map((visitor, index) => {
        const seatIndex = visitor.seatIndex !== undefined ? visitor.seatIndex : index;
        const coords = get2DSeatCoordinates(seatIndex, mobile);
        const interactions = userInteractions[visitor.userId] || 0;
        const isFemale = hashText(visitor.userId) % 12 !== 0;
        const cultivation = getCultivationInfo(interactions, isFemale);

        return (
          <div
            key={visitor.userId}
            className="mobile-2d-figure"
            style={{
              left: `${coords.left}%`,
              top: `${coords.top}%`,
              transform: `translate(-50%, -50%) scale(${coords.scale})`,
              zIndex: coords.zIndex,
            }}
          >
            {/* Huy hiệu Avatar + Level + Tên hoặc Bong bóng bình luận */}
            <DevoteeHeadBadge action={visitor} isFemale={isFemale} />

            {/* Vòng hào quang Phật quang nếu đạt cấp bậc cao */}
            {cultivation.hasHalo && <DevoteeHalo2D color={cultivation.haloColor} />}

            {/* Thân Phật tử quỳ niệm Phật (cắt chính xác Row 2) */}
            <DevoteeSprite2D assetUrl={cultivation.assetUrl} pose="SEATED" />

            {/* Đệm sen toà thêu vàng lót dưới chỗ ngồi */}
            <img
              src="/assets/lotus-cushion.svg"
              alt=""
              className="pointer-events-none -mt-4.5 h-7 w-18 object-contain drop-shadow"
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Nhân vật đang trong chu trình hành lễ (Active Character)
 * Đi từ cuối thảm đỏ vào điện -> dâng hoa / quỳ lạy / niệm Phật -> bước sang mép thảm về chỗ ngồi
 */
function Mobile2DCharacter({
  character,
  lane,
  paused,
  mobile,
  worshipDistance,
}: {
  character: ActiveCharacter;
  lane: number;
  paused: boolean;
  mobile: boolean;
  worshipDistance: WorshipDistance;
}) {
  const { setState, complete, addFlower } = useTempleGameStore();
  const action = character.action;
  const state = character.state;
  const offeredRef = useRef(false);
  const [animTick, setAnimTick] = useState(0);

  // Bộ đếm nhịp hoạt ảnh bước đi và quỳ lạy
  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      setAnimTick((t) => (t + 1) % 120);
    }, 200);
    return () => window.clearInterval(interval);
  }, [paused]);

  const isJoinOnly = action.eventType === 'JOIN';
  const isDonation =
    action.eventType === 'GIFT' ||
    action.actionType === 'OFFER_FLOWERS' ||
    action.actionType === 'OFFER_INCENSE';

  const userHash = hashText(action.userId);
  const isFemale = userHash % 12 !== 0;
  const interactions = useTempleGameStore((s) => s.userInteractions[action.userId] || 0);
  const cultivation = getCultivationInfo(interactions, isFemale);

  // Ghế ngồi cố định đã phân bổ trong chánh điện
  const resolvedSeatIndex = action.seatIndex !== undefined ? action.seatIndex : userHash % 24;
  const seatCoords = useMemo(
    () => get2DSeatCoordinates(resolvedSeatIndex, mobile),
    [resolvedSeatIndex, mobile],
  );

  // Toạ độ điểm hành lễ trước điện Phật (ngay trước bàn thờ, trên thảm đỏ)
  const isNearStatue = worshipDistance === 'NEAR';
  const worshipTop = mobile ? (isNearStatue ? 72 : 76) : isNearStatue ? 59 : 63;
  const worshipScale = mobile ? (isNearStatue ? 0.76 : 0.82) : isNearStatue ? 0.72 : 0.8;
  const laneOffset = [-6, -2, 2, 6][lane % 4];

  // Vòng đời hành lễ của nhân vật (đồng bộ chuẩn 3D)
  useEffect(() => {
    if (paused) return;

    let timer: number | undefined;
    let offeringTimer: number | undefined;

    if (state === 'SPAWNING') {
      setState(action.actionId, 'WALKING_TO_ALTAR');
    } else if (state === 'WALKING_TO_ALTAR' || state === 'WALKING_TO_GATE') {
      timer = window.setTimeout(
        () => {
          // Người xem vừa JOIN: đi thẳng vào chỗ ngồi đệm sen đã cấp
          if (isJoinOnly) {
            complete(action.actionId);
            return;
          }
          if (action.actionType === 'OFFER_FLOWERS') {
            setState(action.actionId, 'OFFERING_FLOWERS');
          } else if (isDonation) {
            setState(action.actionId, 'BOWING');
          } else {
            setState(action.actionId, 'PRAYING');
          }
        },
        isJoinOnly ? 3500 : 4500,
      );
    } else if (state === 'OFFERING_FLOWERS') {
      if (!offeredRef.current) {
        offeringTimer = window.setTimeout(() => {
          offeredRef.current = true;
          addFlower();
        }, 1500);
      }
      // Dâng hoa xong thì chuyển sang quỳ lạy 3 lạy
      timer = window.setTimeout(() => {
        setState(action.actionId, 'BOWING');
      }, 3500);
    } else if (state === 'BOWING') {
      // Quỳ lạy 3 lạy trang nghiêm (10s) rồi bước về chỗ ngồi
      timer = window.setTimeout(() => {
        setState(action.actionId, 'EXITING');
      }, 10_000);
    } else if (state === 'PRAYING' || state === 'WAITING') {
      // Chắp tay niệm Phật (5s) rồi bước về chỗ ngồi
      timer = window.setTimeout(() => {
        setState(action.actionId, 'EXITING');
      }, 5_000);
    } else if (state === 'EXITING') {
      // Bước từ điện Phật dạt sang mép thảm rồi về chỗ ngồi
      timer = window.setTimeout(() => {
        complete(action.actionId);
      }, 3500);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
      if (offeringTimer) window.clearTimeout(offeringTimer);
    };
  }, [action.actionId, action.actionType, addFlower, complete, isDonation, isJoinOnly, paused, setState, state]);

  // Vị trí và tư thế tương ứng theo từng giai đoạn
  let currentLeft = 50 + laneOffset;
  let currentTop = 98;
  let currentScale = 1.0;
  let transitionDuration = '0s';
  let activePose: DevoteePose = 'WALK_BACK';

  if (state === 'SPAWNING') {
    currentLeft = 50 + laneOffset;
    currentTop = 98;
    currentScale = 1.0;
    transitionDuration = '0s';
    activePose = 'WALK_BACK';
  } else if (state === 'WALKING_TO_ALTAR' || state === 'WALKING_TO_GATE') {
    if (isJoinOnly) {
      // Đi thẳng từ cửa vào chỗ ngồi
      currentLeft = seatCoords.left;
      currentTop = seatCoords.top;
      currentScale = seatCoords.scale;
      transitionDuration = '3.5s';
      activePose = 'WALK_BACK';
    } else {
      // Đi dọc theo thảm đỏ vào trước điện Phật
      currentLeft = 50 + laneOffset * 0.4;
      currentTop = worshipTop;
      currentScale = worshipScale;
      transitionDuration = '4.5s';
      activePose = 'WALK_BACK';
    }
  } else if (state === 'OFFERING_FLOWERS') {
    currentLeft = 50 + laneOffset * 0.4;
    currentTop = worshipTop;
    currentScale = worshipScale;
    activePose = 'OFFERING';
  } else if (state === 'BOWING') {
    currentLeft = 50 + laneOffset * 0.4;
    currentTop = worshipTop;
    currentScale = worshipScale;
    activePose = 'BOWING';
  } else if (state === 'PRAYING' || state === 'WAITING') {
    currentLeft = 50 + laneOffset * 0.4;
    currentTop = worshipTop;
    currentScale = worshipScale;
    activePose = 'PRAYING';
  } else if (state === 'EXITING') {
    // Bước từ trên chánh điện xuống chỗ ngồi:
    // SỬ DỤNG HOÀNG ẢNH ĐI HƯỚNG VỀ PHÍA TRƯỚC (WALK_FRONT)
    // Khắc phục triệt để lỗi đi lùi đằng lưng!
    currentLeft = seatCoords.left;
    currentTop = seatCoords.top;
    currentScale = seatCoords.scale;
    transitionDuration = '3.5s';
    activePose = 'WALK_FRONT';
  }

  const figureStyle: CSSProperties = {
    left: `${currentLeft}%`,
    top: `${currentTop}%`,
    transform: `translate(-50%, -50%) scale(${currentScale})`,
    transition: `top ${transitionDuration} linear, left ${transitionDuration} ease-out, transform ${transitionDuration} linear`,
    zIndex: state === 'EXITING' ? seatCoords.zIndex : 35,
  };

  return (
    <div className="mobile-2d-figure" style={figureStyle}>
      {/* Huy hiệu Avatar + Level + Tên hoặc Bong bóng bình luận */}
      <DevoteeHeadBadge action={action} isFemale={isFemale} />

      {/* Huy hiệu lễ vật hoặc hoa cúng dường */}
      <OfferingBadge2D action={action} state={state} />

      {/* Vòng hào quang Phật quang nếu đạt cấp cao */}
      {cultivation.hasHalo && <DevoteeHalo2D color={cultivation.haloColor} />}

      {/* Thân Phật tử chuyển động linh hoạt theo tư thế với clipper chuẩn xác */}
      <DevoteeSprite2D
        assetUrl={cultivation.assetUrl}
        pose={activePose}
        animTick={animTick}
      />
    </div>
  );
}

/**
 * ============================================================================
 * COMPONENT CHÍNH: Mobile2DOverlayPage
 * ============================================================================
 */
export function Mobile2DOverlayPage({ mobile = true }: { mobile?: boolean }) {
  const { active, allowSimulated, paused } = useTempleGameStore();
  const connection = useMonitorStore((state) => state.connection);

  const [preset, setPreset] = useState<CameraPreset>('OVERVIEW');
  const [theme, setTheme] = useState<TempleTheme>('INTERIOR');
  const [worshipDistance, setWorshipDistance] = useState<WorshipDistance>('NEAR');
  const [isOverlayToolbarVisible, setIsOverlayToolbarVisible] = useState(true);

  const quality = useTempleGameStore((s) => s.quality);
  const hideSimulated = !allowSimulated;

  // Tự động phát nhạc nền chánh điện và mở khóa âm thanh khi tương tác
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('sound') === '1' || searchParams.get('muted') === '0') {
        templeAudio.setMuted(false);
      } else if (searchParams.get('sound') === '0' || searchParams.get('muted') === '1') {
        templeAudio.setMuted(true);
      }
    }

    if (!templeAudio.getMuted()) {
      templeAudio.startBgm();
    }

    const handleUnlockAudio = () => {
      if (!templeAudio.getMuted()) {
        templeAudio.startBgm();
      }
    };

    window.addEventListener('pointerdown', handleUnlockAudio, { once: true });
    window.addEventListener('keydown', handleUnlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleUnlockAudio);
      window.removeEventListener('keydown', handleUnlockAudio);
      templeAudio.pauseBgm();
    };
  }, []);

  // Giả lập ngẫu nhiên 1, 2 người đi vào 1 lần, 5 giây sau lại vào; không tràn vào (chuẩn 3D)
  useEffect(() => {
    if (!allowSimulated || connection.state === 'CONNECTED') return;

    let timer: number | null = null;
    let cancelled = false;

    const runSimCycle = async () => {
      if (cancelled) return;
      await sendSimulatedBatch();
      if (!cancelled) {
        timer = window.setTimeout(runSimCycle, 5000);
      }
    };

    timer = window.setTimeout(runSimCycle, 2500);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [allowSimulated, connection.state]);

  // Ảnh nền không gian chùa (Nội điện hoặc Ngoại cảnh)
  const backdropUrl =
    theme === 'INTERIOR'
      ? mobile
        ? '/assets/temple-interior-mobile-backdrop.png'
        : '/assets/temple-interior-full-backdrop.png'
      : mobile
        ? '/assets/temple-courtyard-2d-mobile.png'
        : '/assets/temple-courtyard-2d-desktop.png';

  const viewportPresetClass =
    preset === 'ENTRANCE'
      ? 'mobile-2d-viewport--entrance'
      : preset === 'SHRINE'
        ? 'mobile-2d-viewport--shrine'
        : 'mobile-2d-viewport--overview';

  return (
    <div
      className={`mobile-2d-stage relative h-screen w-screen overflow-hidden bg-slate-950 ${
        paused ? 'mobile-2d-paused' : ''
      }`}
      style={{
        backgroundImage: `url('${backdropUrl}')`,
      }}
    >
      {/* Lớp viewport di chuyển mượt mà theo góc nhìn Camera Preset */}
      <div className={`mobile-2d-viewport ${viewportPresetClass}`}>
        {/* Ánh sáng huyền ảo chánh điện */}
        <div className="mobile-2d-light-layer" />

        {/* 3 Vị Thầy Chùa quỳ tụng kinh trước điện Phật (đúng trên mặt sàn) */}
        {theme === 'INTERIOR' && <ChantingMonks2D mobile={mobile} />}

        {/* 24 Chỗ ngồi quỳ niệm Phật trên đệm sen toà thêu vàng */}
        <Mobile2DSeatedVisitors hideSimulated={hideSimulated} mobile={mobile} />

        {/* Lớp hiển thị các Phật tử đang bước vào hành lễ */}
        <div className="pointer-events-none absolute inset-0 z-30" aria-hidden="true">
          {active
            .filter((character) => !(hideSimulated && character.action.isSimulated))
            .map((character, index) => (
              <Mobile2DCharacter
                key={character.action.actionId}
                character={character}
                lane={index}
                paused={paused}
                mobile={mobile}
                worshipDistance={worshipDistance}
              />
            ))}
        </div>

        {/* Các hạt bụi vàng lơ lửng huyền ảo */}
        <TempleEffects2D quality={quality} />
      </div>

      {/* Lớp phủ gradient ánh sáng phía trên và phía dưới màn hình */}
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/20 via-transparent to-black/30" />

      {/* Bảng Top Donate / Công Đức ✦ góc phải trên */}
      <div className={`absolute z-30 ${mobile ? 'top-14 right-2' : 'top-20 right-4'}`}>
        <MeritLeaderboard mobile={mobile} />
      </div>

      {/* Danh sách 5 người Donate mới nhất bên trái, từ trên xuống (đã bỏ khung và nền vướng víu) */}
      <div className={`absolute z-30 ${mobile ? 'top-14 left-2' : 'top-20 left-4'}`}>
        <RecentDonorsList mobile={mobile} />
      </div>

      {/* Thanh điều khiển TempleToolbar phía dưới màn hình */}
      {isOverlayToolbarVisible && (
        <div
          className={
            mobile
              ? 'absolute right-2 bottom-2 left-2 z-40 flex flex-wrap items-center justify-center gap-2'
              : 'absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2'
          }
        >
          <TempleToolbar
            preset={preset}
            setPreset={setPreset}
            theme={theme}
            setTheme={setTheme}
            compact
            worshipDistance={mobile ? worshipDistance : undefined}
            setWorshipDistance={mobile ? setWorshipDistance : undefined}
            extraAction={
              <a
                className="rounded-lg bg-violet-500/20 px-2 py-1.5 font-bold text-violet-200 transition hover:bg-violet-500/35"
                href={mobile ? '/overlay-mobile' : '/overlay'}
                title="Mở phiên bản 3D WebGL"
              >
                Bản 3D
              </a>
            }
          />
          <button
            type="button"
            className="btn border border-white/15 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur-xl"
            onClick={() => setIsOverlayToolbarVisible(false)}
            title="Ẩn thanh điều khiển"
          >
            <EyeOff size={15} /> Ẩn
          </button>
        </div>
      )}

      {/* Nút tròn nhỏ hiện lại thanh điều khiển khi đang ẩn */}
      {!isOverlayToolbarVisible && (
        <button
          type="button"
          className="absolute right-3 bottom-3 z-40 rounded-full border border-white/15 bg-slate-950/55 p-2 text-slate-300 opacity-35 shadow-lg backdrop-blur transition hover:opacity-100"
          onClick={() => setIsOverlayToolbarVisible(true)}
          title="Hiện thanh điều khiển"
          aria-label="Hiện thanh điều khiển overlay"
        >
          <Eye size={16} />
        </button>
      )}
    </div>
  );
}
