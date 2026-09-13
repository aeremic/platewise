import * as Haptics from 'expo-haptics';

// Haptics are best-effort: ignore failures on devices without a haptic engine.
export const haptics = {
  tap: () => void Haptics.selectionAsync().catch(() => {}),
  success: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  warning: () =>
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
};
