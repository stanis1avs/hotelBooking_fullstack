import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
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
import { take } from 'rxjs';

import { ApolloService } from '../../graphql/apollo.service';
import { SupportMessageDto, SupportRequestDto } from '../../core/api';
import { selectAuthUser } from '../../selectors/auth.selectors';
import { EmptyState } from '../../shared/empty-state';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

@Component({
  selector: 'app-support',
  imports: [
    DatePipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatProgressBarModule, MatFormFieldModule,
    MatInputModule, MatDividerModule, MatIconModule, MatTooltipModule, EmptyState,
  ],
  templateUrl: './support.html',
  styleUrl: './support.scss',
})
export class Support implements OnInit, AfterViewChecked {
  private readonly store = inject(Store);
  private readonly apollo = inject(ApolloService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('thread') threadRef?: ElementRef<HTMLElement>;

  requests: SupportRequestDto[] = [];
  requestsLoading = false;

  selectedRequest: SupportRequestDto | null = null;
  messages: SupportMessageDto[] = [];
  messagesLoading = false;

  userRole: string | null = null;
  userId: string | null = null;

  private scrollPending = false;

  readonly newRequestControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });
  readonly newMessageControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(1)],
  });

  ngOnInit(): void {
    this.store
      .select(selectAuthUser)
      .pipe(take(1))
      .subscribe((user) => {
        this.userRole = user?.role ?? null;
        this.userId = user?.id ?? null;
        this.loadRequests();
      });
  }

  ngAfterViewChecked(): void {
    if (this.scrollPending && this.threadRef) {
      this.threadRef.nativeElement.scrollTop = this.threadRef.nativeElement.scrollHeight;
      this.scrollPending = false;
    }
  }

  get isManager(): boolean {
    return this.userRole === 'manager';
  }

  /** Своё сообщение или ответ поддержки — раньше все выглядели одинаково. */
  isMine(message: SupportMessageDto): boolean {
    return String(message.author) === String(this.userId);
  }

  loadRequests(): void {
    this.requestsLoading = true;
    // Через ApolloService: REST-методы, которые здесь вызывались раньше,
    // били в несуществующие эндпоинты и возвращали 404.
    const call$ = this.isManager
      ? this.apollo.getManagerSupportRequests()
      : this.apollo.getClientSupportRequests();

    call$.subscribe({
      next: (items) => {
        this.requests = items;
        this.requestsLoading = false;
        if (this.selectedRequest) {
          this.selectedRequest = items.find((r) => r.id === this.selectedRequest?.id) ?? null;
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.requestsLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить обращения'), 'Понятно', { duration: 5000 });
      },
    });
  }

  openRequest(request: SupportRequestDto): void {
    this.selectedRequest = request;
    this.messages = [];
    this.messagesLoading = true;
    this.apollo.getSupportMessages(request.id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.messagesLoading = false;
        this.scrollPending = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.messagesLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить переписку'), 'Понятно', { duration: 5000 });
      },
    });
  }

  closeRequest(request: SupportRequestDto, event: Event): void {
    event.stopPropagation();
    confirmAction(this.dialog, {
      title: 'Закрыть обращение?',
      message: 'Гость больше не сможет писать в эту переписку, но сможет создать новое обращение.',
      confirmLabel: 'Закрыть обращение',
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.apollo.closeSupportRequest(request.id).subscribe({
        next: () => {
          this.snackBar.open('Обращение закрыто', 'OK', { duration: 4000 });
          this.loadRequests();
        },
        error: (error) =>
          this.snackBar.open(errorMessage(error, 'Не удалось закрыть обращение'), 'Понятно', { duration: 5000 }),
      });
    });
  }

  createRequest(): void {
    if (this.newRequestControl.invalid) {
      this.newRequestControl.markAsTouched();
      return;
    }
    this.apollo.createSupportRequest(this.newRequestControl.value).subscribe({
      next: (item) => {
        this.snackBar.open('Обращение создано', 'OK', { duration: 4000 });
        this.newRequestControl.reset();
        this.loadRequests();
        this.openRequest(item);
      },
      error: (error) =>
        this.snackBar.open(errorMessage(error, 'Не удалось создать обращение'), 'Понятно', { duration: 5000 }),
    });
  }

  sendMessage(): void {
    if (this.newMessageControl.invalid || !this.selectedRequest) return;
    const text = this.newMessageControl.value;
    const requestId = this.selectedRequest.id;
    this.newMessageControl.reset();

    this.apollo.sendSupportMessage(requestId, text).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.scrollPending = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        // Возвращаем текст в поле, чтобы не потерять написанное
        this.newMessageControl.setValue(text);
        this.snackBar.open(errorMessage(error, 'Сообщение не отправлено'), 'Понятно', { duration: 5000 });
      },
    });
  }
}
