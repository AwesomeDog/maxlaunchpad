import type { ChangeEvent, KeyboardEvent, ReactElement } from 'react';

import { IS_MAC } from '../../platform';
import { useAppState, useDispatch } from '../../state/store';

const SEARCH_SHORTCUT = IS_MAC ? 'Cmd+F' : 'Ctrl+F';

export function SearchBox(): ReactElement {
  const state = useAppState();
  const dispatch = useDispatch();

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value });
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleClear = () => {
    dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
    document.getElementById('search-input')?.focus();
  };

  return (
    <div className="menu-item menu-search" style={{ position: 'relative' }}>
      <input
        id="search-input"
        className="menu-search-input"
        placeholder={`Search (${SEARCH_SHORTCUT})`}
        value={state.ui.searchQuery}
        onChange={handleSearchChange}
        onKeyDown={handleSearchKeyDown}
        style={{ paddingRight: '28px' }}
      />
      {state.ui.searchQuery && (
        <span onClick={handleClear} className="search-clear-btn">
          <span className="search-clear-icon" />
          <span className="search-clear-icon" style={{ transform: 'rotate(-45deg)' }} />
        </span>
      )}
    </div>
  );
}
