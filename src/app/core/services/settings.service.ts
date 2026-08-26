import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'efs.settings.v1';
const SCALES = [0.9, 1, 1.15, 1.3];

interface Settings {
  fontScaleIndex: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly state = signal<Settings>(this.load());

  readonly fontScale = signal(SCALES[this.state().fontScaleIndex]);

  constructor() {
    this.applyFontScale();
  }

  private load(): Settings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { fontScaleIndex: 1 };
      return { fontScaleIndex: 1, ...JSON.parse(raw) };
    } catch {
      return { fontScaleIndex: 1 };
    }
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
  }

  private applyFontScale(): void {
    const scale = SCALES[this.state().fontScaleIndex];
    this.fontScale.set(scale);
    document.documentElement.style.setProperty('--font-scale', String(scale));
  }

  increaseFontSize(): void {
    const idx = Math.min(SCALES.length - 1, this.state().fontScaleIndex + 1);
    this.state.set({ ...this.state(), fontScaleIndex: idx });
    this.persist();
    this.applyFontScale();
  }

  decreaseFontSize(): void {
    const idx = Math.max(0, this.state().fontScaleIndex - 1);
    this.state.set({ ...this.state(), fontScaleIndex: idx });
    this.persist();
    this.applyFontScale();
  }
}
