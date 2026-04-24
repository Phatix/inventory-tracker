import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database.js';

/**
 * Reactive currency symbol from meta store. Defaults to '€'.
 */
export function useCurrency() {
  return (
    useLiveQuery(async () => {
      const row = await db.meta.get('currency');
      return row ? row.value : '€';
    }, [], '€') || '€'
  );
}
