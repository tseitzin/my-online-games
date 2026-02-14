import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to false when no localStorage key exists', () => {
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(false);
  });

  it('reads existing true value from localStorage on mount', () => {
    localStorage.setItem('test:darkMode', 'true');
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(true);
  });

  it('reads existing false value from localStorage on mount', () => {
    localStorage.setItem('test:darkMode', 'false');
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(false);
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('test:darkMode', '{not-valid-json');
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(false);
  });

  it('writes to localStorage when darkMode changes', () => {
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    act(() => {
      result.current.setDarkMode(true);
    });
    expect(localStorage.getItem('test:darkMode')).toBe('true');
  });

  it('toggleDarkMode flips from false to true', () => {
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(false);
    act(() => {
      result.current.toggleDarkMode();
    });
    expect(result.current.darkMode).toBe(true);
  });

  it('toggleDarkMode flips from true to false', () => {
    localStorage.setItem('test:darkMode', 'true');
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(true);
    act(() => {
      result.current.toggleDarkMode();
    });
    expect(result.current.darkMode).toBe(false);
  });

  it('uses different storage keys independently', () => {
    localStorage.setItem('golf:darkMode', 'true');
    localStorage.setItem('dots:darkMode', 'false');
    const { result: golf } = renderHook(() => useDarkMode('golf:darkMode'));
    const { result: dots } = renderHook(() => useDarkMode('dots:darkMode'));
    expect(golf.current.darkMode).toBe(true);
    expect(dots.current.darkMode).toBe(false);
  });

  it('handles localStorage.getItem throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage disabled');
    });
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    expect(result.current.darkMode).toBe(false);
  });

  it('handles localStorage.setItem throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage full');
    });
    const { result } = renderHook(() => useDarkMode('test:darkMode'));
    // Should not throw
    act(() => {
      result.current.setDarkMode(true);
    });
    expect(result.current.darkMode).toBe(true);
  });
});
