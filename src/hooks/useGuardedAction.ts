import { useRef, useState } from 'react';
import { Alert } from 'react-native';

import { haptics } from '@/lib/haptics';

/**
 * Runs a write (save/remove) at most once at a time — a fast double tap can't insert twice — and
 * tells the user when it fails instead of failing silently. `pending` can disable the button.
 */
export function useGuardedAction() {
  const running = useRef(false);
  const [pending, setPending] = useState(false);

  const run = async (action: () => Promise<void>, failureMessage = 'Your changes were not saved. Please try again.') => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    try {
      await action();
    } catch (error) {
      console.warn(error);
      haptics.warning();
      Alert.alert('Something went wrong', failureMessage);
    } finally {
      running.current = false;
      setPending(false);
    }
  };

  return { pending, run };
}
