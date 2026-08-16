import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthActions } from '../../actions/auth.actions';
import { selectAuthUser } from '../../selectors/auth.selectors';

interface NavItem {
  link: string;
  icon: string;
  label: string;
}

const ROLE_LABEL: Record<string, string> = {
  client: 'Клиент',
  manager: 'Менеджер',
  admin: 'Администратор',
};

/** Разделы по ролям. Их максимум четыре — этого мало для боковой панели. */
const NAV: Record<string, NavItem[]> = {
  guest: [{ link: '/hotels', icon: 'hotel', label: 'Отели' }],
  client: [
    { link: '/hotels', icon: 'hotel', label: 'Отели' },
    { link: '/reservations', icon: 'event', label: 'Мои брони' },
    { link: '/support', icon: 'support_agent', label: 'Поддержка' },
  ],
  manager: [
    { link: '/hotels', icon: 'hotel', label: 'Отели' },
    { link: '/manager/reservations', icon: 'table_view', label: 'Все брони' },
    { link: '/manager/users', icon: 'people', label: 'Пользователи' },
    { link: '/support', icon: 'support_agent', label: 'Поддержка' },
  ],
  admin: [
    { link: '/hotels', icon: 'hotel', label: 'Отели' },
    { link: '/admin/hotels', icon: 'apartment', label: 'Отели и номера' },
    { link: '/admin/rooms', icon: 'meeting_room', label: 'Номера' },
    { link: '/admin/users', icon: 'people', label: 'Пользователи' },
  ],
};

/**
 * Навигация живёт в шапке, а не в боковой панели.
 *
 * Разделов максимум четыре: панель на 264 px оставалась наполовину пустой
 * при любом наполнении и забирала ширину у таблиц и сетки отелей.
 * На телефоне разделы уезжают в выдвижную панель — там горизонтальный
 * ряд не помещается.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatMenuModule, MatTooltipModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly store = inject(Store);
  private readonly breakpoints = inject(BreakpointObserver);

  readonly user = toSignal(this.store.select(selectAuthUser), { initialValue: null });

  readonly isHandset = toSignal(
    this.breakpoints.observe([Breakpoints.Handset, Breakpoints.TabletPortrait]).pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  readonly navItems = computed<NavItem[]>(() => NAV[this.user()?.role ?? 'guest'] ?? NAV['guest']);

  readonly roleLabel = ROLE_LABEL;

  initials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
