import { addDatabaseChangeListener } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import type { TableName } from '@/db/client';

/**
 * Runs `load` and re-runs it whenever any of `tables` changes.
 * Unlike Drizzle's useLiveQuery this also reacts to joined tables
 * (e.g. recoloring a category refreshes day colors).
 *
 * `key` must change whenever `load` would return different data.
 */
export function useLiveData<T>(
  load: () => Promise<T>,
  tables: readonly TableName[],
  key: string,
): { data: T | undefined; error: Error | undefined } {
  const [state, setState] = useState<{ key: string; data: T | undefined; error: Error | undefined }>({
    key,
    data: undefined,
    error: undefined,
  });

  const tablesKey = tables.join(',');

  useEffect(() => {
    let cancelled = false;
    let pending: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      load().then(
        (data) => !cancelled && setState({ key, data, error: undefined }),
        (error: Error) => !cancelled && setState((s) => ({ ...s, key, error })),
      );
    };

    // The change hook fires once per row; coalesce bursts into one reload.
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (!tablesKey.split(',').includes(tableName)) return;
      clearTimeout(pending);
      pending = setTimeout(run, 16);
    });

    run();
    return () => {
      cancelled = true;
      clearTimeout(pending);
      subscription.remove();
    };
    // `load` is intentionally keyed by `key` rather than identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tablesKey]);

  // Don't show stale data from a previous key (e.g. last month's colors).
  return state.key === key ? state : { data: undefined, error: undefined };
}
