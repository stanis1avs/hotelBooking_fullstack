import { Component, OnInit } from '@angular/core';
import { AsyncPipe, SlicePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api, SupportMessageDto, SupportRequestDto } from '../../core/api';
import { selectAuthUser } from '../../selectors/auth.selectors';
import { take } from 'rxjs';

@Component({
  selector: 'app-support',
  imports: [
    SlicePipe, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatDividerModule, MatIconModule,
  ],
  templateUrl: './support.html',
})
export class Support implements OnInit {
  readonly user$;

  requests: SupportRequestDto[] = [];
  requestsLoading = false;

  selectedRequest: SupportRequestDto | null = null;
  messages: SupportMessageDto[] = [];
  messagesLoading = false;

  userRole: string | null = null;

  readonly newRequestControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] });
  readonly newMessageControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  constructor(private readonly store: Store, private readonly api: Api, private readonly snackBar: MatSnackBar) {
    this.user$ = this.store.select(selectAuthUser);
  }

  ngOnInit() {
    this.store.select(selectAuthUser).pipe(take(1)).subscribe((user) => {
      this.userRole = user?.role ?? null;
      this.loadRequests();
    });
  }

  loadRequests() {
    this.requestsLoading = true;
    const call$ = this.userRole === 'manager'
      ? this.api.getManagerSupportRequests()
      : this.api.getClientSupportRequests();

    call$.subscribe({
      next: (items) => { this.requests = items; this.requestsLoading = false; },
      error: () => { this.requestsLoading = false; this.snackBar.open('Ошибка загрузки обращений', 'OK', { duration: 3000 }); },
    });
  }

  openRequest(req: SupportRequestDto) {
    this.selectedRequest = req;
    this.messages = [];
    this.messagesLoading = true;
    this.api.getSupportMessages(req.id).subscribe({
      next: (msgs) => { this.messages = msgs; this.messagesLoading = false; },
      error: () => { this.messagesLoading = false; this.snackBar.open('Ошибка загрузки сообщений', 'OK', { duration: 3000 }); },
    });
  }

  closeRequest(req: SupportRequestDto, event: Event) {
    event.stopPropagation();
    this.api.closeSupportRequest(req.id).subscribe({
      next: () => {
        this.snackBar.open('Обращение закрыто', 'OK', { duration: 3000 });
        if (this.selectedRequest?.id === req.id) {
          this.selectedRequest = null;
          this.messages = [];
        }
        this.loadRequests();
      },
      error: () => this.snackBar.open('Ошибка закрытия обращения', 'OK', { duration: 3000 }),
    });
  }

  createRequest() {
    if (this.newRequestControl.invalid) return;
    this.api.createSupportRequest(this.newRequestControl.value).subscribe({
      next: (item) => {
        this.snackBar.open('Обращение создано', 'OK', { duration: 3000 });
        this.newRequestControl.reset();
        this.loadRequests();
        this.openRequest(item);
      },
      error: () => this.snackBar.open('Ошибка создания обращения', 'OK', { duration: 3000 }),
    });
  }

  sendMessage() {
    if (this.newMessageControl.invalid || !this.selectedRequest) return;
    const text = this.newMessageControl.value;
    this.api.sendSupportMessage(this.selectedRequest.id, text).subscribe({
      next: (msg) => { this.messages = [...this.messages, msg]; },
      error: () => this.snackBar.open('Ошибка отправки сообщения', 'OK', { duration: 3000 }),
    });
    this.newMessageControl.reset();
  }
}
