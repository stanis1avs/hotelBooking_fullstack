import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type CreateUserForm = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  contactPhone: FormControl<string>;
  password: FormControl<string>;
  role: FormControl<string>;
}>;

@Component({
  selector: 'app-create-user-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Новый пользователь</h2>
    <mat-dialog-content>
      <p class="text-sm mb-4 muted">Пароль придёт на указанную почту вместе со ссылкой для входа.</p>

      <form [formGroup]="form" class="grid gap-4" style="grid-template-columns: repeat(2, minmax(0,1fr))">
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
          @if (form.controls.contactPhone.hasError('required')) {
            <mat-error>Укажите телефон</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" style="grid-column: 1 / -1">
          <mat-label>Электронная почта</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Укажите почту</mat-error>
          } @else if (form.controls.email.hasError('email')) {
            <mat-error>Проверьте формат адреса</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Временный пароль</mat-label>
          <input matInput [type]="hide ? 'password' : 'text'" formControlName="password" autocomplete="new-password" />
          <button mat-icon-button matSuffix type="button" (click)="hide = !hide"
                  [attr.aria-label]="hide ? 'Показать пароль' : 'Скрыть пароль'">
            <mat-icon>{{ hide ? 'visibility' : 'visibility_off' }}</mat-icon>
          </button>
          @if (form.controls.password.hasError('required')) {
            <mat-error>Задайте пароль</mat-error>
          } @else if (form.controls.password.hasError('minlength')) {
            <mat-error>Минимум 8 символов</mat-error>
          } @else {
            <mat-hint>Минимум 8 символов</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Роль</mat-label>
          <mat-select formControlName="role">
            <mat-option value="client">Клиент</mat-option>
            <mat-option value="manager">Менеджер</mat-option>
            <mat-option value="admin">Администратор</mat-option>
          </mat-select>
          <mat-hint>Права можно изменить позже</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Отмена</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="ref.close(true)">Создать</button>
    </mat-dialog-actions>
  `,
})
export class CreateUserDialog {
  readonly ref = inject(MatDialogRef<CreateUserDialog, boolean>);
  readonly form: CreateUserForm = inject<{ form: CreateUserForm }>(MAT_DIALOG_DATA).form;
  hide = true;
}
