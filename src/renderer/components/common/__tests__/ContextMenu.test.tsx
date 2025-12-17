import { fireEvent, render, screen } from '@testing-library/react';

import { ContextMenu, ContextMenuItem } from '../ContextMenu';

// Mock @floating-ui/react
jest.mock('@floating-ui/react', () => ({
  useFloating: () => ({
    floatingStyles: { position: 'absolute', top: 0, left: 0 },
    refs: {
      setFloating: jest.fn(),
      setPositionReference: jest.fn(),
    },
  }),
  offset: jest.fn(),
  flip: jest.fn(),
  shift: jest.fn(),
  autoUpdate: jest.fn(),
}));

describe('ContextMenu', () => {
  const mockOnClose = jest.fn();
  const defaultPosition = { x: 100, y: 200 };

  const defaultItems: ContextMenuItem[] = [
    { label: 'Edit', onClick: jest.fn() },
    { label: 'Delete', onClick: jest.fn() },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render menu items', () => {
    render(<ContextMenu items={defaultItems} position={defaultPosition} onClose={mockOnClose} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onClick and onClose when clicking an enabled item', () => {
    const onClickMock = jest.fn();
    const items: ContextMenuItem[] = [{ label: 'Action', onClick: onClickMock }];

    render(<ContextMenu items={items} position={defaultPosition} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Action'));

    expect(onClickMock).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when clicking a disabled item', () => {
    const onClickMock = jest.fn();
    const items: ContextMenuItem[] = [
      { label: 'Disabled Action', onClick: onClickMock, disabled: true },
    ];

    render(<ContextMenu items={items} position={defaultPosition} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Disabled Action'));

    expect(onClickMock).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should apply disabled class to disabled items', () => {
    const items: ContextMenuItem[] = [
      { label: 'Enabled', onClick: jest.fn() },
      { label: 'Disabled', onClick: jest.fn(), disabled: true },
    ];

    render(<ContextMenu items={items} position={defaultPosition} onClose={mockOnClose} />);

    const enabledItem = screen.getByText('Enabled').closest('.context-menu-item');
    const disabledItem = screen.getByText('Disabled').closest('.context-menu-item');

    expect(enabledItem).not.toHaveClass('disabled');
    expect(disabledItem).toHaveClass('disabled');
  });

  it('should render separator items', () => {
    const items: ContextMenuItem[] = [
      { label: 'First', onClick: jest.fn() },
      { label: '', onClick: jest.fn(), separator: true },
      { label: 'Second', onClick: jest.fn() },
    ];

    const { container } = render(
      <ContextMenu items={items} position={defaultPosition} onClose={mockOnClose} />,
    );

    const separator = container.querySelector('.context-menu-separator');
    expect(separator).toBeInTheDocument();
  });

  it('should close on Escape key press', () => {
    render(<ContextMenu items={defaultItems} position={defaultPosition} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close when clicking outside the menu', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ContextMenu items={defaultItems} position={defaultPosition} onClose={mockOnClose} />
      </div>,
    );

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close when clicking inside the menu', () => {
    const { container } = render(
      <ContextMenu items={defaultItems} position={defaultPosition} onClose={mockOnClose} />,
    );

    const menu = container.querySelector('.context-menu');
    fireEvent.mouseDown(menu!);

    // onClose should not be called from mousedown inside menu
    // (it will be called from click handler on item, but that's different)
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <ContextMenu items={defaultItems} position={defaultPosition} onClose={mockOnClose} />,
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should render with correct context-menu class', () => {
    const { container } = render(
      <ContextMenu items={defaultItems} position={defaultPosition} onClose={mockOnClose} />,
    );

    const menu = container.querySelector('.context-menu');
    expect(menu).toBeInTheDocument();
  });

  it('should handle multiple items correctly', () => {
    const items: ContextMenuItem[] = [
      { label: 'Item 1', onClick: jest.fn() },
      { label: 'Item 2', onClick: jest.fn() },
      { label: 'Item 3', onClick: jest.fn(), disabled: true },
      { label: '', onClick: jest.fn(), separator: true },
      { label: 'Item 4', onClick: jest.fn() },
    ];

    const { container } = render(
      <ContextMenu items={items} position={defaultPosition} onClose={mockOnClose} />,
    );

    const menuItems = container.querySelectorAll('.context-menu-item');
    const separators = container.querySelectorAll('.context-menu-separator');

    expect(menuItems).toHaveLength(4);
    expect(separators).toHaveLength(1);
  });
});
