import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthActions } from '../../actions/auth.actions';
import { selectAuthUser } from '../../selectors/auth.selectors';

@Component({
  selector: 'app-shell',
  imports: [
    AsyncPipe,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './shell.html'
})
export class Shell {
  readonly user$;

  constructor(private readonly store: Store) {
    this.user$ = this.store.select(selectAuthUser);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
