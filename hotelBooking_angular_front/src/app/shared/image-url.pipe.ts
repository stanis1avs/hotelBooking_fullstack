import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Приводит путь картинки к адресу, по которому её отдаёт сервер.
 *
 * Сервер возвращает относительный путь вида /uploads/hotels/<hash>.jpg —
 * в разработке фронтенд и API живут на разных портах, поэтому к нему нужен
 * хост; в проде запросы идут через nginx на том же origin, и префикс пустой.
 *
 * Записи, оставшиеся с data-URL, проходят насквозь без изменений.
 */
@Pipe({ name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    if (value.startsWith('data:') || /^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/uploads/')) return `${environment.api.host}${value}`;
    return value;
  }
}
