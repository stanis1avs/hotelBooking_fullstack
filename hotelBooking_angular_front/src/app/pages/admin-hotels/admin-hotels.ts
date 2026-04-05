import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Api, HotelDto } from '../../core/api';

@Component({
  selector: 'app-admin-hotels',
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatIconModule,
  ],
  templateUrl: './admin-hotels.html',
})
export class AdminHotels {
  hotels: HotelDto[] = [];
  loading = false;

  editingHotel: HotelDto | null = null;
  showForm = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  saving = false;

  readonly form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly api: Api, private readonly snackBar: MatSnackBar) {
    this.loadHotels();
  }

  loadHotels() {
    this.loading = true;
    this.api.getAllHotels().subscribe({
      next: (hotels) => { this.hotels = hotels; this.loading = false; },
      error: () => { this.loading = false; this.snackBar.open('Ошибка загрузки отелей', 'OK', { duration: 3000 }); },
    });
  }

  openCreate() {
    this.editingHotel = null;
    this.selectedFile = null;
    this.previewUrl = null;
    this.form.reset();
    this.showForm = true;
  }

  openEdit(hotel: HotelDto) {
    this.editingHotel = hotel;
    this.selectedFile = null;
    this.previewUrl = hotel.image;
    this.form.setValue({ title: hotel.title, description: hotel.description });
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingHotel = null;
    this.selectedFile = null;
    this.previewUrl = null;
    this.form.reset();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      this.previewUrl = URL.createObjectURL(file);
    }
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.editingHotel && !this.selectedFile) {
      this.snackBar.open('Выберите изображение отеля', 'OK', { duration: 3000 });
      return;
    }

    const fd = new FormData();
    fd.append('title', this.form.controls.title.value);
    fd.append('description', this.form.controls.description.value);
    if (this.selectedFile) fd.append('image', this.selectedFile);

    this.saving = true;
    const call$ = this.editingHotel
      ? this.api.updateHotel(this.editingHotel.id, fd)
      : this.api.createHotel(fd);

    call$.subscribe({
      next: () => {
        this.snackBar.open(this.editingHotel ? 'Отель обновлён' : 'Отель создан', 'OK', { duration: 3000 });
        this.saving = false;
        this.cancelForm();
        this.loadHotels();
      },
      error: () => { this.snackBar.open('Ошибка сохранения', 'OK', { duration: 3000 }); this.saving = false; },
    });
  }

  delete(hotel: HotelDto) {
    if (!confirm(`Удалить отель "${hotel.title}"?`)) return;
    this.api.deleteHotel(hotel.id).subscribe({
      next: () => { this.snackBar.open('Отель удалён', 'OK', { duration: 3000 }); this.loadHotels(); },
      error: () => this.snackBar.open('Ошибка удаления', 'OK', { duration: 3000 }),
    });
  }
}
