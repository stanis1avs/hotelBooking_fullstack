import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-layout',
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col items-center text-center gap-2 py-20 px-6">
      <div class="err-icon"><mat-icon>{{ icon }}</mat-icon></div>
      <span class="text-xs font-bold tracking-widest mt-3 faint">{{ code }}</span>
      <h1 class="text-2xl font-semibold">{{ heading }}</h1>
      <p class="text-sm max-w-md muted">{{ text }}</p>
      <div class="flex gap-2 mt-5 flex-wrap justify-center"><ng-content /></div>
    </div>
  `,
  styles: [`
    .err-icon {
      width: 76px; height: 76px; border-radius: 50%;
      display: grid; place-items: center;
      background: var(--mat-sys-surface-container-high);
      color: var(--mat-sys-on-surface-variant);
    }
    .err-icon mat-icon { width: 38px; height: 38px; font-size: 38px; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorLayout {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) code!: string;
  @Input({ required: true }) heading!: string;
  @Input({ required: true }) text!: string;
}

/** Раньше неизвестный адрес молча редиректил на список отелей. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, ErrorLayout],
  template: `
    <app-error-layout
      icon="travel_explore"
      code="404"
      heading="Такой страницы нет"
      text="Возможно, ссылка устарела или в адресе опечатка. Вернитесь к поиску отелей — оттуда доступно всё остальное.">
      <a mat-flat-button color="primary" routerLink="/hotels">На главную</a>
      <a mat-stroked-button routerLink="/support">Написать в поддержку</a>
    </app-error-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}

/** Раньше нехватка прав приводила к молчаливому возврату на /hotels. */
@Component({
  selector: 'app-forbidden',
  imports: [RouterLink, MatButtonModule, ErrorLayout],
  template: `
    <app-error-layout
      icon="lock"
      code="403"
      heading="Доступ закрыт"
      text="У вашей роли нет прав на этот раздел. Если доступ нужен по работе — напишите администратору.">
      <a mat-flat-button color="primary" routerLink="/hotels">К списку отелей</a>
    </app-error-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenPage {}
