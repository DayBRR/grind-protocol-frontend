import { Pipe, PipeTransform } from '@angular/core';

/** Formats XP values: 1500 → "1.5k", 10000 → "10k", 500 → "500" */
@Pipe({ name: 'xpFormat', standalone: true })
export class XpFormatPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '0';
    if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return value.toString();
  }
}
