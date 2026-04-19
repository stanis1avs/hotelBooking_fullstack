import { Routes } from '@angular/router';

import { Shell } from './layout/shell/shell';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { Hotels } from './pages/hotels/hotels';
import { HotelDetails } from './pages/hotel-details/hotel-details';
import { Reservations } from './pages/reservations/reservations';
import { Support } from './pages/support/support';
import { AdminHotels } from './pages/admin-hotels/admin-hotels';
import { AdminRooms } from './pages/admin-rooms/admin-rooms';
import { ManagerReservations } from './pages/manager-reservations/manager-reservations';
import { AdminUsersComponent } from './pages/admin-users/admin-users';
import { ManagerUsersComponent } from './pages/manager-users/manager-users';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'hotels' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Shell,
    children: [
      { path: 'hotels', component: Hotels },
      { path: 'hotels/:hotelId', component: HotelDetails },
      {
        path: 'reservations',
        component: Reservations,
        canActivate: [authGuard, roleGuard(['client'])],
      },
      {
        path: 'manager/reservations',
        component: ManagerReservations,
        canActivate: [authGuard, roleGuard(['manager'])],
      },
      {
        path: 'support',
        component: Support,
        canActivate: [authGuard, roleGuard(['client', 'manager'])],
      },
      {
        path: 'admin/hotels',
        component: AdminHotels,
        canActivate: [authGuard, roleGuard(['admin'])],
      },
      {
        path: 'admin/rooms',
        component: AdminRooms,
        canActivate: [authGuard, roleGuard(['admin'])],
      },
      {
        path: 'admin/users',
        component: AdminUsersComponent,
        canActivate: [authGuard, roleGuard(['admin'])],
      },
      {
        path: 'manager/users',
        component: ManagerUsersComponent,
        canActivate: [authGuard, roleGuard(['manager'])],
      },
    ],
  },
  { path: '**', redirectTo: 'hotels' },
];
