import { RefObject, useEffect } from 'react';

interface UseClickOutsideOptions {
  capture?: boolean;
}

/**
 * Hook to detect clicks outside a referenced element and trigger a callback.
 * @param ref - React ref to the element to monitor
 * @param onClickOutside - Callback when click outside is detected
 * @param options - Optional settings (capture: use capture phase)
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  options?: UseClickOutsideOptions,
) {
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClickOutside();
      }
    }

    const capture = options?.capture ?? false;
    document.addEventListener('mousedown', handleClickOutside, capture);
    return () => document.removeEventListener('mousedown', handleClickOutside, capture);
  }, [ref, onClickOutside, options?.capture]);
}
