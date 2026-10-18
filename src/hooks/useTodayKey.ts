import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayKey, type DateKey } from '@/domain/dates';

/**
 * Today's date key that stays correct while the app is open past midnight or comes back from the
 * background on a later day (otherwise "Today" would keep pointing at yesterday).
 */
export function useTodayKey(): DateKey {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      setToday(todayKey());
      clearTimeout(timer);
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(refresh, nextMidnight.getTime() - now.getTime());
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
