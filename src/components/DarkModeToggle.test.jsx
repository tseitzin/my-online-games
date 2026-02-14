import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DarkModeToggle from './DarkModeToggle';

describe('DarkModeToggle', () => {
  it('shows Dark text when darkMode is false', () => {
    render(<DarkModeToggle darkMode={false} onToggle={() => {}} />);
    expect(screen.getByText(/Dark/)).toBeInTheDocument();
  });

  it('shows Light text when darkMode is true', () => {
    render(<DarkModeToggle darkMode={true} onToggle={() => {}} />);
    expect(screen.getByText(/Light/)).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<DarkModeToggle darkMode={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has fixed positioning at top-right', () => {
    render(<DarkModeToggle darkMode={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.style.position).toBe('fixed');
    expect(button.style.right).toBe('16px');
  });

  it('uses light mode styles when darkMode is false', () => {
    render(<DarkModeToggle darkMode={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.style.background).toBe('rgb(255, 255, 255)');
    expect(button.style.color).toBe('rgb(26, 32, 44)');
  });

  it('uses dark mode styles when darkMode is true', () => {
    render(<DarkModeToggle darkMode={true} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.style.background).toBe('rgb(55, 65, 81)');
    expect(button.style.color).toBe('rgb(251, 191, 36)');
  });

  it('has high z-index for fixed overlay', () => {
    render(<DarkModeToggle darkMode={false} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button.style.zIndex).toBe('1000');
  });
});
