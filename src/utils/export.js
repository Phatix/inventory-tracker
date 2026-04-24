/**
 * Export / import helpers — wraps the DB dump in browser file I/O.
 */

import { dumpDatabase, restoreDatabase } from '../db/database.js';

export async function exportToJsonFile() {
  const dump = await dumpDatabase();
  const json = JSON.stringify(dump, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-tracker-backup-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return dump;
}

export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Datei ist kein gültiges JSON.'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export async function importFromJsonFile(file) {
  const payload = await readJsonFile(file);
  if (payload.app && payload.app !== 'inventory-tracker') {
    throw new Error(`Backup stammt von einer fremden App: ${payload.app}`);
  }
  await restoreDatabase(payload);
  return payload;
}
