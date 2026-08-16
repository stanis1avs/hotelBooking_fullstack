import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Api, HotelDto, RoomDto } from '../../core/api';
import { EmptyState } from '../../shared/empty-state';
import { ImageUrlPipe } from '../../shared/image-url.pipe';
import { MoneyPipe } from '../../shared/money.pipe';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

@Component({
  selector: 'app-admin-rooms',
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule,
    MatInputModule, MatProgressBarModule, MatIconModule, MatSelectModule, MatTooltipModule,
    EmptyState, ImageUrlPipe, MoneyPipe,
  ],
  templateUrl: './admin-rooms.html',
  styleUrl: './admin-rooms.scss',
})
export class AdminRooms implements OnInit, OnDestroy {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  hotels: HotelDto[] = [];
  rooms: RoomDto[] = [];
  hotelsLoading = false;
  roomsLoading = false;
  saving = false;
  selectedHotelId: string | null = null;

  editingRoom: RoomDto | null = null;
  showForm = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  private objectUrls: string[] = [];

  readonly form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hotelId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    size: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
    guests: new FormControl<number>(2, { nonNullable: true, validators: [Validators.min(1), Validators.max(10)] }),
    bed: new FormControl<string>('', { nonNullable: true }),
    // Признак доступности не был выведен в форму, хотя в модели он есть.
    isEnabled: new FormControl<boolean>(true, { nonNullable: true }),
  });

  private emptyForm() {
    return {
      title: '', description: '', hotelId: this.selectedHotelId ?? '',
      price: 0, size: 0, guests: 2, bed: '', isEnabled: true,
    };
  }

  ngOnInit(): void {
    this.loadHotels();
  }

  ngOnDestroy(): void {
    this.releaseUrls();
  }

  private releaseUrls(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }

  loadHotels(): void {
    this.hotelsLoading = true;
    this.api.getAllHotels({ limit: 50 }).subscribe({
      next: (response) => {
        this.hotels = response.body ?? [];
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
    this.cancelForm();
    this.loadRooms();
  }

  loadRooms(): void {
    if (!this.selectedHotelId) return;
    this.roomsLoading = true;
    // Админский эндпоинт возвращает и отключённые номера: через публичный
    // их не было видно, а значит нельзя было включить обратно.
    this.api.getAdminRooms({ hotel: this.selectedHotelId }).subscribe({
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
    this.editingRoom = null;
    this.selectedFiles = [];
    this.releaseUrls();
    this.previewUrls = [];
    this.form.reset(this.emptyForm());
    this.showForm = true;
  }

  openEdit(room: RoomDto): void {
    this.editingRoom = room;
    this.selectedFiles = [];
    this.releaseUrls();
    this.previewUrls = room.images ?? [];
    this.form.setValue({
      title: room.title ?? '',
      description: room.description ?? '',
      hotelId: room.hotel.id,
      price: room.price ?? 0,
      size: room.size ?? 0,
      guests: room.guests ?? 2,
      bed: room.bed ?? '',
      isEnabled: room.isEnabled ?? true,
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingRoom = null;
    this.selectedFiles = [];
    this.releaseUrls();
    this.previewUrls = [];
    this.form.reset(this.emptyForm());
  }

  onFilesChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    if (files.length > MAX_IMAGES) {
      this.snackBar.open(`Не больше ${MAX_IMAGES} фотографий за раз`, 'Понятно', { duration: 5000 });
      input.value = '';
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      this.snackBar.open(`Файл «${tooBig.name}» больше 5 МБ`, 'Понятно', { duration: 5000 });
      input.value = '';
      return;
    }

    this.releaseUrls();
    this.selectedFiles = files;
    this.previewUrls = files.map((f) => {
      const url = URL.createObjectURL(f);
      this.objectUrls.push(url);
      return url;
    });
  }

  /** Удаление отдельной фотографии — раньше можно было только заменить все сразу. */
  removePreview(index: number): void {
    const url = this.previewUrls[index];
    if (this.objectUrls.includes(url)) {
      URL.revokeObjectURL(url);
      this.objectUrls = this.objectUrls.filter((u) => u !== url);
    }
    this.previewUrls = this.previewUrls.filter((_, i) => i !== index);
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.editingRoom && !this.selectedFiles.length) {
      this.snackBar.open('Загрузите хотя бы одну фотографию', 'Понятно', { duration: 4000 });
      return;
    }

    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('title', v.title);
    fd.append('description', v.description);
    fd.append('hotelId', v.hotelId);
    fd.append('price', String(v.price));
    fd.append('size', String(v.size));
    fd.append('guests', String(v.guests));
    fd.append('bed', v.bed);
    fd.append('isEnabled', String(v.isEnabled));
    this.selectedFiles.forEach((f) => fd.append('images', f));

    this.saving = true;
    const wasEditing = !!this.editingRoom;
    const call$ = this.editingRoom ? this.api.updateRoom(this.editingRoom.id, fd) : this.api.createRoom(fd);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open(wasEditing ? 'Номер обновлён' : 'Номер добавлен', 'OK', { duration: 4000 });
        this.cancelForm();
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
      this.api.deleteRoom(room.id).subscribe({
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
