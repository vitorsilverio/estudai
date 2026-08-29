import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ProfileService } from './core/services/profile.service';
import { ProgressService } from './core/services/progress.service';
import { LoginComponent } from './features/login/login.component';
import { ExamPickerComponent } from './features/exam-picker/exam-picker.component';
import { BottomNavComponent } from './shared/nav/bottom-nav.component';

const IMMERSIVE_ROUTE_PREFIXES = ['/trilha/', '/simulado/', '/flashcards/'];

@Component({
  imports: [CommonModule, RouterOutlet, LoginComponent, ExamPickerComponent, BottomNavComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  auth = inject(AuthService);
  profile = inject(ProfileService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  showBottomNav = signal(true);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        void this.profile.loadForUser(user.uid, { email: user.email, displayName: user.displayName });
      } else {
        this.profile.reset();
        this.progress.detachFromRemote();
      }
    });

    effect(() => {
      const user = this.auth.currentUser();
      const examId = this.profile.activeExamId();
      if (user && examId) {
        void this.progress.bindToUser(user.uid, examId, { email: user.email, displayName: user.displayName });
      }
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const isImmersive = IMMERSIVE_ROUTE_PREFIXES.some((prefix) => event.urlAfterRedirects.startsWith(prefix));
        this.showBottomNav.set(!isImmersive);
      }
    });
  }
}
