import { ChangeDetectorRef, Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Api, ManagerReservationDto } from '../../core/api';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-manager-reservations',
  imports: [DatePipe, MatButtonModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './manager-reservations.html',
})
export class ManagerReservations {
  readonly displayedColumns = ['hotel', 'room', 'user', 'phone', 'dateStart', 'dateEnd', 'actions'];
  reservations: ManagerReservationDto[] = [];
  loading = false;

  constructor(private readonly api: Api, private readonly snackBar: MatSnackBar, private readonly cdr: ChangeDetectorRef) {
    this.loadReservations();
  }

  loadReservations() {
    this.loading = true;
    this.api.getManagerReservations({ offset: 0, limit: 100 }).subscribe({
      next: (items) => { 
        this.reservations = items; 
        this.loading = false; 
        this.cdr.detectChanges(); 
      },
      error: () => { 
        this.loading = false; 
        this.cdr.detectChanges(); 
        this.snackBar.open('Ошибка загрузки броней', 'OK', { duration: 3000 }); 
      },
    });
  }

  delete(id: string) {
    this.api.deleteManagerReservation(id).subscribe({
      next: () => {
        this.snackBar.open('Бронирование удалено', 'OK', { duration: 3000 });
        this.loadReservations();
      },
      error: () => this.snackBar.open('Ошибка удаления', 'OK', { duration: 3000 }),
    });
  }
}
