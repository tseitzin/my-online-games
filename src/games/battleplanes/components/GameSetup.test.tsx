import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GameSetup from './GameSetup';

const renderSetup = (onStartGame = vi.fn()) => {
  const result = render(<GameSetup onStartGame={onStartGame} />);
  return { ...result, onStartGame };
};

describe('GameSetup', () => {
  describe('Initial rendering', () => {
    it('renders "Battle Planes" title', () => {
      renderSetup();
      expect(screen.getByRole('heading', { level: 1, name: 'Battle Planes' })).toBeInTheDocument();
    });

    it('renders subtitle "Defend the skies with lightning power"', () => {
      renderSetup();
      expect(screen.getByText('Defend the skies with lightning power')).toBeInTheDocument();
    });

    it('renders plane icon SVG', () => {
      const { container } = renderSetup();
      // lucide-react renders SVGs; the Plane icon is the first one
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(1);
    });

    it('renders "Game Settings" section header', () => {
      renderSetup();
      expect(screen.getByRole('heading', { level: 2, name: 'Game Settings' })).toBeInTheDocument();
    });

    it('renders settings icon SVG', () => {
      const { container } = renderSetup();
      // Two SVGs: Plane icon and Settings icon
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(2);
    });

    it('renders "Start Battle" button', () => {
      renderSetup();
      expect(screen.getByRole('button', { name: 'Start Battle' })).toBeInTheDocument();
    });

    it('renders instruction about lightning weapon', () => {
      renderSetup();
      expect(screen.getByText('Use your lightning weapon to shoot down enemy fighter jets!')).toBeInTheDocument();
    });

    it('renders "Click or press SPACE to fire" instruction', () => {
      renderSetup();
      expect(screen.getByText('Click or press SPACE to fire')).toBeInTheDocument();
    });
  });

  describe('Plane count selection', () => {
    it('renders three plane count buttons: 10, 15, 20', () => {
      renderSetup();
      expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
    });

    it('default 10 is selected with bg-cyan-500 class', () => {
      renderSetup();
      const button10 = screen.getByRole('button', { name: '10' });
      expect(button10.className).toContain('bg-cyan-500');
    });

    it('clicking 15 button selects it', () => {
      renderSetup();
      const button15 = screen.getByRole('button', { name: '15' });
      fireEvent.click(button15);
      expect(button15.className).toContain('bg-cyan-500');
    });

    it('clicking 20 button selects it', () => {
      renderSetup();
      const button20 = screen.getByRole('button', { name: '20' });
      fireEvent.click(button20);
      expect(button20.className).toContain('bg-cyan-500');
    });

    it('clicking 10 after selecting 20 reverts selection', () => {
      renderSetup();
      const button10 = screen.getByRole('button', { name: '10' });
      const button20 = screen.getByRole('button', { name: '20' });

      fireEvent.click(button20);
      expect(button20.className).toContain('bg-cyan-500');
      expect(button10.className).not.toContain('bg-cyan-500');

      fireEvent.click(button10);
      expect(button10.className).toContain('bg-cyan-500');
      expect(button20.className).not.toContain('bg-cyan-500');
    });
  });

  describe('Duration slider', () => {
    it('shows "Game Duration: 3 minutes" by default', () => {
      renderSetup();
      expect(screen.getByText('Game Duration: 3 minutes')).toBeInTheDocument();
    });

    it('renders range input with min=1, max=6, value=3', () => {
      renderSetup();
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '1');
      expect(slider).toHaveAttribute('max', '6');
      expect(slider).toHaveValue('3');
    });

    it('changing slider to 1 shows "1 minute" (singular)', () => {
      renderSetup();
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '1' } });
      expect(screen.getByText('Game Duration: 1 minute')).toBeInTheDocument();
    });

    it('changing slider to 5 shows "5 minutes" (plural)', () => {
      renderSetup();
      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '5' } });
      expect(screen.getByText('Game Duration: 5 minutes')).toBeInTheDocument();
    });

    it('shows min/max labels "1 min" and "6 min"', () => {
      renderSetup();
      expect(screen.getByText('1 min')).toBeInTheDocument();
      expect(screen.getByText('6 min')).toBeInTheDocument();
    });
  });

  describe('Difficulty selection', () => {
    it('renders three difficulty buttons: easy, medium, hard', () => {
      renderSetup();
      expect(screen.getByRole('button', { name: 'easy' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'medium' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'hard' })).toBeInTheDocument();
    });

    it('default medium is selected with bg-yellow-500 class', () => {
      renderSetup();
      const mediumBtn = screen.getByRole('button', { name: 'medium' });
      expect(mediumBtn.className).toContain('bg-yellow-500');
    });

    it('clicking easy selects it with bg-green-500 class', () => {
      renderSetup();
      const easyBtn = screen.getByRole('button', { name: 'easy' });
      fireEvent.click(easyBtn);
      expect(easyBtn.className).toContain('bg-green-500');
    });

    it('clicking hard selects it with bg-red-500 class', () => {
      renderSetup();
      const hardBtn = screen.getByRole('button', { name: 'hard' });
      fireEvent.click(hardBtn);
      expect(hardBtn.className).toContain('bg-red-500');
    });

    it('medium uses yellow highlight (bg-yellow-500)', () => {
      renderSetup();
      // Click easy first, then back to medium
      const easyBtn = screen.getByRole('button', { name: 'easy' });
      const mediumBtn = screen.getByRole('button', { name: 'medium' });
      fireEvent.click(easyBtn);
      expect(mediumBtn.className).not.toContain('bg-yellow-500');
      fireEvent.click(mediumBtn);
      expect(mediumBtn.className).toContain('bg-yellow-500');
    });
  });

  describe('Start game callback', () => {
    it('calls onStartGame with default config', () => {
      const { onStartGame } = renderSetup();
      fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
      expect(onStartGame).toHaveBeenCalledWith({
        planeCount: 10,
        duration: 3,
        difficulty: 'medium',
      });
    });

    it('passes updated planeCount when changed to 20', () => {
      const { onStartGame } = renderSetup();
      fireEvent.click(screen.getByRole('button', { name: '20' }));
      fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
      expect(onStartGame).toHaveBeenCalledWith({
        planeCount: 20,
        duration: 3,
        difficulty: 'medium',
      });
    });

    it('passes updated duration when slider changed to 5', () => {
      const { onStartGame } = renderSetup();
      fireEvent.change(screen.getByRole('slider'), { target: { value: '5' } });
      fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
      expect(onStartGame).toHaveBeenCalledWith({
        planeCount: 10,
        duration: 5,
        difficulty: 'medium',
      });
    });

    it('passes updated difficulty when changed to hard', () => {
      const { onStartGame } = renderSetup();
      fireEvent.click(screen.getByRole('button', { name: 'hard' }));
      fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
      expect(onStartGame).toHaveBeenCalledWith({
        planeCount: 10,
        duration: 3,
        difficulty: 'hard',
      });
    });

    it('passes combined config when all settings changed', () => {
      const { onStartGame } = renderSetup();
      fireEvent.click(screen.getByRole('button', { name: '15' }));
      fireEvent.change(screen.getByRole('slider'), { target: { value: '4' } });
      fireEvent.click(screen.getByRole('button', { name: 'easy' }));
      fireEvent.click(screen.getByRole('button', { name: 'Start Battle' }));
      expect(onStartGame).toHaveBeenCalledWith({
        planeCount: 15,
        duration: 4,
        difficulty: 'easy',
      });
    });
  });

  describe('Button state visual feedback', () => {
    it('unselected plane count button has bg-slate-700 class', () => {
      renderSetup();
      const button15 = screen.getByRole('button', { name: '15' });
      expect(button15.className).toContain('bg-slate-700');
    });

    it('selected plane count button has scale-105 class', () => {
      renderSetup();
      const button10 = screen.getByRole('button', { name: '10' });
      expect(button10.className).toContain('scale-105');
    });

    it('unselected difficulty button has bg-slate-700 class', () => {
      renderSetup();
      const easyBtn = screen.getByRole('button', { name: 'easy' });
      expect(easyBtn.className).toContain('bg-slate-700');
    });

    it('selected difficulty button has scale-105 class', () => {
      renderSetup();
      const mediumBtn = screen.getByRole('button', { name: 'medium' });
      expect(mediumBtn.className).toContain('scale-105');
    });
  });
});
