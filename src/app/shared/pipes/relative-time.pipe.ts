import { Pipe, PipeTransform } from '@angular/core';

/** Formats a date string into a relative label: "2 hours ago", "Yesterday", "3 days ago" */
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const date  = new Date(value);
    const now   = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH   = Math.floor(diffMs / 3_600_000);
    const diffD   = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffH   < 24) return `${diffH}h ago`;
    if (diffD   === 1) return 'Yesterday';
    if (diffD   < 7)  return `${diffD} days ago`;
    return date.toLocaleDateString();
  }
}
