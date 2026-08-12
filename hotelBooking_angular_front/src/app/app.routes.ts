import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

/**
 * Все страницы грузятся лениво: раньше админские экраны и менеджерские таблицы
 * попадали в первоначальный бандл даже анонимному посетителю.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hotels' },

  {
    path: 'login',
    title: 'Вход — Пристань',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Регистрация — Пристань',
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
  },

  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      {
        path: 'hotels',
        title: 'Поиск отелей — Пристань',
        loadComponent: () => import('./pages/hotels/hotels').then((m) => m.Hotels),
      },
      {
        path: 'hotels/:hotelId',
        title: 'Отель — Пристань',
        loadComponent: () => import('./pages/hotel-details/hotel-details').then((m) => m.HotelDetails),
      },
      {
        path: 'reservations',
        title: 'Мои бронирования — Пристань',
        canActivate: [authGuard, roleGuard(['client'])],
        loadComponent: () => import('./pages/reservations/reservations').then((m) => m.Reservations),
      },
      {
        path: 'manager/reservations',
        title: 'Все бронирования — Пристань',
        canActivate: [authGuard, roleGuard(['manager'])],
        loadComponent: () =>
          import('./pages/manager-reservations/manager-reservations').then((m) => m.ManagerReservations),
      },
      {
        path: 'support',
        title: 'Поддержка — Пристань',
        canActivate: [authGuard, roleGuard(['client', 'manager'])],
        loadComponent: () => import('./pages/support/support').then((m) => m.Support),
      },
      {
        path: 'admin/hotels',
        title: 'Управление отелями — Пристань',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadComponent: () => import('./pages/admin-hotels/admin-hotels').then((m) => m.AdminHotels),
      },
      {
        path: 'admin/rooms',
        title: 'Управление номерами — Пристань',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadComponent: () => import('./pages/admin-rooms/admin-rooms').then((m) => m.AdminRooms),
      },
      {
        path: 'admin/users',
        title: 'Пользователи — Пристань',
        canActivate: [authGuard, roleGuard(['admin'])],
        loadComponent: () => import('./pages/users/users').then((m) => m.UsersPage),
      },
      {
        path: 'manager/users',
        title: 'Пользователи — Пристань',
        canActivate: [authGuard, roleGuard(['manager'])],
        loadComponent: () => import('./pages/users/users').then((m) => m.UsersPage),
      },
      {
        path: 'forbidden',
        title: 'Нет доступа — Пристань',
        loadComponent: () => import('./pages/error-page/error-page').then((m) => m.ForbiddenPage),
      },
      // Неизвестный адрес раньше молча уводил на главную — теперь показываем 404.
      {
        path: '**',
        title: 'Страница не найдена — Пристань',
        loadComponent: () => import('./pages/error-page/error-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
