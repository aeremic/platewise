import { useEffect, useRef, useState, type RefObject } from 'react';
import { Keyboard, Platform, TextInput, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

const MARGIN = 24;

/**
 * Keeps the focused field above the keyboard in an Android form sheet. There the sheet doesn't move
 * or shrink for the keyboard at a full-height detent (edge-to-edge window), and the ScrollView's
 * `automaticallyAdjustKeyboardInsets` is iOS-only, so on smaller phones the lower fields ended up
 * under the keyboard with nothing to scroll. Returns the keyboard height to add as bottom padding
 * and an `onScroll` to pass to the ScrollView. Does nothing on iOS.
 */
export function useAndroidKeyboardInset(scrollRef: RefObject<ScrollView | null>) {
  const [inset, setInset] = useState(0);
  const keyboardTop = useRef(0);
  const offset = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setInset(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // After the padding is laid out (there is room to scroll now), lift the focused field if it's covered.
  useEffect(() => {
    if (inset === 0) return;
    const frame = requestAnimationFrame(() => {
      TextInput.State.currentlyFocusedInput()?.measureInWindow((_x, y, _width, height) => {
        const covered = y + height + MARGIN - keyboardTop.current;
        if (covered > 0) scrollRef.current?.scrollTo({ y: offset.current + covered, animated: true });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [inset, scrollRef]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  };

  return { inset, onScroll };
}
