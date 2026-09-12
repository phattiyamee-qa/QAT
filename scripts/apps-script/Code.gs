/**
 * DRAFT — onEdit push trigger for the PMO Task Tracker sync.
 * See README.md in this folder before wiring this to the real spreadsheet.
 *
 * Must be installed as an INSTALLABLE trigger (Edit > Current project's triggers),
 * not left as a simple onEdit(e) — simple triggers cannot make UrlFetchApp calls.
 */

const TRACKED_SHEETS = [
  'Payment', 'Platform', 'Credit', 'Insurance', 'AS', 'MS', 'Foms', 'DP/LS'
];

// Column that holds a stable per-row ID. Adjust once confirmed per tab —
// row position alone is not safe (rows can be inserted/reordered).
const ID_COLUMN_NAME = 'Row ID';

function onEditTrigger(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  if (TRACKED_SHEETS.indexOf(sheetName) === -1) return;

  const props = PropertiesService.getScriptProperties();
  const webhookUrl = props.getProperty('WEBHOOK_URL');
  const sharedSecret = props.getProperty('SHARED_SECRET');

  if (!webhookUrl || !sharedSecret) {
    throw new Error('WEBHOOK_URL / SHARED_SECRET script properties not set.');
  }

  const editedRow = e.range.getRow();
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues()[0];

  const rowObject = {};
  headerRow.forEach((header, i) => {
    rowObject[header] = rowValues[i];
  });

  const stableId = rowObject[ID_COLUMN_NAME] || `${sheetName}:row${editedRow}`;

  const payload = {
    tab: sheetName,
    rowRef: stableId,
    row: rowObject,
    editedAt: new Date().toISOString(),
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Sync-Secret': sharedSecret,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
}
