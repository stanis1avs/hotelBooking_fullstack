import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AsyncPipe, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { UsersActions } from '../../actions/users.actions';
import {
  selectUsers, selectUsersLimit, selectUsersLoading, selectUsersPageIndex,
  selectUsersRole, selectUsersSearchParams, selectUsersTotal,
} from '../../selectors/users.selectors';
import { selectAuthRole, selectAuthUser } from '../../selectors/auth.selectors';
import { EmptyState } from '../../shared/empty-state';
import { errorMessage } from '../../core/error-message';
import type { UserDto } from '../../core/api';
import type { CreateUserForm } from './create-user-dialog';
import type { EditUserForm } from './edit-user-dialog';

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
    AsyncPipe, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatChipsModule, MatDialogModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatSelectModule,
    MatTableModule, MatTooltipModule, EmptyState,
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
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
  readonly total$ = this.store.select(selectUsersTotal);
  readonly pageIndex$ = this.store.select(selectUsersPageIndex);
  readonly limit$ = this.store.select(selectUsersLimit);
  readonly roleFilter$ = this.store.select(selectUsersRole);
  readonly authRole$ = this.store.select(selectAuthRole);

  readonly isAdmin = signal(false);
  readonly columns = signal<string[]>([]);

  /** Себе роль менять нельзя: сервер откажет, поле в форме блокируем заранее. */
  readonly currentUserId = toSignal(this.store.select(selectAuthUser).pipe(map((u) => u?.id ?? null)), {
    initialValue: null,
  });

  /** На узком экране таблица из пяти колонок уходила в горизонтальный
      скролл, и роль с телефоном становились недоступны — там показываем
      карточки, где видны все поля сразу. */
  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

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
      // Менеджеру список доступен только на просмотр, колонка действий ему не нужна.
      this.columns.set(admin ? ['name', 'email', 'phone', 'role', 'actions'] : ['name', 'email', 'phone', 'role', 'id']);
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
      .pipe(ofType(UsersActions.adminUpdateUserSuccess), takeUntilDestroyed())
      .subscribe(({ payload }) => this.snackBar.open(`Изменения сохранены: ${payload.name}`, 'OK', { duration: 4000 }));

    this.actions$
      .pipe(ofType(UsersActions.adminCreateUserFailure, UsersActions.adminLoadUsersFailure), takeUntilDestroyed())
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить пользователей'), 'Понятно', { duration: 6000 })
      );

    // Отказ сервера показываем дословно: «нельзя изменить собственную роль»
    // объясняет отказ лучше общей фразы про неудачу.
    this.actions$
      .pipe(ofType(UsersActions.adminUpdateUserFailure), takeUntilDestroyed())
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось сохранить изменения'), 'Понятно', { duration: 6000 })
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

  onPage(event: PageEvent): void {
    this.store.dispatch(UsersActions.setPage({ pageIndex: event.pageIndex, pageSize: event.pageSize }));
  }

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

  openEdit(user: UserDto): void {
    const isSelf = user.id === this.currentUserId();

    const role = new FormControl(user.role ?? 'client', {
      nonNullable: true,
      validators: [Validators.required],
    });
    if (isSelf) role.disable();

    const form: EditUserForm = new FormGroup({
      name: new FormControl(user.name, {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      contactPhone: new FormControl(user.contactPhone ?? '', {
        nonNullable: true,
        validators: [Validators.pattern(/^[\d\s()+-]{5,20}$/)],
      }),
      role,
    });

    import('./edit-user-dialog').then(({ EditUserDialog }) => {
      this.dialog
        .open(EditUserDialog, { data: { form, email: user.email, isSelf }, width: '560px' })
        .afterClosed()
        .subscribe((confirmed) => {
          if (!confirmed || form.invalid) return;

          // Отправляем только изменённое: сервер пишет смену роли в журнал
          // как изменение прав, и повтор прежнего значения засорял бы его.
          const next = form.getRawValue();
          const payload: { name?: string; contactPhone?: string; role?: string } = {};
          if (next.name !== user.name) payload.name = next.name;
          if (next.contactPhone !== (user.contactPhone ?? '')) payload.contactPhone = next.contactPhone;
          if (!isSelf && next.role !== (user.role ?? 'client')) payload.role = next.role;
          if (!Object.keys(payload).length) return;

          this.store.dispatch(UsersActions.adminUpdateUser({ id: user.id, payload }));
        });
    });
  }
}
