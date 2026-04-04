import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AuthActions } from '../../actions/auth.actions';
import { selectAuthLoading, selectAuthUser } from '../../selectors/auth.selectors';
import { Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html'
})
export class Login {
  readonly loading$;

  readonly form = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly store: Store, private readonly router: Router) {
    this.loading$ = this.store.select(selectAuthLoading);

    this.store
      .select(selectAuthUser)
      .pipe(filter((u) => !!u))
      .subscribe(() => this.router.navigateByUrl('/hotels'));
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      email: this.form.controls.email.value,
      password: this.form.controls.password.value,
    };
    this.store.dispatch(AuthActions.login({ payload }));
  }
}
