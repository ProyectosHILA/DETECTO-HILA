class AudioAlertManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  public toggleSound(enabled?: boolean): boolean {
    if (enabled !== undefined) {
      this.soundEnabled = enabled;
    } else {
      this.soundEnabled = !this.soundEnabled;
    }
    return this.soundEnabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public playBeep(frequency = 880, durationMs = 200) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn("Audio playback not allowed without interaction", e);
    }
  }

  public playUrgentAlert() {
    this.playBeep(987, 150);
    setTimeout(() => this.playBeep(1318, 250), 180);
  }

  /**
   * Ringtone oficial de llegada a Fase 3 (Equipo DETECTO)
   * Melodía de chime hospitalario de alta prioridad
   */
  public playRingtoneFase3() {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      // Melodic hospital pager chime sequence
      const notes = [
        { freq: 587.33, delay: 0, duration: 180 },     // D5
        { freq: 739.99, delay: 180, duration: 180 },   // F#5
        { freq: 880.00, delay: 360, duration: 220 },   // A5
        { freq: 1174.66, delay: 580, duration: 380 },  // D6 (high accent)
        
        // Second melodic echo
        { freq: 880.00, delay: 1050, duration: 180 },  // A5
        { freq: 1174.66, delay: 1250, duration: 220 }, // D6
        { freq: 1479.98, delay: 1480, duration: 420 }, // F#6
      ];

      notes.forEach(({ freq, delay, duration }) => {
        setTimeout(() => {
          if (!this.audioCtx) return;
          try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

            gain.gain.setValueAtTime(0.22, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration / 1000);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration / 1000);
          } catch (err) {
            // ignore note error
          }
        }, delay);
      });
    } catch (e) {
      console.warn("Audio playback not allowed without user gesture", e);
    }
  }

  private loopAudio: HTMLAudioElement | null = null;
  private isLooping: boolean = false;
  private loopIntervalId: any = null;

  /**
   * Sonido oficial constante de alerta al registrar paciente desde Triage (Google Drive MP3)
   * Suena en bucle constante mientras haya pacientes pendientes de atención en Urgencias.
   */
  public startLoopSonidoTriage() {
    if (!this.soundEnabled) return;
    this.isLooping = true;

    try {
      if (!this.loopAudio) {
        this.loopAudio = new Audio("/assets/alerta_urgencias.mp3");
        this.loopAudio.loop = true;
        this.loopAudio.volume = 0.85;
      }

      if (this.loopAudio.paused) {
        const playPromise = this.loopAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn("Autoplay bloqueado por el navegador hasta interacción del usuario:", err);
            // Fallback sintético periódico si el audio HTML5 es bloqueado por políticas del navegador
            if (!this.loopIntervalId) {
              this.playUrgentAlert();
              this.loopIntervalId = setInterval(() => {
                if (this.isLooping && this.soundEnabled) {
                  this.playUrgentAlert();
                } else if (this.loopIntervalId) {
                  clearInterval(this.loopIntervalId);
                  this.loopIntervalId = null;
                }
              }, 4000);
            }
          });
        }
      }
    } catch (e) {
      console.warn("Error iniciando sonido en bucle:", e);
    }
  }

  public stopLoopSonidoTriage() {
    this.isLooping = false;
    if (this.loopIntervalId) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    if (this.loopAudio) {
      try {
        this.loopAudio.pause();
        this.loopAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
    }
  }

  public isLoopSonidoActivo(): boolean {
    return this.isLooping;
  }
}

export const audioAlert = new AudioAlertManager();
