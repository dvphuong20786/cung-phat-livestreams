import { useState, useRef, useEffect } from 'react';
import { Zap, Send, Users, Play, Square, UserPlus } from 'lucide-react';
import type { LiveEventType, SimulatorInput } from '@live/shared';
import { command } from '../../services/socket';
import { sendSimulatedBatch, sendSimulatedVisitor } from '../../services/simulatorService';

export function SimulatorPanel() {
  const [username, setUsername] = useState('thien_tam');
  const [nickname, setNickname] = useState('Thiện Tâm');
  const [type, setType] = useState<LiveEventType>('LIKE');
  const [likeCount, setLikeCount] = useState(1);
  const [comment, setComment] = useState('Nam mô A Di Đà Phật');
  const [giftName, setGiftName] = useState('Rose');
  const [giftQty, setGiftQty] = useState(1);

  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [busyBatch, setBusyBatch] = useState(false);
  const [batchStatus, setBatchStatus] = useState<string>('');

  const autoSimTimerRef = useRef<number | null>(null);
  const isAutoSimulatingRef = useRef(isAutoSimulating);
  isAutoSimulatingRef.current = isAutoSimulating;

  const stopBatchRef = useRef(false);

  // Vòng lặp tự động giả lập 1-2 người mỗi 5 giây
  useEffect(() => {
    if (!isAutoSimulating) {
      if (autoSimTimerRef.current) {
        window.clearTimeout(autoSimTimerRef.current);
        autoSimTimerRef.current = null;
      }
      return;
    }

    let active = true;

    const runAutoStep = async () => {
      if (!active || !isAutoSimulatingRef.current) return;
      const count = await sendSimulatedBatch();
      setBatchStatus(`Vừa vào: ${count} người. Chờ 5 giây cho lượt tiếp...`);

      if (active && isAutoSimulatingRef.current) {
        autoSimTimerRef.current = window.setTimeout(runAutoStep, 5000);
      }
    };

    runAutoStep();

    return () => {
      active = false;
      if (autoSimTimerRef.current) {
        window.clearTimeout(autoSimTimerRef.current);
        autoSimTimerRef.current = null;
      }
    };
  }, [isAutoSimulating]);

  const send = async (p: Partial<SimulatorInput> = {}) => {
    const t = p.type ?? type;
    await command('simulator:emit', {
      type: t,
      username: p.username ?? username,
      nickname: p.nickname ?? nickname,
      likeCount: t === 'LIKE' ? p.likeCount ?? likeCount : undefined,
      comment: t === 'COMMENT' ? p.comment ?? comment : undefined,
      gift: t === 'GIFT' ? p.gift ?? { name: giftName, quantity: giftQty, repeatEnd: true } : undefined,
    });
  };

  const handleInstantBatch = async () => {
    const count = await sendSimulatedBatch();
    setBatchStatus(`Đã tạo ngẫu nhiên ${count} người đi vào chánh điện.`);
  };

  // Giả lập danh sách số lượng người theo nhịp 1-2 người mỗi 5 giây (không tràn vào)
  const handlePacedRun = async (totalTarget: number) => {
    setBusyBatch(true);
    stopBatchRef.current = false;
    let completed = 0;

    while (completed < totalTarget && !stopBatchRef.current) {
      const remaining = totalTarget - completed;
      const count = Math.min(remaining, Math.random() < 0.5 ? 1 : 2);

      for (let i = 0; i < count; i++) {
        if (stopBatchRef.current) break;
        await sendSimulatedVisitor();
        completed++;
        if (i < count - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }

      setBatchStatus(`Tiến độ: đã vào ${completed}/${totalTarget} người...`);

      if (completed < totalTarget && !stopBatchRef.current) {
        // Đúng 5 giây sau mới vào tiếp 1, 2 người tiếp theo
        await new Promise((r) => setTimeout(r, 5000));
      }
    }

    setBusyBatch(false);
    setBatchStatus(
      stopBatchRef.current
        ? `Đã dừng giả lập. Tổng cộng đã vào: ${completed} người.`
        : `Hoàn tất giả lập ${completed} người.`,
    );
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold">Giả lập tương tác chánh điện</h2>
          <p className="mt-1 text-xs text-violet-300">
            Dữ liệu thử nghiệm — nhịp 1-2 người mỗi 5 giây, không tràn vào
          </p>
        </div>
        <Zap className="text-amber-300" size={20} />
      </div>

      {/* Điều khiển Giả Lập Tự Động (1-2 người / 5s) */}
      <div className="mb-4 rounded-xl border border-violet-500/30 bg-violet-950/20 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-xs text-violet-200">
              Chế độ giả lập nhịp nhàng (1-2 người / 5 giây)
            </div>
            <div className="text-[11px] text-slate-400">
              Ngẫu nhiên vào vãng cảnh, thả tim, bình luận cầu an hoặc dâng hoa
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30"
              onClick={handleInstantBatch}
              title="Vào ngay 1 hoặc 2 người"
            >
              <UserPlus size={14} /> Vào ngay 1-2 người
            </button>
            <button
              type="button"
              className={`btn ${
                isAutoSimulating
                  ? 'bg-rose-500/20 text-rose-200 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
              }`}
              onClick={() => setIsAutoSimulating(!isAutoSimulating)}
            >
              {isAutoSimulating ? <Square size={14} /> : <Play size={14} />}
              <span>{isAutoSimulating ? 'Dừng tự động' : 'Bật tự động (1-2 người / 5s)'}</span>
            </button>
          </div>
        </div>
        {batchStatus && (
          <div className="mt-2 text-[11px] font-medium text-amber-300">
            {batchStatus}
          </div>
        )}
      </div>

      {/* Form gửi sự kiện đơn lẻ */}
      <div className="grid grid-cols-2 gap-3">
        <input
          className="field"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          className="field"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Biệt danh"
        />
        <select
          className="field"
          value={type}
          onChange={(e) => setType(e.target.value as LiveEventType)}
        >
          <option value="LIKE">Like</option>
          <option value="COMMENT">Bình luận</option>
          <option value="GIFT">Quà tặng</option>
          <option value="FOLLOW">Theo dõi</option>
          <option value="SHARE">Chia sẻ</option>
          <option value="JOIN">Tham gia</option>
        </select>
        {type === 'LIKE' && (
          <input
            className="field"
            type="number"
            min="1"
            value={likeCount}
            onChange={(e) => setLikeCount(+e.target.value)}
          />
        )}
        {type === 'COMMENT' && (
          <input
            className="field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        )}
        {type === 'GIFT' && (
          <>
            <input
              className="field"
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
            />
            <input
              className="field"
              type="number"
              min="1"
              value={giftQty}
              onChange={(e) => setGiftQty(+e.target.value)}
            />
          </>
        )}
      </div>

      <button className="btn mt-3 w-full bg-violet-600" onClick={() => send()}>
        <Send size={16} /> Gửi sự kiện thủ công
      </button>

      {/* Các nút sự kiện nhanh */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <button className="btn bg-pink-500/10 text-pink-300" onClick={() => send({ type: 'LIKE', likeCount: 1 })}>
          ❤️ Gửi Like
        </button>
        <button className="btn bg-pink-500/10 text-pink-300" onClick={() => send({ type: 'LIKE', likeCount: 10 })}>
          ❤️ Gửi 10 Like
        </button>
        <button
          className="btn bg-violet-500/10 text-violet-300"
          onClick={() => send({ type: 'GIFT', gift: { name: 'Rose', quantity: 1, repeatEnd: true } })}
        >
          🌹 Tặng Rose
        </button>
        <button
          className="btn bg-violet-500/10 text-violet-300"
          onClick={() => send({ type: 'GIFT', gift: { name: 'TikTok Universe', quantity: 1, repeatEnd: true } })}
        >
          🎁 Tặng Gift
        </button>
        <button className="btn bg-sky-500/10 text-sky-300" onClick={() => send({ type: 'COMMENT', comment })}>
          💬 Bình luận
        </button>
        <button className="btn bg-emerald-500/10 text-emerald-300" onClick={() => send({ type: 'FOLLOW' })}>
          ➕ Follow
        </button>
        <button className="btn bg-orange-500/10 text-orange-300" onClick={() => send({ type: 'SHARE' })}>
          ↗️ Share
        </button>
        <button
          className="btn bg-cyan-500/10 text-cyan-300"
          disabled={busyBatch}
          onClick={() => handlePacedRun(20)}
        >
          <Users size={15} /> {busyBatch ? 'Đang chạy nhịp 5s...' : 'Chạy 20 người (nhịp 5s)'}
        </button>
        {busyBatch && (
          <button
            className="btn col-span-2 bg-rose-500/20 text-rose-200"
            onClick={() => {
              stopBatchRef.current = true;
            }}
          >
            ⏹️ Dừng đợt giả lập hiện tại
          </button>
        )}
      </div>
    </section>
  );
}
