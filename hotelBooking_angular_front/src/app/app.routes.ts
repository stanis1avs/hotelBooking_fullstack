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
      { path: 'reservations', component: Reservations },
      { path: 'support', component: Support },
      { path: 'admin/hotels', component: AdminHotels },
      { path: 'admin/rooms', component: AdminRooms },
    ],
  },
  { path: '**', redirectTo: 'hotels' },
];
