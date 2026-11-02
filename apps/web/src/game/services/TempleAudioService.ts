const DEFAULT_BGM_FILE_NAME = 'Nhạc Thiền - Nhạc Phật Remix - By Lê Bảo - Nhạc Hót Tik Tok 2023.mp3';
const DEFAULT_BGM_URL = `/audio/${encodeURIComponent(DEFAULT_BGM_FILE_NAME)}`;
const REMOVED_DEFAULT_BGM_URL = '/audio/bgm-thien-tinh-tam.wav';

class TempleAudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private volume: number = 0.7;
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgmUrl: string = DEFAULT_BGM_URL;
  private isBgmPlaying: boolean = false;
  private ambientOscillators: OscillatorNode[] = [];

  constructor() {
    // Đọc trạng thái đã lưu
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('temple_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      const savedVol = localStorage.getItem('temple_audio_volume');
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v)) this.volume = Math.max(0, Math.min(1, v));
      }
      const savedBgm = localStorage.getItem('temple_bgm_url');
      if (savedBgm && savedBgm !== REMOVED_DEFAULT_BGM_URL) {
        this.currentBgmUrl = savedBgm;
      } else if (savedBgm === REMOVED_DEFAULT_BGM_URL) {
        // Chuyển cấu hình mặc định cũ sang file đang tồn tại trong public/audio.
        localStorage.setItem('temple_bgm_url', DEFAULT_BGM_URL);
      }

      // Overlay và Admin chạy ở hai tab riêng. Storage event giúp overlay nhận ngay
      // bài hát, âm lượng và trạng thái mute vừa thay đổi từ tab Admin.
      window.addEventListener('storage', (event) => {
        if (event.key === 'temple_audio_muted' && event.newValue !== null) {
          this.setMuted(event.newValue === 'true');
          return;
        }

        if (event.key === 'temple_audio_volume' && event.newValue !== null) {
          const nextVolume = Number(event.newValue);
          if (Number.isFinite(nextVolume)) this.setVolume(nextVolume);
          return;
        }

        if (
          event.key === 'temple_bgm_url' &&
          event.newValue &&
          !event.newValue.startsWith('blob:')
        ) {
          this.setBgmTrack(event.newValue);
        }
      });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.6;
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.8;
        this.sfxGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentBgmUrl(): string {
    return this.currentBgmUrl;
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('temple_audio_muted', String(muted));
    const ctx = this.initContext();
    if (this.masterGain && ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, ctx.currentTime, 0.05);
    }
    if (!muted) {
      this.startBgm();
    } else {
      this.pauseBgm();
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('temple_audio_volume', String(this.volume));
    const ctx = this.initContext();
    if (this.masterGain && ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.05);
    }
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.volume * 0.6;
    }
  }

  public setBgmTrack(url: string): void {
    const previousBgmUrl = this.currentBgmUrl;

    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }
    this.stopAmbientDrone();

    // URL blob giữ dữ liệu file trong bộ nhớ. Khi đổi bài phải thu hồi URL cũ,
    // nhưng vẫn giữ URL hiện tại để nhạc tiếp tục phát khi rời trang cài đặt.
    if (previousBgmUrl !== url && previousBgmUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previousBgmUrl);
    }

    this.currentBgmUrl = url;
    localStorage.setItem('temple_bgm_url', url);

    if (!this.isMuted && this.isBgmPlaying) {
      this.startBgm();
    }
  }

  /**
   * Tiếng gõ Mõ gỗ (Wooden Fish) - Âm sắc mộc ấm cúng thanh tịnh
   */
  public playWoodenFish(pitchVariance = 0): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const baseFreq = 540 + pitchVariance * 25; // Tần số cộng hưởng của mõ gỗ

    // 1. Oscillator Sine chính (thân mõ)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.82, t + 0.12);

    // 2. Harmonic tạo chất gỗ mộc (Triangle)
    const harm = ctx.createOscillator();
    harm.type = 'triangle';
    harm.frequency.setValueAtTime(baseFreq * 1.95, t);
    harm.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.06);

    // 3. Bộ lọc băng thông giả lập buồng rỗng của mõ
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, t);
    filter.Q.setValueAtTime(5.5, t);

    // 4. Envelope biên độ (tiếng gõ chắc nịch, dứt khoát)
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.95, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    harm.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    harm.start(t);
    osc.stop(t + 0.15);
    harm.stop(t + 0.15);
  }

  /**
   * Tiếng Chuông Chùa Đại Hồng Chung (Temple Bell / Singing Bowl) - Ngân vang sâu lắng uy nghiêm
   */
  public playTempleBell(intensity = 1.0): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const rootFreq = 216;
    const harmonics = [
      { f: rootFreq, gain: 0.85, decay: 5.5 },
      { f: rootFreq * 2.02, gain: 0.55, decay: 4.2 },
      { f: rootFreq * 2.76, gain: 0.38, decay: 3.2 },
      { f: rootFreq * 4.15, gain: 0.22, decay: 2.2 },
      { f: rootFreq * 5.42, gain: 0.12, decay: 1.5 },
    ];

    harmonics.forEach((h) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(h.f, t);
      osc.frequency.linearRampToValueAtTime(h.f * 0.996, t + h.decay);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(h.gain * intensity, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + h.decay);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + h.decay);
    });
  }

  /**
   * Tiếng Khánh Đồng Dâng Hoa (Chime) - Trong trẻo ngân nga
   */
  public playBell(intensity = 1.0): void {
    this.playTempleBell(intensity);
  }

  public playMoktak(pitchVariance = 0): void {
    this.playWoodenFish(pitchVariance);
  }

  public playOfferingChime(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const frequencies = [880, 1320, 1760]; // Nốt A5, E6, A6

    frequencies.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + delay);

      gain.gain.setValueAtTime(0.001, t + delay);
      gain.gain.linearRampToValueAtTime(0.4, t + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 2.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + delay);
      osc.stop(t + delay + 2.8);
    });
  }

  /**
   * Nhạc nền chánh điện (BGM)
   */
  public startBgm(): void {
    if (this.isMuted) return;
    this.initContext();

    if (this.currentBgmUrl === 'synth') {
      this.startAmbientDrone();
      this.isBgmPlaying = true;
      return;
    }

    const expectedBgmUrl = new URL(this.currentBgmUrl, window.location.href).href;
    if (this.bgmAudio && this.bgmAudio.src !== expectedBgmUrl) {
      this.bgmAudio.pause();
      this.bgmAudio = null;
    }

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio(this.currentBgmUrl);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.volume * 0.6;
    }

    const playingAudio = this.bgmAudio;
    playingAudio
      .play()
      .then(() => {
        if (this.bgmAudio !== playingAudio) return;
        // File đã phát được thì tắt âm synth fallback để không nghe hai nguồn cùng lúc.
        this.stopAmbientDrone();
        this.isBgmPlaying = true;
      })
      .catch((err) => {
        if (this.bgmAudio !== playingAudio) return;
        // Fallback tự sinh âm thiền nếu không tải được file hoặc trình duyệt chặn
        console.warn('Không thể tự động phát file audio, dùng âm thiền tự sinh:', err);
        this.startAmbientDrone();
        this.isBgmPlaying = true;
      });
  }

  public pauseBgm(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    this.stopAmbientDrone();
    this.isBgmPlaying = false;
  }

  private startAmbientDrone(): void {
    if (this.ambientOscillators.length > 0 || this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx || !this.bgmGain) return;

    // Các nốt thiền ấm dịu: D3 (146.8Hz), A3 (220Hz), D4 (293.6Hz)
    const notes = [146.83, 220.0, 293.66];
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.025, ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.bgmGain!);

      osc.start();
      this.ambientOscillators.push(osc);
    });
  }

  private stopAmbientDrone(): void {
    this.ambientOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.ambientOscillators = [];
  }
}

export const templeAudio = new TempleAudioService();
