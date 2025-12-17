import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';
import { useEffect, useLayoutEffect, useRef } from 'react';

import { useClickOutside } from '../../hooks/useClickOutside';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const { floatingStyles, refs } = useFloating({
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({ fallbackPlacements: ['top-start', 'bottom-end', 'top-end'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    refs.setPositionReference({
      getBoundingClientRect() {
        return {
          x: position.x,
          y: position.y,
          top: position.y,
          left: position.x,
          bottom: position.y,
          right: position.x,
          width: 0,
          height: 0,
        };
      },
    });
  }, [position.x, position.y, refs]);

  useClickOutside(menuRef, onClose, { capture: true });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={(node) => {
        menuRef.current = node;
        refs.setFloating(node);
      }}
      className="context-menu"
      style={floatingStyles}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="context-menu-separator" />;
        }
        return (
          <div
            key={index}
            className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
