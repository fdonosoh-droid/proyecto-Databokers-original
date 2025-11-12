import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders with default props', () => {
    render(<EmptyState />)
    expect(screen.getByText('No hay datos')).toBeInTheDocument()
    expect(screen.getByText('No se encontraron elementos para mostrar')).toBeInTheDocument()
  })

  it('renders with custom title and message', () => {
    render(
      <EmptyState
        title="Sin resultados"
        message="No se encontraron proyectos"
      />
    )
    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    expect(screen.getByText('No se encontraron proyectos')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const handleClick = vi.fn()
    render(
      <EmptyState
        action={{
          label: 'Crear nuevo',
          onClick: handleClick,
        }}
      />
    )
    const button = screen.getByRole('button', { name: 'Crear nuevo' })
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <EmptyState
        action={{
          label: 'Crear nuevo',
          onClick: handleClick,
        }}
      />
    )
    const button = screen.getByRole('button', { name: 'Crear nuevo' })
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders default icon', () => {
    const { container } = render(<EmptyState />)
    const icon = container.querySelector('.MuiSvgIcon-root')
    expect(icon).toBeInTheDocument()
  })
})
