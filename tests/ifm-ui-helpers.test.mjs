import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const helpers = require('../src/ifm-ui-helpers.js');
const fileTableTemplate = readFileSync(new URL('../src/templates/filetable.html', import.meta.url), 'utf8');
const tableStyles = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');

test('formatExactDate uses customDateFormat when provided', () => {
  const timestamp = new Date(2026, 2, 31, 12, 4, 27).getTime() / 1000;

  const result = helpers.formatExactDate(timestamp, {
    customDateFormat: '%Y-%m-%d %H:%M:%S',
    locale: 'en-US'
  });

  assert.equal(result, '2026-03-31 12:04:27');
});

test('formatExactDateParts splits locale date and time for compact display', () => {
  const timestamp = new Date(2026, 2, 31, 12, 4, 27).getTime() / 1000;

  const result = helpers.formatExactDateParts(timestamp, {
    locale: 'en-US'
  });

  assert.deepEqual(result, {
    primary: '3/31/2026',
    detail: '12:04:27 PM'
  });
});

test('formatRelativeTime returns human readable relative time', () => {
  const nowMs = Date.UTC(2026, 2, 31, 14, 0, 0);
  const timestamp = (nowMs - (2 * 60 * 60 * 1000)) / 1000;

  const result = helpers.formatRelativeTime(timestamp, {
    nowMs,
    locale: 'en-US'
  });

  assert.equal(result, '2 hours ago');
});

test('formatExactDateParts returns empty values for missing timestamps', () => {
  const result = helpers.formatExactDateParts(undefined, {
    locale: 'en-US'
  });

  assert.deepEqual(result, {
    primary: '',
    detail: ''
  });
});

test('formatRelativeTime returns empty string for missing timestamps', () => {
  const result = helpers.formatRelativeTime(undefined, {
    locale: 'en-US'
  });

  assert.equal(result, '');
});

test('buildRowButtons unifies file actions into a single action rail', () => {
  const result = helpers.buildRowButtons({
    name: 'notes.txt',
    type: 'file',
    ext: 'txt',
    mime_type: 'text/plain',
    downloadAction: 'download'
  }, {
    download: 1,
    zipnload: 1,
    edit: 1,
    extract: 1,
    copymove: 1,
    rename: 1,
    delete: 1,
    disable_mime_detection: 0
  });

  assert.deepEqual(
    result.map((button) => button.action),
    ['edit', 'download', 'copymove', 'rename', 'delete']
  );
});

test('buildRowButtons prefers extract for archive files before download', () => {
  const result = helpers.buildRowButtons({
    name: 'backup.zip',
    type: 'file',
    ext: 'zip',
    mime_type: 'application/zip',
    downloadAction: 'download'
  }, {
    download: 1,
    zipnload: 1,
    edit: 1,
    extract: 1,
    copymove: 1,
    rename: 1,
    delete: 1,
    disable_mime_detection: 0
  });

  assert.deepEqual(
    result.map((button) => button.action),
    ['extract', 'download', 'copymove', 'rename', 'delete']
  );
});

test('getSortBucket keeps parent row first, then directories, then files', () => {
  assert.equal(helpers.getSortBucket({ name: '..', type: 'dir' }), 2);
  assert.equal(helpers.getSortBucket({ name: 'src', type: 'dir' }), 1);
  assert.equal(helpers.getSortBucket({ name: 'README.md', type: 'file' }), 0);
});

test('file action cell does not use uk-table-shrink so icons cannot collapse into the size column', () => {
  assert.match(fileTableTemplate, /<td class="ifm-actions-cell">/);
  assert.doesNotMatch(fileTableTemplate, /<td class="uk-table-shrink ifm-actions-cell">/);
});

test('table styles reserve explicit width for the action column', () => {
  assert.match(
    tableStyles,
    /#filetable th\.th-buttons,\s*\.ifm-actions-cell\s*\{[^}]*width:\s*13rem;[^}]*min-width:\s*13rem;/s
  );
});

test('modal fieldsets reset the browser default frame styling', () => {
  assert.match(
    tableStyles,
    /#ifmmodal fieldset\s*\{[^}]*border:\s*0;[^}]*margin:\s*0;[^}]*padding:\s*0;[^}]*min-inline-size:\s*0;/s
  );
});

test('modal legends reset browser padding so they do not leave frame artifacts', () => {
  assert.match(
    tableStyles,
    /#ifmmodal legend\s*\{[^}]*padding:\s*0;/s
  );
});
