import { fireEvent, render, screen } from '@testing-library/react';

import { AppStateProvider } from '../../../state/store';
import { Modal } from '../Modal';

// Helper to render Modal with provider
const renderModal = (props: Partial<React.ComponentProps<typeof Modal>> = {}) => {
  const defaultProps = {
    title: 'Test Modal',
    children: <div>Modal Content</div>,
    ...props,
  };
  return render(
    <AppStateProvider>
      <Modal {...defaultProps} />
    </AppStateProvider>,
  );
};

describe('Modal', () => {
  it('should render title and children', () => {
    renderModal({
      title: 'My Modal Title',
      children: <p>Hello World</p>,
    });

    expect(screen.getByText('My Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should apply default width (no inline style when width is 400)', () => {
    renderModal();

    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toHaveAttribute('style');
  });

  it('should apply custom width when provided', () => {
    renderModal({ width: 600 });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveStyle({ width: '600px' });
  });

  it('should call onClose when clicking overlay', () => {
    const onClose = jest.fn();
    const { container } = renderModal({ onClose });

    const overlay = container.querySelector('.modal-overlay');
    fireEvent.click(overlay!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when clicking modal content', () => {
    const onClose = jest.fn();
    renderModal({ onClose });

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not throw when onClose is not provided and overlay is clicked', () => {
    const { container } = renderModal();

    const overlay = container.querySelector('.modal-overlay');
    expect(() => fireEvent.click(overlay!)).not.toThrow();
  });

  it('should render complex children correctly', () => {
    renderModal({
      children: (
        <div>
          <input type="text" placeholder="Enter name" />
          <button>Submit</button>
        </div>
      ),
    });

    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });
});
