/**
 * ============================================================================
 * INTERACTION EFFECTS OVERLAY COMPONENT
 * Lớp phủ đồ họa hiển thị các hiệu ứng tương tác: cánh hoa rơi, hoa sen nở,
 * đại cảnh hào quang Phật quang, combo quà tặng và banner thông báo.
 * Sử dụng thuần React DOM và CSS Hardware Acceleration (GPU), không gây nặng WebGL.
 * ============================================================================
 */

import { useEffect, useMemo } from 'react';
import { Sparkles, Award } from 'lucide-react';
import {
  useInteractionEffectsStore,
  type ConcurrentEffect,
  type QueuedEffect,
} from '../useInteractionEffectsStore';
import '../interaction-effects.css';

/**
 * Hiệu ứng hạt cánh hoa rơi ngẫu nhiên từ sprite sheet hoa1.png (4x4 = 16 ô)
 */
function PetalRain({ count = 20, durationSec = 2.5 }: { count?: number; durationSec?: number }) {
  const petals = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const left = ((i * 17 + 7) % 94) + 3;
      const delay = (i % 8) * 0.22;
      const size = 32 + (i % 5) * 8; // Kích thước cánh hoa 32px - 64px
      const frameIndex = (i * 3 + 1) % 16; // Chọn 1 trong 16 ô cánh hoa của hoa1.png
      const animDuration = durationSec + ((i % 4) - 2) * 0.3;

      return {
        id: i,
        left,
        delay,
        size,
        frameClass: `petal-frame-${frameIndex}`,
        animDuration,
      };
    });
  }, [count, durationSec]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className={`petal-sprite ${petal.frameClass}`}
          style={{
            left: `${petal.left}%`,
            top: '-50px',
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            animation: `petal-fall ${petal.animDuration}s linear ${petal.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Cánh hoa sen bay xoay quanh nhân vật (Like 10 hoặc Xem live 15m)
 */
function PetalsOrbit({ count = 3 }: { count?: number }) {
  const orbits = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const frameIndex = (i * 5 + 2) % 16;
      const delay = i * 0.25;
      return { id: i, frameClass: `petal-frame-${frameIndex}`, delay };
    });
  }, [count]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
      {orbits.map((item) => (
        <div
          key={item.id}
          className={`petal-sprite ${item.frameClass}`}
          style={{
            width: '42px',
            height: '42px',
            animation: `petal-orbit 1.2s ease-in-out ${item.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Bông sen nở rực rỡ từ sprite sheet hoa2.png (4x3 = 12 frame liên hoàn)
 * Nền hoàn toàn trong suốt, không đệm background, hoa chuyển động tuần tự từ nụ đến nở hoa
 */
function LotusBloom({ size = 180, durationSec = 3.6 }: { size?: number; durationSec?: number }) {
  return (
    <div
      className="pointer-events-none relative flex items-center justify-center select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      {/* Đóa hoa sen chuyển động tuần tự 12 khung hình nở hoa trên nền trong suốt */}
      <div
        className="lotus-glow-sprite"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          animation: `lotus-spritesheet-play ${durationSec}s steps(1) forwards, lotus-bloom-fade ${durationSec}s ease-out forwards`,
        }}
      />
    </div>
  );
}

/**
 * Đại cảnh Hoa Sen Kim Quang dành cho Gift từ 500 Coin & Chuyển cấp nhân vật
 * Xuất hiện trang nghiêm ngay phía trước điện Phật trên thảm đỏ chánh điện (top: 58%)
 */
function GrandLotusCeremony({ rankName, gender = 'female' }: { rankName?: string; gender?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* 1. Mưa cánh hoa sen vàng rực rơi toàn màn hình */}
      <PetalRain count={35} durationSec={5.0} />

      {/* 2. Đóa hoa sen phát sáng nở đúng vị trí trang nghiêm trước điện Phật */}
      <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
        <LotusBloom size={300} durationSec={5.0} />

        {/* Nếu là Chuyển Cấp: Hiển thị danh hiệu đắc vị */}
        {rankName && (
          <div className="animate-in zoom-in fade-in relative mt-4 flex flex-col items-center duration-700">
            <div className="rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 px-6 py-1.5 shadow-2xl backdrop-blur-md">
              <span className="font-serif text-base font-black tracking-wider text-amber-200 drop-shadow">
                ✨ {rankName} ✨
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Banner thông báo hiệu ứng lớn (Gift lớn, Lên level, Chuyển cấp, Follow, Share)
 */
function EffectNoticeBanner({ effect }: { effect: QueuedEffect }) {
  return (
    <div className="effect-notice-banner select-none">
      {effect.avatarUrl ? (
        <img
          src={effect.avatarUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full border-2 border-amber-400 object-cover shadow-lg"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-950 text-amber-200 shadow-md">
          <Sparkles size={18} className="text-amber-300 animate-spin" />
        </div>
      )}
      <div className="flex flex-col text-left">
        <div className="font-serif text-sm font-black text-amber-200 drop-shadow leading-snug">
          {effect.title}
        </div>
        {effect.subTitle && (
          <div className="text-xs font-semibold text-amber-100/90 leading-tight">
            {effect.subTitle}
          </div>
        )}
      </div>
      {effect.newLevel && (
        <div className="ml-1 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-1 text-[11px] font-black text-slate-950 shadow">
          <Award size={13} />
          <span>Lv.{effect.newLevel}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * COMPONENT CHÍNH: InteractionEffectsOverlay
 * Đặt component này vào bất kỳ màn hình nào (2D hoặc 3D) để hiển thị trọn bộ hiệu ứng.
 * ============================================================================
 */
export function InteractionEffectsOverlay() {
  const {
    concurrentEffects,
    currentQueuedEffect,
    soundEnabled,
    setSoundEnabled,
    cleanupExpiredConcurrentEffects,
  } = useInteractionEffectsStore();

  // Dọn dẹp hiệu ứng nhỏ định kỳ mỗi giây
  useEffect(() => {
    const timer = window.setInterval(cleanupExpiredConcurrentEffects, 1000);
    return () => window.clearInterval(timer);
  }, [cleanupExpiredConcurrentEffects]);

  // Kiểm tra các hiệu ứng nhỏ đang hoạt động
  const hasPetalRain = concurrentEffects.some((e) => e.type === 'PETALS_RAIN_SMALL');
  const hasPetalsOrbit = concurrentEffects.some((e) => e.type === 'PETALS_ORBIT');
  const hasLotusFootBloom = concurrentEffects.some((e) => e.type === 'LOTUS_FOOT_BLOOM');

  return (
    <div className="effects-overlay-container">
      {/* 1. Mưa hoa nhỏ từ các sự kiện Like 100, Combo hoa, Gift */}
      {hasPetalRain && <PetalRain count={20} durationSec={2.5} />}

      {/* 2. Cánh hoa bay quanh nhân vật từ Like 10, Xem live */}
      {hasPetalsOrbit && <PetalsOrbit count={3} />}

      {/* 3. Hoa sen nở tại chỗ từ comment "Nam mô A Di Đà Phật" hoặc Follow */}
      {hasLotusFootBloom && (
        <div className="absolute left-1/2 top-[61.5%] -translate-x-1/2 -translate-y-1/2">
          <LotusBloom size={180} durationSec={3.2} />
        </div>
      )}

      {/* 4. Hiệu ứng lớn trong hàng đợi (Priority Queue) */}
      {currentQueuedEffect && (
        <>
          {/* Banner thông báo nổi bật */}
          <EffectNoticeBanner effect={currentQueuedEffect} />

          {/* Đại cảnh hoa sen cho Gift từ 500 coin & Chuyển cấp nhân vật */}
          {(currentQueuedEffect.type === 'MEGA_GIFT' || currentQueuedEffect.type === 'RANK_UP') && (
            <GrandLotusCeremony
              rankName={currentQueuedEffect.rankName}
              gender={currentQueuedEffect.gender}
            />
          )}

          {/* Mưa hoa toàn màn hình cho Gift 100-499 Coin */}
          {currentQueuedEffect.type === 'MAJOR_GIFT' && (
            <PetalRain count={35} durationSec={4.5} />
          )}

          {/* Hiệu ứng lên level */}
          {currentQueuedEffect.type === 'LEVEL_UP' && (
            <PetalRain count={25} durationSec={3.5} />
          )}
        </>
      )}
    </div>
  );
}

