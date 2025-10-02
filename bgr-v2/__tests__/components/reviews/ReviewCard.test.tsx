import { render, screen } from '@testing-library/react'
import { formatDistanceToNow } from 'date-fns'
import { ReviewCard, type ReviewCardProps } from '@/components/reviews/ReviewCard'

jest.mock('date-fns', () => {
  const actual = jest.requireActual('date-fns')
  return {
    ...actual,
    formatDistanceToNow: jest.fn(() => '1日前'),
  }
})

const formatDistanceToNowMock = formatDistanceToNow as jest.MockedFunction<typeof formatDistanceToNow>

const baseReview: ReviewCardProps['review'] = {
  id: '1',
  title: 'Amazing Game!',
  content:
    'This is one of the best board games I have ever played. The mechanics are innovative and the artwork is stunning.',
  rating: 9,
  rule_complexity: 4,
  luck_factor: 2,
  interaction: 5,
  downtime: 2,
  pros: ['Great mechanics', 'Beautiful artwork'],
  cons: ['Long setup time'],
  categories: ['Strategy'],
  mechanics: ['Deck Building'],
  recommended_player_counts: [2, 3, 4],
  created_at: '2024-01-01T00:00:00Z',
  user: {
    username: 'boardgamer',
    full_name: 'Board Gamer',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  game: {
    name: 'Gloomhaven',
    japanese_name: null,
    image_url: 'https://example.com/gloomhaven.jpg',
    bgg_id: '224517',
    id: 1,
    description: 'Epic dungeon crawling game',
    year_published: 2017,
    min_players: 1,
    max_players: 4,
    playing_time: 120,
  },
  profiles: undefined,
  games: undefined,
}

const createReview = (
  overrides: Partial<ReviewCardProps['review']> = {},
): ReviewCardProps['review'] => ({
  ...baseReview,
  ...overrides,
  game: {
    ...baseReview.game,
    ...(overrides.game ?? {}),
  },
  user: {
    ...baseReview.user,
    ...(overrides.user ?? {}),
  },
})

const renderReviewCard = (
  reviewOverrides?: Partial<ReviewCardProps['review']>,
  componentOverrides?: Partial<Omit<ReviewCardProps, 'review'>>,
) => {
  const review = createReview(reviewOverrides)
  return render(<ReviewCard review={review} {...componentOverrides} />)
}

describe('ReviewCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    formatDistanceToNowMock.mockReturnValue('1日前')
  })

  it('renders core review information', () => {
    renderReviewCard()

    expect(screen.getByText('Amazing Game!')).toBeInTheDocument()
    expect(screen.getByText(/one of the best board games/i)).toBeInTheDocument()
    expect(screen.getByText('9.0')).toBeInTheDocument()
    expect(screen.getByText('Board Gamer')).toBeInTheDocument()
  })

  it('renders star rating with filled icons', () => {
    renderReviewCard()

    const ratingValue = screen.getByText('9.0')
    const starContainer = ratingValue.previousElementSibling as HTMLElement | null

    expect(starContainer).not.toBeNull()

    const starIcons = starContainer!.querySelectorAll('svg')
    expect(starIcons).toHaveLength(5)
    starIcons.forEach((icon) => {
      expect(icon.classList.contains('fill-yellow-400')).toBe(true)
    })
  })

  it('shows pros and cons for detailed variant', () => {
    renderReviewCard(undefined, { variant: 'detailed' })

    expect(screen.getByText('Great mechanics')).toBeInTheDocument()
    expect(screen.getByText('Beautiful artwork')).toBeInTheDocument()
    expect(screen.getByText('Long setup time')).toBeInTheDocument()
  })

  it('omits pros and cons when not provided', () => {
    renderReviewCard({ pros: null, cons: null }, { variant: 'detailed' })

    expect(screen.queryByText('Great mechanics')).not.toBeInTheDocument()
    expect(screen.queryByText('Long setup time')).not.toBeInTheDocument()
  })

  it('applies maxContentLines styling', () => {
    renderReviewCard(undefined, { maxContentLines: 2 })

    const contentElement = screen.getByText(/one of the best board games/i)
    expect(contentElement).toHaveClass('line-clamp-2')
    expect(contentElement).toHaveStyle({ WebkitLineClamp: '2' })
  })

  it('displays formatted relative created date', () => {
    renderReviewCard()

    expect(formatDistanceToNowMock).toHaveBeenCalled()
    const callArgs = formatDistanceToNowMock.mock.calls[0]
    expect(callArgs[0]).toEqual(new Date(baseReview.created_at))
    expect(callArgs[1]).toMatchObject({ addSuffix: true })
    expect(screen.getByText('1日前')).toBeInTheDocument()
  })

  it('shows game information when provided', () => {
    renderReviewCard()

    expect(screen.getByText('Gloomhaven')).toBeInTheDocument()
  })

  it('uses fallback initial when avatar is missing', () => {
    renderReviewCard({ user: { avatar_url: undefined } })

    expect(screen.getByText(/^B$/)).toBeInTheDocument()
  })
})
