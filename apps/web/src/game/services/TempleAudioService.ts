class TempleAudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = true;
  private volume: number = 0.7;
  private bgmAudio: HTMLAudioElement | null = null;
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
    // Tần số cơ bản của đại hồng chung (Khoảng nốt C3 / F2 trầm)
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

      // Tremolo chấn động kim loại nhẹ
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
   * Nhạc nền chánh điện (BGM):
   * Tự động ưu tiên phát file /audio/bgm.mp3 nếu bạn bỏ file vào,
   * hoặc phát nhạc thiền Ambient Singing Bowl tự sinh êm dịu nếu chưa có file MP3.
   */
  public startBgm(): void {
    if (this.isMuted) return;
    this.initContext();

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/audio/bgm.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.volume * 0.6;
    }

    this.bgmAudio
      .play()
      .then(() => {
        this.isBgmPlaying = true;
      })
      .catch(() => {
        // Nếu không có file /audio/bgm.mp3 hoặc chưa tải được,
        // phát tiếng chuông thiền vi vu Ambient Meditation Drone
        this.startAmbientDrone();
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

      gain.gain.setValueAtTime(0.02, ctx.currentTime);

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

