/* eslint-disable react-refresh/only-export-components */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

function GameWrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>
}

export function renderWithRouter(ui) {
  return render(ui, { wrapper: GameWrapper })
}
