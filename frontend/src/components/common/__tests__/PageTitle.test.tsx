import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import PageTitle from '../PageTitle'

describe('PageTitle', () => {
  it('renders title correctly', () => {
    render(<PageTitle title="Proyectos" />)
    expect(screen.getByRole('heading', { name: 'Proyectos' })).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<PageTitle title="Proyectos" subtitle="Gestiona tus proyectos inmobiliarios" />)
    expect(screen.getByText('Gestiona tus proyectos inmobiliarios')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    const { container } = render(<PageTitle title="Proyectos" />)
    const subtitles = container.querySelectorAll('[class*="MuiTypography-body1"]')
    expect(subtitles.length).toBe(0)
  })

  it('renders action button when provided', () => {
    const handleClick = vi.fn()
    render(
      <PageTitle
        title="Proyectos"
        action={{
          label: 'Crear Proyecto',
          onClick: handleClick,
        }}
      />
    )
    const button = screen.getByRole('button', { name: 'Crear Proyecto' })
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick when button is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <PageTitle
        title="Proyectos"
        action={{
          label: 'Crear Proyecto',
          onClick: handleClick,
        }}
      />
    )
    const button = screen.getByRole('button', { name: 'Crear Proyecto' })
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders action button with icon when provided', () => {
    const handleClick = vi.fn()
    const TestIcon = <span data-testid="test-icon">+</span>
    render(
      <PageTitle
        title="Proyectos"
        action={{
          label: 'Crear Proyecto',
          onClick: handleClick,
          icon: TestIcon,
        }}
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('does not render action button when not provided', () => {
    render(<PageTitle title="Proyectos" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
