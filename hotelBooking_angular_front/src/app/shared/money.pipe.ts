import { Pipe, PipeTransform } from '@angular/core';

/** 14600 → «14 600 ₽». Отдельный пайп, чтобы формат был одинаковым везде. */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return `${Math.round(value).toLocaleString('ru-RU')} ₽`;
  }
}
