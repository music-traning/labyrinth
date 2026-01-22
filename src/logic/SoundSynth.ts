// src/logic/SoundSynth.ts
export class SoundSynth {
  ctx: AudioContext;
  constructor() { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
  resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }
  
  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1) {
    this.resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + duration);
  }

  playSelect() { this.playTone(440, 'square', 0.05, 0.05); }
  playCancel() { this.playTone(150, 'sawtooth', 0.1, 0.1); }
  playType() { this.playTone(800, 'square', 0.03, 0.05); }
  playHit() { this.playTone(100, 'sawtooth', 0.1, 0.2); }
  playCoin() { this.playTone(1200, 'sine', 0.1, 0.1); this.playTone(1600, 'square', 0.2, 0.05); }
  playEquip() { this.playTone(400, 'triangle', 0.1, 0.2); this.playTone(600, 'triangle', 0.2, 0.2); }
  playPowerUp() { this.playTone(220, 'square', 0.1, 0.2); this.playTone(440, 'square', 0.1, 0.2); this.playTone(880, 'square', 0.4, 0.2); }
  playBadEnd() { this.playTone(55, 'sawtooth', 0.8, 0.5); this.playTone(50, 'sawtooth', 1.0, 0.5); }
  playKnock() { this.playTone(100, 'square', 0.1, 0.5); setTimeout(()=>this.playTone(100, 'square', 0.1, 0.5), 200); }
}
export const synth = new SoundSynth();