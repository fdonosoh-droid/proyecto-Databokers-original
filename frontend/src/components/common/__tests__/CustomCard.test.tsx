import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import CustomCard from '../CustomCard'

describe('CustomCard', () => {
  it('renders children correctly', () => {
    render(
      <CustomCard>
        <div>Test Content</div>
      </CustomCard>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(
      <CustomCard title="Card Title">
        <div>Content</div>
      </CustomCard>
    )
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(
      <CustomCard title="Title" subtitle="Subtitle text">
        <div>Content</div>
      </CustomCard>
    )
    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('does not render CardHeader when title and subtitle are not provided', () => {
    const { container } = render(
      <CustomCard>
        <div>Content</div>
      </CustomCard>
    )
    const cardHeader = container.querySelector('.MuiCardHeader-root')
    expect(cardHeader).not.toBeInTheDocument()
  })

  it('renders actions when provided', () => {
    render(
      <CustomCard
        actions={
          <button>Action Button</button>
        }
      >
        <div>Content</div>
      </CustomCard>
    )
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
  })

  it('does not render CardActions when actions are not provided', () => {
    const { container } = render(
      <CustomCard>
        <div>Content</div>
      </CustomCard>
    )
    const cardActions = container.querySelector('.MuiCardActions-root')
    expect(cardActions).not.toBeInTheDocument()
  })

  it('applies custom sx prop', () => {
    const { container } = render(
      <CustomCard sx={{ backgroundColor: 'red' }}>
        <div>Content</div>
      </CustomCard>
    )
    const card = container.querySelector('.MuiCard-root')
    expect(card).toBeInTheDocument()
  })
})
