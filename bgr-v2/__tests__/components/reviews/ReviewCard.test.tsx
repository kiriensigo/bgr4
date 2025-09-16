import { render, screen } from '@testing-library/react'
import { ReviewCard } from '@/components/reviews/ReviewCard'

const mockReview = {
  id: 1,
  title: 'Amazing Game!',
  content: 'This is one of the best board games I have ever played. The mechanics are innovative and the artwork is stunning.',
  rating: 9,
  gameId: 1,
  userId: 'user-123',
  isPublished: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  pros: ['Great mechanics', 'Beautiful artwork'],
  cons: ['Long setup time'],
  game: {
    id: 1,
    name: 'Gloomhaven',
    imageUrl: 'https://example.com/gloomhaven.jpg'
  },
  user: {
    id: 'user-123',
    username: 'boardgamer',
    fullName: 'John Doe',
    avatarUrl: 'https://example.com/avatar.jpg'
  }
}

describe('ReviewCard', () => {
  it('renders review information correctly', () => {
    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText('Amazing Game!')).toBeInTheDocument()
    expect(screen.getByText(/This is one of the best board games/)).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('boardgamer')).toBeInTheDocument()
  })

  it('displays star rating', () => {
    render(<ReviewCard review={mockReview} />)
    
    const stars = screen.getAllByTestId('star-icon')
    expect(stars).toHaveLength(10) // 10 stars total
    
    // Check filled stars (rating 9 = 9 filled stars)
    const filledStars = stars.filter(star => 
      star.classList.contains('fill-yellow-400')
    )
    expect(filledStars).toHaveLength(9)
  })

  it('shows pros and cons when available', () => {
    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText('Great mechanics')).toBeInTheDocument()
    expect(screen.getByText('Beautiful artwork')).toBeInTheDocument()
    expect(screen.getByText('Long setup time')).toBeInTheDocument()
  })

  it('handles review without pros/cons', () => {
    const reviewWithoutProsCons = {
      ...mockReview,
      pros: null,
      cons: null
    }
    
    render(<ReviewCard review={reviewWithoutProsCons} />)
    
    expect(screen.getByText('Amazing Game!')).toBeInTheDocument()
    expect(screen.queryByText('良い点')).not.toBeInTheDocument()
    expect(screen.queryByText('気になる点')).not.toBeInTheDocument()
  })

  it('truncates long content with read more button', () => {
    const reviewWithLongContent = {
      ...mockReview,
      content: 'A'.repeat(300) + ' This is a very long review content that should be truncated.'
    }
    
    render(<ReviewCard review={reviewWithLongContent} />)
    
    expect(screen.getByText(/A+\.\.\./)).toBeInTheDocument()
    expect(screen.getByText('続きを読む')).toBeInTheDocument()
  })

  it('displays formatted date', () => {
    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText('2024年1月1日')).toBeInTheDocument()
  })

  it('shows game information when provided', () => {
    render(<ReviewCard review={mockReview} />)
    
    expect(screen.getByText('Gloomhaven')).toBeInTheDocument()
  })

  it('handles missing user avatar', () => {
    const reviewWithoutAvatar = {
      ...mockReview,
      user: {
        ...mockReview.user,
        avatarUrl: null
      }
    }
    
    render(<ReviewCard review={reviewWithoutAvatar} />)
    
    expect(screen.getByText('boardgamer')).toBeInTheDocument()
    // Should show fallback initials
    expect(screen.getByText('JD')).toBeInTheDocument()
  })
})