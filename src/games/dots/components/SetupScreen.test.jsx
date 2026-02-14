import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SetupScreen from './SetupScreen.jsx'

describe('SetupScreen', () => {
  const renderSetup = (props = {}) =>
    render(<SetupScreen onStartGame={vi.fn()} darkMode={false} {...props} />)

  describe('rendering', () => {
    it('renders "Dots and Boxes" heading', () => {
      renderSetup()
      expect(screen.getByText('Dots and Boxes')).toBeInTheDocument()
    })

    it('renders description text', () => {
      renderSetup()
      expect(
        screen.getByText('Complete boxes by drawing lines. Get a point for each box and take another turn!')
      ).toBeInTheDocument()
    })

    it('renders player count buttons for 2, 3, and 4', () => {
      renderSetup()
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument()
    })

    it('renders grid size input with default value "10"', () => {
      renderSetup()
      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input.value).toBe('10')
    })

    it('renders grid size help text', () => {
      renderSetup()
      expect(
        screen.getByText('Enter 20 to create a 20x20 grid of boxes (Recommended: 10-15)')
      ).toBeInTheDocument()
    })

    it('renders "Player Configuration" heading', () => {
      renderSetup()
      expect(screen.getByText('Player Configuration')).toBeInTheDocument()
    })

    it('renders 2 player cards by default', () => {
      renderSetup()
      const nameInputs = screen.getAllByRole('textbox')
      expect(nameInputs).toHaveLength(2)
      expect(screen.getByDisplayValue('Player 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Player 2')).toBeInTheDocument()
    })

    it('renders Human and Computer buttons for each player', () => {
      renderSetup()
      const humanButtons = screen.getAllByText('Human')
      const computerButtons = screen.getAllByText('Computer')
      expect(humanButtons).toHaveLength(2)
      expect(computerButtons).toHaveLength(2)
    })

    it('renders "Start Game" button', () => {
      renderSetup()
      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument()
    })
  })

  describe('player count changes', () => {
    it('clicking 3 shows 3 player cards', () => {
      renderSetup()
      fireEvent.click(screen.getByRole('button', { name: '3' }))
      const nameInputs = screen.getAllByRole('textbox')
      expect(nameInputs).toHaveLength(3)
      expect(screen.getByDisplayValue('Player 3')).toBeInTheDocument()
    })

    it('clicking 4 shows 4 player cards', () => {
      renderSetup()
      fireEvent.click(screen.getByRole('button', { name: '4' }))
      const nameInputs = screen.getAllByRole('textbox')
      expect(nameInputs).toHaveLength(4)
      expect(screen.getByDisplayValue('Player 4')).toBeInTheDocument()
    })

    it('clicking 2 after 4 removes extra player cards', () => {
      renderSetup()
      fireEvent.click(screen.getByRole('button', { name: '4' }))
      expect(screen.getAllByRole('textbox')).toHaveLength(4)
      fireEvent.click(screen.getByRole('button', { name: '2' }))
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      expect(screen.queryByDisplayValue('Player 3')).not.toBeInTheDocument()
      expect(screen.queryByDisplayValue('Player 4')).not.toBeInTheDocument()
    })

    it('preserves existing player data when increasing count', () => {
      renderSetup()
      // Change Player 1's name to something custom
      const player1Input = screen.getByDisplayValue('Player 1')
      fireEvent.change(player1Input, { target: { value: 'Alice' } })
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()

      // Increase to 3 players
      fireEvent.click(screen.getByRole('button', { name: '3' }))

      // Original players should still be there with their data
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Player 2')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Player 3')).toBeInTheDocument()
    })
  })

  describe('player configuration', () => {
    it('toggling to Computer changes name to "CPU N"', () => {
      renderSetup()
      const computerButtons = screen.getAllByText('Computer')
      fireEvent.click(computerButtons[0]) // Toggle Player 1 to Computer
      expect(screen.getByDisplayValue('CPU 1')).toBeInTheDocument()
    })

    it('toggling back to Human changes name to "Player N"', () => {
      renderSetup()
      const computerButtons = screen.getAllByText('Computer')
      fireEvent.click(computerButtons[0]) // Toggle Player 1 to Computer
      expect(screen.getByDisplayValue('CPU 1')).toBeInTheDocument()

      const humanButtons = screen.getAllByText('Human')
      fireEvent.click(humanButtons[0]) // Toggle Player 1 back to Human
      expect(screen.getByDisplayValue('Player 1')).toBeInTheDocument()
    })

    it('typing in name input updates player name', () => {
      renderSetup()
      const player1Input = screen.getByDisplayValue('Player 1')
      fireEvent.change(player1Input, { target: { value: 'Bob' } })
      expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Player 1')).not.toBeInTheDocument()
    })
  })

  describe('board size', () => {
    it('changing grid size input updates the value', () => {
      renderSetup()
      const gridInput = screen.getByRole('spinbutton')
      fireEvent.change(gridInput, { target: { value: '15' } })
      expect(gridInput.value).toBe('15')
    })
  })

  describe('validation', () => {
    it('shows error when all players are Computer', () => {
      renderSetup()
      const computerButtons = screen.getAllByText('Computer')
      fireEvent.click(computerButtons[0])
      fireEvent.click(computerButtons[1])
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('At least one human player is required')).toBeInTheDocument()
    })

    it('shows error when a player name is empty', () => {
      renderSetup()
      const player1Input = screen.getByDisplayValue('Player 1')
      fireEvent.change(player1Input, { target: { value: '' } })
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('All players must have a name')).toBeInTheDocument()
    })

    it('shows error when a player name is whitespace only', () => {
      renderSetup()
      const player1Input = screen.getByDisplayValue('Player 1')
      fireEvent.change(player1Input, { target: { value: '   ' } })
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('All players must have a name')).toBeInTheDocument()
    })

    it('shows error when grid size is less than 3', () => {
      renderSetup()
      const gridInput = screen.getByRole('spinbutton')
      fireEvent.change(gridInput, { target: { value: '2' } })
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('Grid size must be between 3 and 30')).toBeInTheDocument()
    })

    it('shows error when grid size is greater than 30', () => {
      renderSetup()
      const gridInput = screen.getByRole('spinbutton')
      fireEvent.change(gridInput, { target: { value: '31' } })
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('Grid size must be between 3 and 30')).toBeInTheDocument()
    })

    it('clears error when player count changes', () => {
      renderSetup()
      // Trigger an error first
      const computerButtons = screen.getAllByText('Computer')
      fireEvent.click(computerButtons[0])
      fireEvent.click(computerButtons[1])
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('At least one human player is required')).toBeInTheDocument()

      // Change player count should clear the error
      fireEvent.click(screen.getByRole('button', { name: '3' }))
      expect(screen.queryByText('At least one human player is required')).not.toBeInTheDocument()
    })

    it('clears error when player type is toggled', () => {
      renderSetup()
      // Trigger an error
      const computerButtons = screen.getAllByText('Computer')
      fireEvent.click(computerButtons[0])
      fireEvent.click(computerButtons[1])
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('At least one human player is required')).toBeInTheDocument()

      // Toggle a player back to human should clear the error
      const humanButtons = screen.getAllByText('Human')
      fireEvent.click(humanButtons[0])
      expect(screen.queryByText('At least one human player is required')).not.toBeInTheDocument()
    })

    it('clears error when board size changes', () => {
      renderSetup()
      // Trigger an error
      const gridInput = screen.getByRole('spinbutton')
      fireEvent.change(gridInput, { target: { value: '2' } })
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(screen.getByText('Grid size must be between 3 and 30')).toBeInTheDocument()

      // Change board size should clear the error
      fireEvent.change(gridInput, { target: { value: '10' } })
      expect(screen.queryByText('Grid size must be between 3 and 30')).not.toBeInTheDocument()
    })
  })

  describe('successful start', () => {
    it('calls onStartGame with correct player data', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} darkMode={false} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(onStartGame).toHaveBeenCalledTimes(1)
      const callArgs = onStartGame.mock.calls[0][0]
      expect(callArgs.players).toHaveLength(2)
      expect(callArgs.players[0]).toEqual(
        expect.objectContaining({ name: 'Player 1', isComputer: false })
      )
      expect(callArgs.players[1]).toEqual(
        expect.objectContaining({ name: 'Player 2', isComputer: false })
      )
    })

    it('calls onStartGame with boardSize = input + 1', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} darkMode={false} />)
      // Default grid size is 10, so boardSize should be 11
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(onStartGame.mock.calls[0][0].boardSize).toBe(11)
    })

    it('passes correct boardSize when grid size is changed', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} darkMode={false} />)
      const gridInput = screen.getByRole('spinbutton')
      fireEvent.change(gridInput, { target: { value: '5' } })
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(onStartGame.mock.calls[0][0].boardSize).toBe(6)
    })

    it('does not call onStartGame when validation fails', () => {
      const onStartGame = vi.fn()
      render(<SetupScreen onStartGame={onStartGame} darkMode={false} />)
      // Make all players computer
      const computerButtons = screen.getAllByText('Computer')
      fireEvent.click(computerButtons[0])
      fireEvent.click(computerButtons[1])
      fireEvent.click(screen.getByRole('button', { name: 'Start Game' }))
      expect(onStartGame).not.toHaveBeenCalled()
    })
  })

  describe('dark mode', () => {
    it('applies light theme text color when darkMode is false', () => {
      renderSetup({ darkMode: false })
      const heading = screen.getByText('Dots and Boxes')
      expect(heading.style.color).toBe('rgb(34, 34, 34)')
    })

    it('applies dark theme text color when darkMode is true', () => {
      renderSetup({ darkMode: true })
      const heading = screen.getByText('Dots and Boxes')
      expect(heading.style.color).toBe('rgb(229, 229, 229)')
    })
  })
})
