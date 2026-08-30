import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth.service';
import { ErrorLogService } from '../../core/services/error-log.service';
import { ErrorLogEntry, ErrorType } from '../../models/error-log.model';

const TYPE_LABELS: Record<ErrorType, string> = {
  NAO_SABIA: '❌ Não sabia',
  LEU_ERRADO: '👁️ Li errado',
  PEGADINHA: '🪤 Pegadinha',
  CHUTE_CERTO: '🎲 Acertei no chute',
};

@Component({
  selector: 'app-mapa-de-erros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mapa-de-erros.component.html',
  styleUrl: './mapa-de-erros.component.scss',
})
export class MapaDeErrosComponent {
  private auth = inject(AuthService);
  private errorLog = inject(ErrorLogService);

  private uid = this.auth.currentUser()!.uid;

  typeLabel = (t: ErrorType) => TYPE_LABELS[t];

  entries = toSignal(this.errorLog.getEntries(this.uid), { initialValue: [] as ErrorLogEntry[] });
}
