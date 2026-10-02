// =========================================================
// Procedural Web Audio Sound Synthesizer for Dots & Boxes
// Zero external assets, polyphonic, responsive & crisp.
// =========================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('dots_sound_muted') === 'true';
    this.volume = 0.35;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('dots_sound_muted', this.muted);
    return !this.muted;
  }

  isMuted() {
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.3, pitchDecay = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchDecay > 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * pitchDecay), now + duration);
      }

      gain.gain.setValueAtTime(gainVal * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }

  playTick() {
    this.playTone(1400, 'sine', 0.03, 0.08);
  }

  playLine(player = 1) {
    const baseFreq = player === 1 ? 520 : 420;
    this.playTone(baseFreq, 'triangle', 0.08, 0.32, 0.4);
  }

  playBoxCapture(combo = 1) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const scales = [
      [523.25, 659.25],          // C5, E5
      [659.25, 783.99, 987.77],  // E5, G5, B5
      [783.99, 987.77, 1174.66], // G5, B5, D6
      [1046.50, 1318.51, 1567.98] // C6, E6, G6
    ];

    const chord = scales[Math.min(combo - 1, scales.length - 1)];
    const now = this.ctx.currentTime;

    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.28 * this.volume, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.36);
    });
  }

  playUndo() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);

      gain.gain.setValueAtTime(0.18 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playVictory() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const now = this.ctx.currentTime;

    fanfareNotes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);

      const dur = i === fanfareNotes.length - 1 ? 0.8 : 0.25;
      gain.gain.setValueAtTime(0.3 * this.volume, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + dur + 0.05);
    });
  }
}

window.soundEngine = new SoundEngine();
