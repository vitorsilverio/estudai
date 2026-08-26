import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ProgressService } from './core/services/progress.service';
import { LoginComponent } from './features/login/login.component';
import { BottomNavComponent } from './shared/nav/bottom-nav.component';

const IMMERSIVE_ROUTE_PREFIXES = ['/trilha/', '/simulado/'];

@Component({
  imports: [CommonModule, RouterOutlet, LoginComponent, BottomNavComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  auth = inject(AuthService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  showBottomNav = signal(true);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        void this.progress.syncWithRemote(user.uid, { email: user.email, displayName: user.displayName });
      } else {
        this.progress.detachFromRemote();
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
