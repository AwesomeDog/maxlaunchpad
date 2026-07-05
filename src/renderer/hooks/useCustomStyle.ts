import { useEffect, useRef } from 'react';

import i18n from '../i18n';
import { useAppState, useDispatch } from '../state/store';

const CUSTOM_STYLE_ID = 'custom-style';
const CUSTOM_STYLE_CLASS_PREFIX = 'custom-style-';

function toCustomStyleClassName(customStyle: string | undefined): string | undefined {
  const styleName = customStyle
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return styleName ? `${CUSTOM_STYLE_CLASS_PREFIX}${styleName}` : undefined;
}

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

    const styleClassName = toCustomStyleClassName(customStyle);
    if (styleClassName) {
      document.body.classList.add(styleClassName);
    }

    const existingStyle = document.getElementById(CUSTOM_STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }

    if (!customStyle) {
      return () => {
        if (styleClassName) {
          document.body.classList.remove(styleClassName);
        }
      };
    }

    let isCancelled = false;

    async function loadStyle() {
      try {
        const { content } = await window.electronAPI.loadStyleContent(customStyle!);
        if (content && !isCancelled) {
          const styleElement = document.createElement('style');
          styleElement.id = CUSTOM_STYLE_ID;
          styleElement.textContent = content;
          document.head.appendChild(styleElement);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }
        const message =
          error instanceof Error
            ? i18n.t('errors.failedToLoadCustomStyleWithMessage', { message: error.message })
            : i18n.t('errors.failedToLoadCustomStyle');
        dispatch({ type: 'SET_ERROR', error: message });
      }
    }

    void loadStyle();

    return () => {
      isCancelled = true;
      if (styleClassName) {
        document.body.classList.remove(styleClassName);
      }
      const styleElement = document.getElementById(CUSTOM_STYLE_ID);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [customStyle, dispatch]);
}
