import { Component, OnDestroy, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Amenity, Destination, HotelDto } from '../../core/api';
import { AMENITY_LIST } from '../../shared/amenities';
import { DESTINATION_LIST } from '../../shared/destinations';
import { ImageUrlPipe } from '../../shared/image-url.pipe';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface HotelFormData {
  hotel: HotelDto | null;
}

/**
 * Форма отеля в диалоге.
 *
 * Раньше она разворачивалась карточкой над списком и сдвигала его вниз:
 * при правке нижнего отеля форма появлялась за пределами экрана,
 * и со стороны выглядело так, будто кнопка «Изменить» ничего не сделала.
 */
@Component({
  selector: 'app-hotel-form-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ImageUrlPipe,
  ],
  templateUrl: './hotel-form-dialog.html',
  styleUrl: './hotel-form-dialog.scss',
})
export class HotelFormDialog implements OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  readonly ref = inject(MatDialogRef<HotelFormDialog, FormData>);
  readonly data = inject<HotelFormData>(MAT_DIALOG_DATA);

  readonly amenityList = AMENITY_LIST;
  readonly destinationList = DESTINATION_LIST;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  /** blob-URL нужно освобождать вручную, иначе файл висит в памяти до перезагрузки. */
  private objectUrls: string[] = [];

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl('', { nonNullable: true }),
    stars: new FormControl(3, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    rating: new FormControl(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(5)] }),
    reviewsCount: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    amenities: new FormControl<Amenity[]>([], { nonNullable: true }),
    // По направлению работают подборки в поиске: без него отель в них не попадёт
    destinations: new FormControl<Destination[]>([], { nonNullable: true }),
  });

  constructor() {
    const hotel = this.data.hotel;
    if (hotel) {
      this.previewUrl = hotel.image;
      this.form.setValue({
        title: hotel.title,
        description: hotel.description ?? '',
        city: hotel.city ?? '',
        stars: hotel.stars ?? 3,
        rating: hotel.rating ?? 0,
        reviewsCount: hotel.reviewsCount ?? 0,
        amenities: hotel.amenities ?? [],
        destinations: hotel.destinations ?? [],
      });
    }
  }

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  get isEdit(): boolean {
    return this.data.hotel !== null;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      this.snackBar.open('Файл больше 5 МБ — выберите изображение поменьше', 'Понятно', { duration: 5000 });
      input.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Нужен файл изображения: JPG, PNG или WebP', 'Понятно', { duration: 5000 });
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.objectUrls.push(this.previewUrl);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.isEdit && !this.selectedFile) {
      this.snackBar.open('Загрузите фотографию отеля', 'Понятно', { duration: 4000 });
      return;
    }

    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('title', v.title);
    fd.append('description', v.description);
    fd.append('city', v.city);
    fd.append('stars', String(v.stars));
    fd.append('rating', String(v.rating));
    fd.append('reviewsCount', String(v.reviewsCount));
    // FormData не умеет массивы — на бэкенде строка разбирается по запятой
    fd.append('amenities', v.amenities.join(','));
    fd.append('destinations', v.destinations.join(','));
    // Файл добавляем только когда он выбран: правка без замены фотографии
    // не должна затирать существующую.
    if (this.selectedFile) fd.append('image', this.selectedFile);

    this.ref.close(fd);
  }
}
