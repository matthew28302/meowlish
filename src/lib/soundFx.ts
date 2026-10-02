// Sound effects generated via Web Audio API (No external MP3 files needed)

declare global {
  interface Window {
    __MEOWLISH_AUDIO_CTX__?: AudioContext;
  }
}

class SoundFX {
  private userInteracted = false;
  private interactionListenersAttached = false;

  constructor() {
    this.setupInteractionUnlock();
  }

  private setupInteractionUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.userInteracted = true;
      const ctx = window.__MEOWLISH_AUDIO_CTX__;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      removeListeners();
    };

    const removeListeners = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
      this.interactionListenersAttached = false;
    };

    if (!this.interactionListenersAttached) {
      window.addEventListener('pointerdown', unlock, { passive: true, once: true });
      window.addEventListener('touchstart', unlock, { passive: true, once: true });
      window.addEventListener('keydown', unlock, { passive: true, once: true });
      this.interactionListenersAttached = true;
    }

    // Auto-suspend when document is hidden to save mobile CPU/battery
    document.addEventListener('visibilitychange', () => {
      const ctx = window.__MEOWLISH_AUDIO_CTX__;
      if (!ctx) return;
      if (document.hidden) {
        if (ctx.state === 'running') {
          ctx.suspend().catch(() => {});
        }
      } else if (this.userInteracted && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      // Re-use global singleton across hot reloads / renders
      let ctx = window.__MEOWLISH_AUDIO_CTX__ || null;

      if (!ctx || ctx.state === 'closed') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          ctx = new AudioCtx();
          window.__MEOWLISH_AUDIO_CTX__ = ctx;
        }
      }

      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      return ctx;
    } catch {
      return null;
    }
  }

  // Tiếng Ding thành công (hợp âm C5 - E5 - G5)
  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.18, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.4);
      });
    } catch {
      // Ignore audio failure gracefully on restricted mobile browsers
    }
  }

  // Tiếng cảnh báo nhẹ nhàng khi trả lời chưa chuẩn
  playError() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Alias for error
  playWrong() {
    this.playError();
  }

  // Tiếng Fanfare ăn mừng hoàn thành bài học
  playCelebration() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const fanfare = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.5, d: 0.35 }, // C6
      ];

      let t = now;
      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {}
        };

        osc.start(t);
        osc.stop(t + n.d + 0.05);
        t += n.d * 0.85;
      });
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Tiếng bấm nút đồ chơi / bàn phím vui tai
  playClick() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Tiếng lật thẻ Flashcard (swoosh)
  playFlip() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Tiếng bùng cháy ngọn lửa Streak
  playFlame() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Tiếng phi tiêu / vút gió (Whoosh / Throwing Shuriken)
  playWhoosh() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.22);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Tiếng phi tiêu cắm phập vào bia gỗ (Thud / Target Hit)
  playHit() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore audio failure gracefully
    }
  }

  // Tiếng bóng nảy / pop vui nhộn
  playPop() {
    try {
      const ctx = this.getContext();
      if (!ctx || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Ignore audio failure gracefully
    }
  }
}

export const sound = new SoundFX();
