import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

function ThrowingChild({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>Child content</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Normal rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={false} />
        </ErrorBoundary>
      )
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('does not show error UI when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={false} />
        </ErrorBoundary>
      )
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('Error catching', () => {
    it('shows error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.queryByText('Child content')).not.toBeInTheDocument()
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })

    it('displays "Oops! Something went wrong" heading', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Oops! Something went wrong')
    })

    it('displays error description text', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(
        screen.getByText(
          'The game encountered an unexpected error. You can try reloading the page or resetting the game.'
        )
      ).toBeInTheDocument()
    })

    it('logs error to console.error', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.objectContaining({ componentStack: expect.any(String) })
      )
    })
  })

  describe('Error details in dev mode', () => {
    it('shows "Error Details (Development Only)" summary in dev mode', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.getByText('Error Details (Development Only)')).toBeInTheDocument()
    })

    it('shows error message in details section', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })
  })

  describe('Buttons', () => {
    it('shows "Reload Page" button', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument()
    })

    it('Reload button calls window.location.reload', () => {
      const originalLocation = window.location
      delete window.location
      window.location = { reload: vi.fn() }

      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Reload Page' }))
      expect(window.location.reload).toHaveBeenCalled()

      window.location = originalLocation
    })

    it('shows "Try Again" button when onReset prop provided', () => {
      const onReset = vi.fn()
      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    })

    it('does NOT show "Try Again" button when onReset is not provided', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()
    })
  })

  describe('Reset behavior', () => {
    it('clicking "Try Again" clears error and re-renders children', () => {
      let shouldThrow = true
      function ConditionalThrower() {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Child content</div>
      }

      const onReset = vi.fn()
      render(
        <ErrorBoundary onReset={onReset}>
          <ConditionalThrower />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.queryByText('Child content')).not.toBeInTheDocument()

      // Stop throwing so re-render succeeds
      shouldThrow = false

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))

      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('clicking "Try Again" calls the onReset callback', () => {
      const onReset = vi.fn()
      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge case', () => {
    it('handles error without onReset prop gracefully', () => {
      render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>
      )
      // Error UI should display correctly
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument()
      // No "Try Again" button
      expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument()
      // No crash - the component renders the error UI without issues
    })
  })
})
