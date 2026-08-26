import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ProgressService } from './core/services/progress.service';
import { LoginComponent } from './features/login/login.component';

@Component({
  imports: [CommonModule, RouterOutlet, LoginComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  auth = inject(AuthService);
  private progress = inject(ProgressService);

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        void this.progress.syncWithRemote(user.uid, { email: user.email, displayName: user.displayName });
      } else {
        this.progress.detachFromRemote();
      }
    });
  }
}
