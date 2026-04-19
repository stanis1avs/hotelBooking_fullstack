import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, Observable } from 'rxjs';
import { UsersActions } from '../../actions/users.actions';
import { selectUsers, selectUsersLoading, selectUsersError, selectUsersSearchParams, selectHasNextPage, selectHasPrevPage } from '../../selectors/users.selectors';
import { UserDto } from '../../core/api';

@Component({
  selector: 'app-manager-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './manager-users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerUsersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'contactPhone', 'email', 'role'];
  
  users$: Observable<UserDto[]>;
  loading$: Observable<boolean>;
  error$: Observable<unknown | null>;
  searchParams$: Observable<{ limit: number; offset: number; email?: string; name?: string; contactPhone?: string }>;
  hasNextPage$: Observable<boolean>;
  hasPrevPage$: Observable<boolean>;

  searchForm: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.users$ = this.store.select(selectUsers);
    this.loading$ = this.store.select(selectUsersLoading);
    this.error$ = this.store.select(selectUsersError);
    this.searchParams$ = this.store.select(selectUsersSearchParams);
    this.hasNextPage$ = this.store.select(selectHasNextPage);
    this.hasPrevPage$ = this.store.select(selectHasPrevPage);
    
    this.searchForm = this.fb.group({
      searchQuery: [''],
    });
  }

  ngOnInit(): void {
    this.loadUsers();

    this.error$.pipe(takeUntil(this.destroy$)).subscribe((error: unknown) => {
      if (error) {
        this.snackBar.open('Error loading users', 'Close', { duration: 3000 });
      }
    });

    this.searchParams$.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      this.loadUsers();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.searchParams$.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      this.store.dispatch(UsersActions.managerLoadUsers({ payload: params }));
    });
  }

  onSearch(): void {
    const searchQuery = this.searchForm.get('searchQuery')?.value || '';
    
    let searchParams: any = {
      email: '',
      name: '',
      contactPhone: '',
    };

    if (searchQuery.includes('@')) {
      searchParams.email = searchQuery;
    } else if (/[\d\+\-\(\)\s]/.test(searchQuery)) {
      searchParams.contactPhone = searchQuery;
    } else {
      searchParams.name = searchQuery;
    }

    this.store.dispatch(UsersActions.setSearchParams({ payload: searchParams }));
  }

  onNextPage(): void {
    this.searchParams$.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      this.store.dispatch(UsersActions.setSearchParams({ 
        payload: { offset: params.offset + params.limit } 
      }));
    });
  }

  onPrevPage(): void {
    this.searchParams$.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      this.store.dispatch(UsersActions.setSearchParams({ 
        payload: { offset: Math.max(0, params.offset - params.limit) } 
      }));
    });
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.store.dispatch(UsersActions.clearSearchParams());
  }
}
