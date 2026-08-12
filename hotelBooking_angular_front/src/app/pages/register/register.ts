import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthActions } from '../../actions/auth.actions';
import { selectAuthLoading } from '../../selectors/auth.selectors';

/** Пароли должны совпадать — раньше подтверждения пароля не было вовсе. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return !confirm || password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [
    AsyncPipe, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './register.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  private readonly store = inject(Store);

  readonly loading$ = this.store.select(selectAuthLoading);
  readonly hidePassword = signal(true);

  readonly form = new FormGroup(
    {
      email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      contactPhone: new FormControl<string>('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/^[\d\s()+-]{5,20}$/)],
      }),
    },
    { validators: passwordsMatch }
  );

  togglePassword(): void {
    this.hidePassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Переход на /login выполняет эффект по ответу сервера.
    // Раньше редирект шёл сразу после dispatch, поэтому ошибку регистрации
    // (например, занятый адрес) пользователь не видел.
    const { confirmPassword, ...payload } = this.form.getRawValue();
    this.store.dispatch(AuthActions.register({ payload }));
  }
}
