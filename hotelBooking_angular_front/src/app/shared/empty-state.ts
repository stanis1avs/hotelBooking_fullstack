import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Единое пустое состояние: иконка, заголовок, пояснение, действие.
 * Раньше на каждой странице был свой вариант — от серой строки текста
 * до блока с иконкой, размер которой задавался инлайновым стилем.
 */
@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center text-center gap-1 py-14 px-6">
      <div class="empty-icon"><mat-icon>{{ icon }}</mat-icon></div>
      <h3 class="text-base font-semibold mt-2">{{ title }}</h3>
      @if (description) {
        <p class="text-sm max-w-sm" style="color: var(--mat-sys-on-surface-variant)">{{ description }}</p>
      }
      <div class="mt-3"><ng-content /></div>
    </div>
  `,
  styles: [`
    .empty-icon {
      width: 60px; height: 60px; border-radius: 50%;
      display: grid; place-items: center;
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
    }
    .empty-icon mat-icon { width: 30px; height: 30px; font-size: 30px; }
  `],
})
export class EmptyState {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() description?: string;
}
