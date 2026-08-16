import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Подписи пагинатора по умолчанию английские — «Items per page», «of».
 * Остальной интерфейс на русском, поэтому переопределяем их глобально,
 * а не в каждой странице со списком.
 */
export function russianPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Строк на странице';
  intl.nextPageLabel = 'Следующая страница';
  intl.previousPageLabel = 'Предыдущая страница';
  intl.firstPageLabel = 'Первая страница';
  intl.lastPageLabel = 'Последняя страница';

  intl.getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) return '0 из 0';
    const total = Math.max(length, 0);
    const start = page * pageSize;
    // Последняя страница почти всегда неполная — иначе получилось бы «41–50 из 43».
    const end = Math.min(start + pageSize, total);
    return `${start + 1}–${end} из ${total}`;
  };

  return intl;
}
