import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Countdown } from './Countdown'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

function advanceOneStep() {
  act(() => { vi.advanceTimersByTime(1000) })
}

describe('Countdown', () => {
  it('shows "3" initially', () => {
    render(<Countdown onComplete={vi.fn()} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('counts down to "2" after 1 second', () => {
    render(<Countdown onComplete={vi.fn()} />)
    advanceOneStep()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('counts down to "1" after 2 seconds', () => {
    render(<Countdown onComplete={vi.fn()} />)
    advanceOneStep()
    advanceOneStep()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows "GO!" after 3 seconds', () => {
    render(<Countdown onComplete={vi.fn()} />)
    advanceOneStep()
    advanceOneStep()
    advanceOneStep()
    expect(screen.getByText('GO!')).toBeInTheDocument()
  })

  it('calls onComplete 500ms after showing GO!', () => {
    const onComplete = vi.fn()
    render(<Countdown onComplete={onComplete} />)
    advanceOneStep()
    advanceOneStep()
    advanceOneStep()
    expect(onComplete).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(500) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})
