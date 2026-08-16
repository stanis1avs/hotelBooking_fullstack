import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type EditUserForm = FormGroup<{
  name: FormControl<string>;
  contactPhone: FormControl<string>;
  role: FormControl<string>;
}>;

export interface EditUserData {
  form: EditUserForm;
  email: string;
  /** Собственную роль менять нельзя — сервер откажет, поле блокируем заранее. */
  isSelf: boolean;
}

/**
 * Почты и пароля здесь нет намеренно: почта — идентификатор входа и меняется
 * с подтверждением адреса, пароль — отдельной операцией, чтобы случайное
 * сохранение формы его не сбрасывало. Тот же набор полей принимает сервер.
 */
@Component({
  selector: 'app-edit-user-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Изменение учётной записи</h2>
    <mat-dialog-content>
      <p class="text-sm mb-4 muted">{{ data.email }}</p>

      <form [formGroup]="form" class="edit-grid">
        <mat-form-field appearance="outline">
          <mat-label>Имя и фамилия</mat-label>
          <input matInput formControlName="name" autocomplete="name" />
          @if (form.controls.name.hasError('required')) {
            <mat-error>Укажите имя</mat-error>
          } @else if (form.controls.name.hasError('minlength')) {
            <mat-error>Не короче двух символов</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Телефон</mat-label>
          <input matInput formControlName="contactPhone" autocomplete="tel" placeholder="+7 900 000-00-00" />
          @if (form.controls.contactPhone.hasError('pattern')) {
            <mat-error>Только цифры, пробелы и знаки + - ( )</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="edit-wide">
          <mat-label>Роль</mat-label>
          <mat-select formControlName="role">
            <mat-option value="client">Клиент</mat-option>
            <mat-option value="manager">Менеджер</mat-option>
            <mat-option value="admin">Администратор</mat-option>
          </mat-select>
          @if (data.isSelf) {
            <mat-hint>Свою роль изменить нельзя — иначе можно потерять доступ к управлению</mat-hint>
          } @else {
            <mat-hint>Смена роли меняет набор доступных разделов при следующем входе</mat-hint>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Отмена</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || form.pristine" (click)="ref.close(true)">
        Сохранить
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .edit-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }
    .edit-wide {
      grid-column: 1 / -1;
    }
    @media (max-width: 599px) {
      .edit-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EditUserDialog {
  readonly ref = inject(MatDialogRef<EditUserDialog, boolean>);
  readonly data = inject<EditUserData>(MAT_DIALOG_DATA);
  readonly form = this.data.form;
}
