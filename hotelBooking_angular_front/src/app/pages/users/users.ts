import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { UsersActions } from '../../actions/users.actions';
import {
  selectHasNextPage, selectHasPrevPage, selectPageNumber, selectUsers,
  selectUsersLimit, selectUsersLoading, selectUsersRole, selectUsersSearchParams,
} from '../../selectors/users.selectors';
import { selectAuthRole } from '../../selectors/auth.selectors';
import { EmptyState } from '../../shared/empty-state';
import { errorMessage } from '../../core/error-message';
import type { CreateUserForm } from './create-user-dialog';

export const ROLE_LABEL: Record<string, string> = {
  client: 'Клиент',
  manager: 'Менеджер',
  admin: 'Администратор',
};

/**
 * Единая страница для админа и менеджера.
 *
 * Заменяет admin-users и manager-users — два почти одинаковых компонента,
 * свёрстанных на классах Bootstrap, которого нет в зависимостях: сетка формы,
 * цветные плашки ролей, отступы у иконок и блок ошибки просто не работали.
 */
@Component({
  selector: 'app-users',
  imports: [
    AsyncPipe, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatDialogModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressBarModule, MatSelectModule, MatTableModule,
    MatTooltipModule, EmptyState,
  ],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly users$ = this.store.select(selectUsers);
  readonly loading$ = this.store.select(selectUsersLoading);
  readonly hasNext$ = this.store.select(selectHasNextPage);
  readonly hasPrev$ = this.store.select(selectHasPrevPage);
  readonly page$ = this.store.select(selectPageNumber);
  readonly limit$ = this.store.select(selectUsersLimit);
  readonly roleFilter$ = this.store.select(selectUsersRole);
  readonly authRole$ = this.store.select(selectAuthRole);

  readonly isAdmin = signal(false);
  readonly columns = signal<string[]>([]);

  readonly search = new FormControl<string>('', { nonNullable: true });

  readonly roleFilters = [
    { value: 'all', label: 'Все' },
    { value: 'client', label: 'Клиенты' },
    { value: 'manager', label: 'Менеджеры' },
    { value: 'admin', label: 'Администраторы' },
  ];

  readonly roleLabel = ROLE_LABEL;

  constructor() {
    this.authRole$.pipe(takeUntilDestroyed()).subscribe((role) => {
      const admin = role === 'admin';
      this.isAdmin.set(admin);
      this.columns.set(
        admin
          ? ['name', 'email', 'phone', 'role', 'id', 'actions']
          : ['name', 'email', 'phone', 'role', 'id']
      );
    });

    // Единственное место, откуда уходит запрос списка. Раньше подписка на те же
    // параметры создавалась в трёх методах, и каждая из них снова их меняла.
    this.store
      .select(selectUsersSearchParams)
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const action = this.isAdmin() ? UsersActions.adminLoadUsers : UsersActions.managerLoadUsers;
        this.store.dispatch(action({ payload: params }));
      });

    this.search.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => this.applySearch(value));

    this.actions$
      .pipe(ofType(UsersActions.adminCreateUserSuccess), takeUntilDestroyed())
      .subscribe(({ payload }) =>
        this.snackBar.open(`Пользователь ${payload.name} создан`, 'OK', { duration: 4000 })
      );

    this.actions$
      .pipe(ofType(UsersActions.adminCreateUserFailure, UsersActions.adminLoadUsersFailure), takeUntilDestroyed())
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить пользователей'), 'Понятно', { duration: 6000 })
      );
  }

  /**
   * Поиск идёт сразу по трём полям.
   * Прежняя эвристика относила запрос к телефону, если в строке был хотя бы один
   * пробел или цифра, — «Иван Петров» уходил в поиск по номеру и ничего не находил.
   */
  private applySearch(value: string): void {
    const q = value.trim();
    this.store.dispatch(
      UsersActions.setSearchParams({
        payload: q
          ? { name: q, email: q, contactPhone: q }
          : { name: '', email: '', contactPhone: '' },
      })
    );
  }

  setRole(role: string): void {
    this.store.dispatch(UsersActions.setSearchParams({ payload: { role: role === 'all' ? undefined : role } }));
  }

  clear(): void {
    this.search.setValue('', { emitEvent: false });
    this.store.dispatch(UsersActions.clearSearchParams());
  }

  next(): void { this.store.dispatch(UsersActions.nextPage()); }
  prev(): void { this.store.dispatch(UsersActions.prevPage()); }
  setPageSize(limit: number): void { this.store.dispatch(UsersActions.setPageSize({ limit })); }

  openCreate(): void {
    const form: CreateUserForm = new FormGroup({
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      contactPhone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] }),
      role: new FormControl('client', { nonNullable: true, validators: [Validators.required] }),
    });

    import('./create-user-dialog').then(({ CreateUserDialog }) => {
      this.dialog
        .open(CreateUserDialog, { data: { form }, width: '560px' })
        .afterClosed()
        .subscribe((confirmed) => {
          if (!confirmed || form.invalid) return;
          // Уведомление об успехе показывается по ответу сервера, а не сразу
          // после отправки — раньше «успех» появлялся даже при ошибке.
          this.store.dispatch(UsersActions.adminCreateUser({ payload: form.getRawValue() }));
        });
    });
  }
}
