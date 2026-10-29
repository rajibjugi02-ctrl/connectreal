/**
 * RingtonePlayer
 * Memutar nada dering telepon digital berkualitas tinggi menggunakan Web Audio API
 * tanpa memerlukan file MP3 eksternal sehingga dijamin berbunyi di semua peramban (iOS/Android/Laptop).
 */
class RingtonePlayer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying = false;

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      const AudioCtx =
        typeof window !== "undefined"
          ? window.AudioContext || (window as any).webkitAudioContext
          : null;

      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      const playRingBurst = () => {
        if (!this.ctx || !this.isPlaying) return;

        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }

        const now = this.ctx.currentTime;
        // Frekuensi standar nada dering telepon internasional: 440 Hz & 480 Hz
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now);

        // Pola dering nada telepon: berbunyi 1.6 detik, jeda 2.4 detik
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gainNode.gain.setValueAtTime(0.2, now + 1.55);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.6);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.6);
        osc2.stop(now + 1.6);
      };

      playRingBurst();
      this.intervalId = setInterval(playRingBurst, 3800);
    } catch (e) {
      console.warn("Ringtone audio context error:", e);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

export const ringtonePlayer = new RingtonePlayer();

