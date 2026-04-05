import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api, HotelDto, RoomDto } from '../../core/api';

@Component({
  selector: 'app-admin-rooms',
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatIconModule, MatSelectModule,
  ],
  templateUrl: './admin-rooms.html',
})
export class AdminRooms {
  hotels: HotelDto[] = [];
  rooms: RoomDto[] = [];
  hotelsLoading = false;
  roomsLoading = false;
  selectedHotelId: string | null = null;

  editingRoom: RoomDto | null = null;
  showForm = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  saving = false;

  readonly form = new FormGroup({
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    hotelId: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly api: Api, private readonly snackBar: MatSnackBar) {
    this.loadHotels();
  }

  loadHotels() {
    this.hotelsLoading = true;
    this.api.getAllHotels().subscribe({
      next: (hotels) => { this.hotels = hotels; this.hotelsLoading = false; },
      error: () => { this.hotelsLoading = false; this.snackBar.open('Ошибка загрузки отелей', 'OK', { duration: 3000 }); },
    });
  }

  selectHotel(hotelId: string) {
    this.selectedHotelId = hotelId;
    this.cancelForm();
    this.loadRooms();
  }

  loadRooms() {
    if (!this.selectedHotelId) return;
    this.roomsLoading = true;
    this.api.getRooms({ hotel: this.selectedHotelId }).subscribe({
      next: (rooms) => { this.rooms = rooms; this.roomsLoading = false; },
      error: () => { this.roomsLoading = false; this.snackBar.open('Ошибка загрузки номеров', 'OK', { duration: 3000 }); },
    });
  }

  openCreate() {
    this.editingRoom = null;
    this.selectedFiles = [];
    this.previewUrls = [];
    this.form.reset();
    if (this.selectedHotelId) this.form.controls.hotelId.setValue(this.selectedHotelId);
    this.showForm = true;
  }

  openEdit(room: RoomDto) {
    this.editingRoom = room;
    this.selectedFiles = [];
    this.previewUrls = room.images?.map((img) => `${img}`) ?? [];
    this.form.setValue({ description: room.description, hotelId: room.hotel.id });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingRoom = null;
    this.selectedFiles = [];
    this.previewUrls = [];
    this.form.reset();
  }

  onFilesChange(event: Event) {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.selectedFiles = files;
    this.previewUrls = files.map((f) => URL.createObjectURL(f));
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.editingRoom && this.selectedFiles.length === 0) {
      this.snackBar.open('Загрузите хотя бы одно изображение', 'OK', { duration: 3000 });
      return;
    }

    const fd = new FormData();
    fd.append('description', this.form.controls.description.value);
    fd.append('hotelId', this.form.controls.hotelId.value);
    this.selectedFiles.forEach((f) => fd.append('images', f));

    this.saving = true;
    const call$ = this.editingRoom
      ? this.api.updateRoom(this.editingRoom.id, fd)
      : this.api.createRoom(fd);

    call$.subscribe({
      next: () => {
        this.snackBar.open(this.editingRoom ? 'Номер обновлён' : 'Номер создан', 'OK', { duration: 3000 });
        this.saving = false;
        this.cancelForm();
        this.loadRooms();
      },
      error: () => { this.snackBar.open('Ошибка сохранения', 'OK', { duration: 3000 }); this.saving = false; },
    });
  }

  delete(room: RoomDto) {
    if (!confirm(`Удалить номер "${room.description}"?`)) return;
    this.api.deleteRoom(room.id).subscribe({
      next: () => { this.snackBar.open('Номер удалён', 'OK', { duration: 3000 }); this.loadRooms(); },
      error: () => this.snackBar.open('Ошибка удаления', 'OK', { duration: 3000 }),
    });
  }
}
