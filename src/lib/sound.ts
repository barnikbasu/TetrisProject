class SoundManager {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMove() {
    this.playTone(150, 'square', 0.05, 0.05);
  }

  playRotate() {
    this.playTone(300, 'sine', 0.1, 0.05);
  }

  playLock() {
    this.playTone(80, 'square', 0.2, 0.1);
  }

  playClear() {
    this.playTone(400, 'triangle', 0.1, 0.1);
    setTimeout(() => this.playTone(600, 'triangle', 0.1, 0.1), 50);
    setTimeout(() => this.playTone(800, 'triangle', 0.2, 0.1), 100);
  }

  playGameOver() {
    this.playTone(200, 'sawtooth', 0.5, 0.1);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.5, 0.1), 200);
    setTimeout(() => this.playTone(100, 'sawtooth', 1.0, 0.1), 400);
  }
}

export const sound = new SoundManager();
