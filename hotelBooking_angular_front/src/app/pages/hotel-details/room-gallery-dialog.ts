import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ImageUrlPipe } from '../../shared/image-url.pipe';

export interface RoomGalleryData {
  title: string;
  images: string[];
}

/**
 * Галерея номера.
 *
 * В списке и в карточке показывалась только `images[0]`, а остальные
 * загруженные фотографии не было видно нигде — при том, что загрузить
 * их администратор мог с самого начала.
 */
@Component({
  selector: 'app-room-gallery-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, ImageUrlPipe],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content class="gallery-body">
      <div class="stage">
        <img [src]="data.images[current()] | imageUrl" [alt]="data.title + ': фотография ' + (current() + 1)" />

        @if (data.images.length > 1) {
          <button mat-mini-fab class="nav prev" (click)="step(-1)" aria-label="Предыдущая фотография">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <button mat-mini-fab class="nav next" (click)="step(1)" aria-label="Следующая фотография">
            <mat-icon>chevron_right</mat-icon>
          </button>
          <span class="counter">{{ current() + 1 }} / {{ data.images.length }}</span>
        }
      </div>

      @if (data.images.length > 1) {
        <div class="thumbs">
          @for (image of data.images; track image; let i = $index) {
            <button type="button" class="thumb" [class.active]="i === current()" (click)="current.set(i)"
                    [attr.aria-label]="'Показать фотографию ' + (i + 1)">
              <img [src]="image | imageUrl" alt="" loading="lazy" />
            </button>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close()">Закрыть</button>
    </mat-dialog-actions>
  `,
  styles: `
    .gallery-body {
      /* Диалог по умолчанию сжимает содержимое по ширине текста */
      min-width: min(680px, 80vw);
    }

    .stage {
      position: relative;
      aspect-ratio: 16 / 10;
      border-radius: var(--mat-sys-corner-medium);
      overflow: hidden;
      background: var(--mat-sys-surface-container-high);
    }

    .stage img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
    .prev { left: 10px; }
    .next { right: 10px; }

    .counter {
      position: absolute;
      right: 12px;
      bottom: 12px;
      padding: 3px 10px;
      border-radius: 999px;
      font: var(--mat-sys-label-small);
      color: #fff;
      background: rgb(0 0 0 / 55%);
    }

    .thumbs {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .thumb {
      flex: 0 0 auto;
      width: 84px;
      height: 60px;
      padding: 0;
      border: 2px solid transparent;
      border-radius: var(--mat-sys-corner-small);
      overflow: hidden;
      cursor: pointer;
      background: none;
      opacity: 0.65;
      transition: opacity 0.15s, border-color 0.15s;
    }

    .thumb:hover { opacity: 1; }

    .thumb.active {
      opacity: 1;
      border-color: var(--mat-sys-primary);
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `,
})
export class RoomGalleryDialog {
  readonly ref = inject(MatDialogRef<RoomGalleryDialog>);
  readonly data = inject<RoomGalleryData>(MAT_DIALOG_DATA);

  readonly current = signal(0);

  /** По кругу: с последней фотографии «вперёд» ведёт на первую. */
  step(delta: number): void {
    const count = this.data.images.length;
    this.current.set((this.current() + delta + count) % count);
  }
}
