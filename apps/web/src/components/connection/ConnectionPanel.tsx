import { useState } from 'react';
import { Link2, Link2Off, LoaderCircle, TriangleAlert } from 'lucide-react';
import type { ConnectionStatus, RealEventSource } from '@live/shared';
import { command } from '../../services/socket';
import { useMonitorStore } from '../../stores/useMonitorStore';

interface PlatformConnectionCardProps {
  platform: RealEventSource;
  title: string;
  description: string;
  placeholder: string;
  value: string;
  status: ConnectionStatus;
  busy: boolean;
  error?: string;
  colorClasses: string;
  note: string;
  onValueChanged: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

function PlatformConnectionCard({
  platform,
  title,
  description,
  placeholder,
  value,
  status,
  busy,
  error,
  colorClasses,
  note,
  onValueChanged,
  onConnect,
  onDisconnect,
}: PlatformConnectionCardProps) {
  const isConnected = status.state === 'CONNECTED';
  const displayedError = error || status.error;

  return (
    <section className="card p-5" data-platform={platform}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-bold">{title}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isConnected
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
              {isConnected ? 'ĐANG NHẬN DỮ LIỆU THẬT' : 'CHƯA KẾT NỐI'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <div className={`rounded-xl p-2 ${colorClasses}`}>
          <Link2 size={20} />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="field flex-1"
          value={value}
          onChange={(event) => onValueChanged(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onConnect()}
          placeholder={placeholder}
          disabled={busy || isConnected}
        />
        <button
          className="btn bg-gradient-to-r from-violet-600 to-fuchsia-600 disabled:opacity-50"
          onClick={onConnect}
          disabled={busy || !value.trim() || isConnected}
        >
          {busy ? <LoaderCircle className="animate-spin" size={17} /> : <Link2 size={17} />}
          Kết nối
        </button>
        <button
          className="btn border border-white/10 bg-white/5 text-slate-300 disabled:opacity-40"
          onClick={onDisconnect}
          disabled={busy || status.state === 'DISCONNECTED'}
        >
          <Link2Off size={17} /> Ngắt
        </button>
      </div>

      {displayedError && (
        <div className="mt-3 flex gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          <TriangleAlert size={17} className="mt-0.5 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-amber-200/70">{note}</p>
    </section>
  );
}

export function ConnectionPanel() {
  const [values, setValues] = useState({ TIKTOK: '', YOUTUBE: '', FACEBOOK: '' });
  const [busyPlatform, setBusyPlatform] = useState<RealEventSource>();
  const [platformErrors, setPlatformErrors] = useState<Partial<Record<RealEventSource, string>>>(
    {},
  );
  const { connections, prefs } = useMonitorStore();

  const setValue = (platform: RealEventSource, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [platform]: value }));
  };

  const connect = async (platform: RealEventSource) => {
    setBusyPlatform(platform);
    setPlatformErrors((errors) => ({ ...errors, [platform]: undefined }));
    try {
      if (platform === 'TIKTOK') {
        await command('tiktok:connect', {
          username: values.TIKTOK,
          autoReconnect: prefs.autoReconnect,
        });
      } else {
        await command(`${platform.toLocaleLowerCase()}:connect`, { url: values[platform] });
      }
    } catch (error) {
      setPlatformErrors((errors) => ({
        ...errors,
        [platform]: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setBusyPlatform(undefined);
    }
  };

  const disconnect = async (platform: RealEventSource) => {
    setBusyPlatform(platform);
    try {
      await command(`${platform.toLocaleLowerCase()}:disconnect`);
    } catch (error) {
      setPlatformErrors((errors) => ({
        ...errors,
        [platform]: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setBusyPlatform(undefined);
    }
  };

  return (
    <div className="space-y-5">
      <PlatformConnectionCard
        platform="TIKTOK"
        title="Kết nối TikTok LIVE"
        description="Dán URL LIVE hoặc nhập username của tài khoản đang phát công khai"
        placeholder="@username hoặc https://www.tiktok.com/@username/live"
        value={values.TIKTOK}
        status={connections.TIKTOK}
        busy={busyPlatform === 'TIKTOK'}
        error={platformErrors.TIKTOK}
        colorClasses="bg-violet-500/10 text-violet-300"
        note="TikTok connector là tích hợp không chính thức, có thể bị gián đoạn hoặc yêu cầu xác minh."
        onValueChanged={(value) => setValue('TIKTOK', value)}
        onConnect={() => void connect('TIKTOK')}
        onDisconnect={() => void disconnect('TIKTOK')}
      />
      <PlatformConnectionCard
        platform="YOUTUBE"
        title="Kết nối YouTube LIVE"
        description="Dán link video đang phát LIVE để nhận chat và sự kiện ủng hộ từ người thật"
        placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
        value={values.YOUTUBE}
        status={connections.YOUTUBE}
        busy={busyPlatform === 'YOUTUBE'}
        error={platformErrors.YOUTUBE}
        colorClasses="bg-red-500/10 text-red-300"
        note="Cần YOUTUBE_API_KEY trên server. YouTube không cung cấp người chỉ vào xem, lượt like hoặc share theo từng tài khoản."
        onValueChanged={(value) => setValue('YOUTUBE', value)}
        onConnect={() => void connect('YOUTUBE')}
        onDisconnect={() => void disconnect('YOUTUBE')}
      />
      <PlatformConnectionCard
        platform="FACEBOOK"
        title="Kết nối Facebook LIVE"
        description="Dán link LIVE của Page để nhận bình luận thật qua Facebook Graph API"
        placeholder="https://www.facebook.com/ten-page/videos/123456789..."
        value={values.FACEBOOK}
        status={connections.FACEBOOK}
        busy={busyPlatform === 'FACEBOOK'}
        error={platformErrors.FACEBOOK}
        colorClasses="bg-blue-500/10 text-blue-300"
        note="Cần FACEBOOK_PAGE_ACCESS_TOKEN có quyền đọc LIVE của Page. Không tạo dữ liệu giả khi API không trả tương tác."
        onValueChanged={(value) => setValue('FACEBOOK', value)}
        onConnect={() => void connect('FACEBOOK')}
        onDisconnect={() => void disconnect('FACEBOOK')}
      />
    </div>
  );
}
