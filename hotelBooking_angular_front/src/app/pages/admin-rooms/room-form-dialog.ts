import { Component, OnDestroy, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { HotelDto, RoomDto } from '../../core/api';
import { ImageUrlPipe } from '../../shared/image-url.pipe';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

export interface RoomFormData {
  room: RoomDto | null;
  hotels: HotelDto[];
  hotelId: string;
}

/** См. HotelFormDialog: форма вынесена из потока страницы в диалог. */
@Component({
  selector: 'app-room-form-dialog',
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ImageUrlPipe,
  ],
  templateUrl: './room-form-dialog.html',
  styleUrl: './room-form-dialog.scss',
})
export class RoomFormDialog implements OnDestroy {
  private readonly snackBar = inject(MatSnackBar);
  readonly ref = inject(MatDialogRef<RoomFormDialog, FormData>);
  readonly data = inject<RoomFormData>(MAT_DIALOG_DATA);

  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  private objectUrls: string[] = [];

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hotelId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    size: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    guests: new FormControl(2, { nonNullable: true, validators: [Validators.min(1), Validators.max(10)] }),
    bed: new FormControl('', { nonNullable: true }),
    // Признак доступности не был выведен в форму, хотя в модели он есть.
    isEnabled: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    const room = this.data.room;
    if (room) {
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
    } else {
      this.form.controls.hotelId.setValue(this.data.hotelId);
    }
  }

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  get isEdit(): boolean {
    return this.data.room !== null;
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
    if (!this.isEdit && !this.selectedFiles.length) {
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

    this.ref.close(fd);
  }
}
