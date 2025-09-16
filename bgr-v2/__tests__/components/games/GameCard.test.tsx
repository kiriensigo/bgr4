import { render, screen } from '@testing-library/react'
import { GameCard } from '@/components/games/GameCard'

const mockGame = {
  id: 1,
  name: 'Gloomhaven',
  description: 'Epic dungeon-crawling board game',
  year_published: 2017,
  min_players: 1,
  max_players: 4,
  playing_time: 120,
  image_url: 'https://example.com/gloomhaven.jpg',
  thumbnail_url: 'https://example.com/gloomhaven-thumb.jpg',
  bgg_id: 174430,
  mechanics: ['Cooperative Play', 'Hand Management'],
  categories: ['Adventure', 'Fantasy'],
  designers: ['Isaac Childres'],
  publishers: ['Cephalofair Games'],
  rating_average: 8.8,
  rating_count: 50000,
  created_at: '2024-01-01T00:00:00Z'
}

describe('GameCard', () => {
  it('renders game information correctly', () => {
    render(<GameCard game={mockGame} />)
    
    expect(screen.getByText('Gloomhaven')).toBeInTheDocument()
    expect(screen.getByText('2017年')).toBeInTheDocument()
    expect(screen.getByText('1-4人')).toBeInTheDocument()
    expect(screen.getByText('2時間')).toBeInTheDocument()
  })

  it('displays rating when available', () => {
    render(<GameCard game={mockGame} />)
    
    expect(screen.getByText('8.8')).toBeInTheDocument()
  })

  it('displays placeholder when no image', () => {
    const gameWithoutImage = { ...mockGame, image_url: null, thumbnail_url: null }
    render(<GameCard game={gameWithoutImage} />)
    
    const image = screen.getByRole('img')
    expect(image).toHaveAttribute('src', expect.stringContaining('placeholder-game.jpg'))
  })

  it('renders long descriptions with line-clamp class', () => {
    const longDescription = 'This is a very long description that should be truncated with the line-clamp class to limit the number of visible lines in the UI component.'
    const gameWithLongDescription = {
      ...mockGame,
      description: longDescription,
      categories: [] // Remove categories to avoid conflicts
    }
    
    render(<GameCard game={gameWithLongDescription} />)
    
    // Check that the description is rendered and has line-clamp class
    const description = screen.getByText(longDescription)
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('line-clamp-3')
  })

  it('renders without description', () => {
    const gameWithoutDescription = { ...mockGame, description: null }
    render(<GameCard game={gameWithoutDescription} />)
    
    expect(screen.getByText('Gloomhaven')).toBeInTheDocument()
    // Description section should not be rendered when description is null
    expect(screen.queryByText(/説明がありません/)).not.toBeInTheDocument()
  })

  it('handles missing optional fields gracefully', () => {
    const minimalGame = {
      id: 1,
      name: 'Minimal Game',
      min_players: 2,
      max_players: 4,
      bgg_id: 12345,
      categories: [],
      mechanics: [],
      designers: [],
      publishers: [],
      created_at: '2024-01-01T00:00:00Z'
    }
    
    render(<GameCard game={minimalGame} />)
    
    expect(screen.getByText('Minimal Game')).toBeInTheDocument()
    expect(screen.getByText('2-4人')).toBeInTheDocument()
  })
})