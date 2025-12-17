import { useEffect, useRef } from 'react';

import { useAppState, useDispatch } from '../state/store';

const CUSTOM_STYLE_ID = 'custom-style';

export function useCustomStyle() {
  const state = useAppState();
  const dispatch = useDispatch();
  const customStyle = state.settings?.customStyle;
  const previousStyleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousStyleRef.current === customStyle) {
      return;
    }
    previousStyleRef.current = customStyle;

    const existingStyle = document.getElementById(CUSTOM_STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }

    if (!customStyle) {
      return;
    }

    async function loadStyle() {
      try {
        const { content } = await window.electronAPI.loadStyleContent(customStyle!);
        if (content) {
          const styleElement = document.createElement('style');
          styleElement.id = CUSTOM_STYLE_ID;
          styleElement.textContent = content;
          document.head.appendChild(styleElement);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? `Failed to load custom style: ${error.message}`
            : 'Failed to load custom style';
        dispatch({ type: 'SET_ERROR', error: message });
      }
    }

    void loadStyle();

    return () => {
      const styleElement = document.getElementById(CUSTOM_STYLE_ID);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [customStyle, dispatch]);
}
