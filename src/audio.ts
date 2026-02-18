import { BGM_TRACKS, SFX } from './assets'

class AudioManager {
  private bgm: HTMLAudioElement | null = null
  private currentTrack = ''
  private _muted: boolean
  private unlocked = false

  constructor() {
    this._muted = localStorage.getItem('muted') === 'true'
  }

  get muted(): boolean {
    return this._muted
  }

  toggleMute(): boolean {
    this._muted = !this._muted
    localStorage.setItem('muted', String(this._muted))
    if (this.bgm) {
      this.bgm.muted = this._muted
    }
    return this._muted
  }

  /**
   * Must be called from a user gesture (click) to unlock audio on mobile browsers.
   */
  unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    // Resume AudioContext if needed
    if (this.bgm && this.bgm.paused && !this._muted) {
      this.bgm.play().catch(() => {})
    }
  }

  playBGM(track: string): void {
    const src = BGM_TRACKS[track]
    if (!src || this.currentTrack === track) return

    this.currentTrack = track

    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }

    this.bgm = new Audio(src)
    this.bgm.loop = !['victory', 'gameover'].includes(track)
    this.bgm.volume = 0.4
    this.bgm.muted = this._muted

    if (this.unlocked) {
      this.bgm.play().catch(() => {
        // Audio file missing or browser blocked — silent fail
      })
    }
  }

  stopBGM(): void {
    if (this.bgm) {
      this.bgm.pause()
      this.bgm.currentTime = 0
    }
    this.currentTrack = ''
  }

  playSFX(name: string): void {
    if (this._muted) return
    const src = SFX[name]
    if (!src) return

    try {
      const audio = new Audio(src)
      audio.volume = 0.5
      audio.play().catch(() => {
        // Audio file missing — silent fail
      })
    } catch {
      // Silent fail
    }
  }
}

export const audio = new AudioManager()
