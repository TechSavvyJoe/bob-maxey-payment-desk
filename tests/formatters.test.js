import test from 'node:test';
import assert from 'node:assert/strict';
import { formatShortDate, parseShortDate } from '../src/lib/formatters.js';

test('short dates preserve the ISO calendar day and always use MM/DD/YY', () => {
  for (const [iso, display] of [
    ['2026-09-24', '09/24/26'],
    ['2026-01-01', '01/01/26'],
    ['2028-02-29', '02/29/28'],
    ['2000-02-29', '02/29/00'],
    ['2099-12-31', '12/31/99'],
  ]) {
    assert.equal(formatShortDate(iso), display);
    assert.deepEqual(parseShortDate(display), { value: iso });
  }
});

test('short date input rejects impossible dates and ambiguous formats', () => {
  for (const draft of ['', '02/29/26', '04/31/26', '13/01/26', '00/24/26', '09/00/26', '09/31/26', '9/24/26', '09/24/2026', '2026-09-24', '09-24-26', 'date']) {
    const parsed = parseShortDate(draft);
    assert.equal(parsed.value, undefined, draft);
    assert.match(parsed.error, /MM\/DD\/YY/, draft);
  }
  for (const iso of ['2026-02-29', '2026-13-01', '2026-04-31', '09/24/26']) {
    assert.throws(() => formatShortDate(iso), RangeError, iso);
  }
});
