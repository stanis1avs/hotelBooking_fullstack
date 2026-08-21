import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';

import { Api, HotelDto, RoomDto } from '../../core/api';
import { ApolloService } from '../../graphql/apollo.service';
import { EmptyState } from '../../shared/empty-state';
import { ImageUrlPipe } from '../../shared/image-url.pipe';
import { MoneyPipe } from '../../shared/money.pipe';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

@Component({
  selector: 'app-admin-rooms',
  imports: [
    MatCardModule, MatButtonModule, MatFormFieldModule, MatProgressBarModule,
    MatIconModule, MatSelectModule, MatTooltipModule, EmptyState, ImageUrlPipe, MoneyPipe,
  ],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.scss',
})
export class AdminRooms implements OnInit {
  /** REST остался только под multipart, всё остальное — GraphQL. */
  private readonly api = inject(Api);
  private readonly apollo = inject(ApolloService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  hotels: HotelDto[] = [];
  rooms: RoomDto[] = [];
  hotelsLoading = false;
  roomsLoading = false;
  saving = false;
  selectedHotelId: string | null = null;

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.hotelsLoading = true;
    this.apollo.adminGetHotels({ limit: 50 }).subscribe({
      next: (page) => {
        this.hotels = page.items;
        this.hotelsLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.hotelsLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить отели'), 'Понятно', { duration: 5000 });
      },
    });
  }

  selectHotel(hotelId: string): void {
    this.selectedHotelId = hotelId;
    this.loadRooms();
  }

  loadRooms(): void {
    if (!this.selectedHotelId) return;
    this.roomsLoading = true;
    // Админский запрос возвращает и отключённые номера: через публичный
    // их не было видно, а значит нельзя было включить обратно.
    this.apollo.adminGetRooms(this.selectedHotelId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.roomsLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.roomsLoading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить номера'), 'Понятно', { duration: 5000 });
      },
    });
  }

  openCreate(): void {
    this.openForm(null);
  }

  openEdit(room: RoomDto): void {
    this.openForm(room);
  }

  /** См. AdminHotels: форма вынесена из потока страницы в диалог. */
  private openForm(room: RoomDto | null): void {
    import('./room-form-dialog').then(({ RoomFormDialog }) => {
      this.dialog
        .open(RoomFormDialog, {
          data: { room, hotels: this.hotels, hotelId: this.selectedHotelId ?? '' },
          width: '720px',
          maxWidth: '95vw',
          autoFocus: 'first-tabbable',
        })
        .afterClosed()
        .subscribe((payload: FormData | undefined) => {
          if (!payload) return;
          this.submit(room ? this.api.updateRoom(room.id, payload) : this.api.createRoom(payload), !!room);
        });
    });
  }

  private submit(call$: Observable<unknown>, wasEditing: boolean): void {
    this.saving = true;
    call$.subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open(wasEditing ? 'Номер обновлён' : 'Номер добавлен', 'OK', { duration: 4000 });
        this.loadRooms();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось сохранить'), 'Понятно', { duration: 6000 });
      },
    });
  }

  delete(room: RoomDto): void {
    confirmAction(this.dialog, {
      title: 'Удалить номер?',
      message: 'Номер пропадёт из поиска. Если по нему есть активные брони, сначала отмените их.',
      confirmLabel: 'Удалить номер',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.apollo.deleteRoom(room.id).subscribe({
        next: () => {
          this.snackBar.open('Номер удалён', 'OK', { duration: 4000 });
          this.loadRooms();
        },
        error: (error) =>
          this.snackBar.open(errorMessage(error, 'Не удалось удалить номер'), 'Понятно', { duration: 5000 }),
      });
    });
  }
}
