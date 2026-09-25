import { formatLocalIsoDate, buildLocalIsoDate } from './date-utils';

describe('DateUtils (AUD-06 Timezone Safety)', () => {
  it('should format a local midnight date to YYYY-MM-DD without previous day UTC shift', () => {
    // Construct a Date at local midnight
    const localMidnight = new Date(2026, 8, 1, 0, 0, 0, 0); // Sept 1, 2026
    const formatted = formatLocalIsoDate(localMidnight);
    expect(formatted).toBe('2026-09-01');
  });

  it('should build local ISO date from year, monthIndex, and day', () => {
    const iso = buildLocalIsoDate(2026, 8, 1); // Sept 1, 2026
    expect(iso).toBe('2026-09-01');
  });
});
