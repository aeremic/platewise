type Listener = (categoryId: number) => void;

const listeners = new Set<Listener>();

/**
 * Lets a screen react to a category created on another screen, e.g. the day sheet
 * auto-selects a category the user just created from its "New category" link.
 */
export const categoryEvents = {
  emitCreated(categoryId: number) {
    listeners.forEach((listener) => listener(categoryId));
  },
  onCreated(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
