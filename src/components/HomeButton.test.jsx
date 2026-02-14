import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomeButton from './HomeButton';

function renderHomeButton(props = {}) {
  return render(
    <MemoryRouter>
      <HomeButton {...props} />
    </MemoryRouter>
  );
}

describe('HomeButton', () => {
  it('renders a link pointing to /', () => {
    renderHomeButton();
    const link = screen.getByRole('link', { name: /Home/ });
    expect(link).toHaveAttribute('href', '/');
  });

  it('displays ← Home text', () => {
    renderHomeButton();
    expect(screen.getByText('← Home')).toBeInTheDocument();
  });

  it('has fixed positioning', () => {
    renderHomeButton();
    const link = screen.getByRole('link', { name: /Home/ });
    expect(link.style.position).toBe('fixed');
  });

  it('uses light mode styles by default', () => {
    renderHomeButton();
    const link = screen.getByRole('link', { name: /Home/ });
    expect(link.style.background).toBe('rgb(255, 255, 255)');
    expect(link.style.color).toBe('rgb(26, 32, 44)');
  });

  it('uses light mode styles when darkMode is false', () => {
    renderHomeButton({ darkMode: false });
    const link = screen.getByRole('link', { name: /Home/ });
    expect(link.style.background).toBe('rgb(255, 255, 255)');
  });

  it('uses dark mode styles when darkMode is true', () => {
    renderHomeButton({ darkMode: true });
    const link = screen.getByRole('link', { name: /Home/ });
    expect(link.style.background).toBe('rgb(55, 65, 81)');
    expect(link.style.color).toBe('rgb(229, 229, 229)');
  });

  it('has high z-index for fixed overlay', () => {
    renderHomeButton();
    const link = screen.getByRole('link', { name: /Home/ });
    expect(link.style.zIndex).toBe('1000');
  });
});
