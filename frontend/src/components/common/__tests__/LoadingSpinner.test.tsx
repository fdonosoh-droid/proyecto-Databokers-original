import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with default message', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Cargando datos..." />)
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument()
  })

  it('renders CircularProgress component', () => {
    const { container } = render(<LoadingSpinner />)
    const circularProgress = container.querySelector('.MuiCircularProgress-root')
    expect(circularProgress).toBeInTheDocument()
  })

  it('does not render message when empty string is provided', () => {
    render(<LoadingSpinner message="" />)
    expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
  })

  it('has correct default styling', () => {
    const { container } = render(<LoadingSpinner />)
    const box = container.firstChild
    expect(box).toBeInTheDocument()
  })
})
