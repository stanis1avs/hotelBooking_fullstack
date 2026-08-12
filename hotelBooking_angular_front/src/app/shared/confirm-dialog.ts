import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';

export interface ConfirmData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/** Замена нативному confirm(): доступен с клавиатуры и выглядит как остальной интерфейс. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p class="text-sm" style="color: var(--mat-sys-on-surface-variant)">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">{{ data.cancelLabel ?? 'Отмена' }}</button>
      <button
        mat-flat-button
        [color]="data.destructive ? 'warn' : 'primary'"
        cdkFocusInitial
        (click)="ref.close(true)">
        {{ data.confirmLabel ?? 'Подтвердить' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  readonly ref = inject(MatDialogRef<ConfirmDialog, boolean>);
  readonly data = inject<ConfirmData>(MAT_DIALOG_DATA);
}

/** Хелпер, чтобы не тащить MatDialog и импорт компонента в каждую страницу. */
export function confirmAction(dialog: MatDialog, data: ConfirmData): Observable<boolean | undefined> {
  return dialog.open(ConfirmDialog, { data, width: '440px', autoFocus: 'dialog' }).afterClosed();
}
