import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { Amenity, Api, HotelDto } from '../../core/api';
import { EmptyState } from '../../shared/empty-state';
import { MoneyPipe } from '../../shared/money.pipe';
import { AMENITY_LIST, AMENITY_META } from '../../shared/amenities';
import { confirmAction } from '../../shared/confirm-dialog';
import { errorMessage } from '../../core/error-message';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-admin-hotels',
  imports: [
    ReactiveFormsModule, MatCardModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatProgressBarModule, MatIconModule, MatTooltipModule,
    MatSelectModule, MatChipsModule, EmptyState, MoneyPipe,
  ],
  templateUrl: './admin-hotels.html',
  styleUrl: './admin-hotels.scss',
})
export class AdminHotels implements OnInit, OnDestroy {
  private readonly api = inject(Api);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  hotels: HotelDto[] = [];
  loading = false;
  saving = false;

  editingHotel: HotelDto | null = null;
  showForm = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  /** Созданные blob-URL нужно освобождать, иначе файлы висят в памяти до перезагрузки. */
  private objectUrls: string[] = [];

  readonly amenityList = AMENITY_LIST;

  readonly form = new FormGroup({
    title: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    city: new FormControl<string>('', { nonNullable: true }),
    stars: new FormControl<number>(3, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    rating: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(5)] }),
    reviewsCount: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
    amenities: new FormControl<Amenity[]>([], { nonNullable: true }),
  });

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
    this.loading = true;
    // Без фиктивных дат 2024 года: раньше админ видел максимум 10 отелей,
    // отфильтрованных по бронированиям того года.
    this.api.getAllHotels({ limit: 50 }).subscribe({
      next: (response) => {
        this.hotels = response.body ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось загрузить отели'), 'Понятно', { duration: 5000 });
      },
    });
  }

  openCreate(): void {
    this.editingHotel = null;
    this.selectedFile = null;
    this.releaseUrls();
    this.previewUrl = null;
    this.form.reset();
    this.showForm = true;
  }

  openEdit(hotel: HotelDto): void {
    this.editingHotel = hotel;
    this.selectedFile = null;
    this.releaseUrls();
    this.previewUrl = hotel.image;
    this.form.setValue({
      title: hotel.title,
      description: hotel.description ?? '',
      city: hotel.city ?? '',
      stars: hotel.stars ?? 3,
      rating: hotel.rating ?? 0,
      reviewsCount: hotel.reviewsCount ?? 0,
      amenities: hotel.amenities ?? [],
    });
    this.showForm = true;
  }

  readonly amenityMeta = AMENITY_META;

  stars(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, n)) });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingHotel = null;
    this.selectedFile = null;
    this.releaseUrls();
    this.previewUrl = null;
    this.form.reset();
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

    this.releaseUrls();
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.objectUrls.push(this.previewUrl);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.editingHotel && !this.selectedFile) {
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
    // Файл добавляем только когда он выбран — редактирование без замены
    // фотографии теперь корректно обрабатывается сервером.
    if (this.selectedFile) fd.append('image', this.selectedFile);

    this.saving = true;
    const call$ = this.editingHotel ? this.api.updateHotel(this.editingHotel.id, fd) : this.api.createHotel(fd);
    const wasEditing = !!this.editingHotel;

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open(wasEditing ? 'Изменения сохранены' : 'Отель создан', 'OK', { duration: 4000 });
        this.cancelForm();
        this.loadHotels();
      },
      error: (error) => {
        this.saving = false;
        this.cdr.markForCheck();
        this.snackBar.open(errorMessage(error, 'Не удалось сохранить'), 'Понятно', { duration: 6000 });
      },
    });
  }

  /** Нативный confirm() заменён диалогом Material. */
  delete(hotel: HotelDto): void {
    confirmAction(this.dialog, {
      title: 'Удалить отель?',
      message: `«${hotel.title}» и все его номера исчезнут из поиска. Активные брони при этом сохранятся.`,
      confirmLabel: 'Удалить отель',
      destructive: true,
    }).subscribe((confirmed) => {
      if (!confirmed) return;
      this.api.deleteHotel(hotel.id).subscribe({
        next: () => {
          this.snackBar.open('Отель удалён', 'OK', { duration: 4000 });
          this.loadHotels();
        },
        error: (error) =>
          this.snackBar.open(errorMessage(error, 'Не удалось удалить отель'), 'Понятно', { duration: 5000 }),
      });
    });
  }
}
