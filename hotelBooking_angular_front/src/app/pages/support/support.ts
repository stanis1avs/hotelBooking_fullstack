import {
  AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { SupportActions } from '../../actions/support.actions';
import {
  selectMessagesLoading, selectSelectedRequest, selectSupportItems,
  selectSupportLoading, selectSupportMessages,
} from '../../selectors/support.selectors';
import { SupportMessageDto, SupportRequestDto } from '../../core/api';
import { selectAuthUser } from '../../selectors/auth.selectors';
import { EmptyState } from '../../shared/empty-state';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

/**
 * Страница поддержки.
 *
 * Раньше здесь лежало собственное состояние в полях компонента и ручные
 * `detectChanges`, при том что слайс NgRx для поддержки существовал и не
 * использовался никем. Хуже того, копия выбранного обращения жила отдельно
 * от списка и расходилась с ним: закрытое обращение оставалось раскрытым
 * в правой панели. Теперь источник один — стор.
 */
@Component({
  selector: 'app-support',
  imports: [
    DatePipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatProgressBarModule, MatFormFieldModule,
    MatInputModule, MatDividerModule, MatIconModule, MatTooltipModule, EmptyState,
  ],
  templateUrl: './support.html',
  styleUrl: './support.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Support implements AfterViewChecked {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  @ViewChild('thread') threadRef?: ElementRef<HTMLElement>;

  readonly requests = toSignal(this.store.select(selectSupportItems), { initialValue: [] });
  readonly requestsLoading = toSignal(this.store.select(selectSupportLoading), { initialValue: false });
  readonly selectedRequest = toSignal(this.store.select(selectSelectedRequest), { initialValue: null });
  readonly messages = toSignal(this.store.select(selectSupportMessages), { initialValue: [] });
  readonly messagesLoading = toSignal(this.store.select(selectMessagesLoading), { initialValue: false });

  private readonly user = toSignal(this.store.select(selectAuthUser), { initialValue: null });
  readonly isManager = computed(() => this.user()?.role === 'manager');

  private scrollPending = signal(false);

  readonly newRequestControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  readonly newMessageControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  constructor() {
    this.store.dispatch(SupportActions.loadSupportRequests());

    // Переписка доросла снизу — прокручиваем к последнему сообщению
    this.store
      .select(selectSupportMessages)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.scrollPending.set(true));

    this.actions$
      .pipe(ofType(SupportActions.createSupportRequestSuccess), takeUntilDestroyed())
      .subscribe(() => {
        this.newRequestControl.reset();
        this.snackBar.open('Обращение создано', 'OK', { duration: 4000 });
      });

    this.actions$
      .pipe(ofType(SupportActions.closeSupportRequestSuccess), takeUntilDestroyed())
      .subscribe(() => this.snackBar.open('Обращение закрыто', 'OK', { duration: 4000 }));

    // Текст возвращается в поле, чтобы написанное не пропало вместе с ошибкой
    this.actions$
      .pipe(ofType(SupportActions.sendMessageFailure), takeUntilDestroyed())
      .subscribe(({ error, text }) => {
        this.newMessageControl.setValue(text);
        this.snackBar.open(errorMessage(error, 'Сообщение не отправлено'), 'Понятно', { duration: 5000 });
      });

    this.actions$
      .pipe(
        ofType(
          SupportActions.loadSupportRequestsFailure,
          SupportActions.loadMessagesFailure,
          SupportActions.createSupportRequestFailure,
          SupportActions.closeSupportRequestFailure,
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ error }) =>
        this.snackBar.open(errorMessage(error, 'Не удалось выполнить действие'), 'Понятно', { duration: 5000 })
      );
  }

  ngAfterViewChecked(): void {
    if (this.scrollPending() && this.threadRef) {
      this.threadRef.nativeElement.scrollTop = this.threadRef.nativeElement.scrollHeight;
      this.scrollPending.set(false);
    }
  }

  /** Своё сообщение или ответ поддержки — раньше все выглядели одинаково. */
  isMine(message: SupportMessageDto): boolean {
    return String(message.author) === String(this.user()?.id);
  }

  /** Кнопка «Обновить» в шапке списка. */
  loadRequests(): void {
    this.store.dispatch(SupportActions.loadSupportRequests());
  }

  openRequest(request: SupportRequestDto): void {
    this.store.dispatch(SupportActions.selectRequest({ id: request.id }));
  }

  closeRequest(request: SupportRequestDto, event: Event): void {
    event.stopPropagation();
    confirmAction(this.dialog, {
      title: 'Закрыть обращение?',
      message: 'Гость больше не сможет писать в эту переписку, но сможет создать новое обращение.',
      confirmLabel: 'Закрыть обращение',
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.dispatch(SupportActions.closeSupportRequest({ id: request.id }));
    });
  }

  createRequest(): void {
    if (this.newRequestControl.invalid) {
      this.newRequestControl.markAsTouched();
      return;
    }
    this.store.dispatch(SupportActions.createSupportRequest({ text: this.newRequestControl.value }));
  }

  sendMessage(): void {
    const request = this.selectedRequest();
    if (this.newMessageControl.invalid || !request) return;
    const text = this.newMessageControl.value;
    this.newMessageControl.reset();
    this.store.dispatch(SupportActions.sendMessage({ requestId: request.id, text }));
  }
}
