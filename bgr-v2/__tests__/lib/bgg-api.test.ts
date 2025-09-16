import { parseBGGResponse, validateBGGData } from '@/lib/bgg-api'

describe('BGG API Utils', () => {
  describe('parseBGGResponse', () => {
    it('should parse valid BGG XML response', () => {
      const mockXMLData = {
        items: {
          item: [{
            $: { id: '174430' },
            name: [{ $: { value: 'Gloomhaven' } }],
            description: ['Epic board game'],
            yearpublished: [{ $: { value: '2017' } }],
            minplayers: [{ $: { value: '1' } }],
            maxplayers: [{ $: { value: '4' } }],
            playingtime: [{ $: { value: '120' } }],
            image: ['https://example.com/image.jpg']
          }]
        }
      }

      const result = parseBGGResponse(mockXMLData)

      expect(result).toEqual([{
        id: 174430,
        name: 'Gloomhaven',
        description: 'Epic board game',
        yearPublished: 2017,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 120,
        imageUrl: 'https://example.com/image.jpg'
      }])
    })

    it('should handle empty response', () => {
      const mockXMLData = { items: {} }
      const result = parseBGGResponse(mockXMLData)
      expect(result).toEqual([])
    })

    it('should handle malformed data gracefully', () => {
      const mockXMLData = {
        items: {
          item: [{
            $: { id: 'invalid' },
            name: [{ $: { value: 'Test Game' } }]
          }]
        }
      }

      const result = parseBGGResponse(mockXMLData)
      expect(result).toEqual([])
    })
  })

  describe('validateBGGData', () => {
    it('should validate correct BGG data', () => {
      const validData = {
        id: 174430,
        name: 'Gloomhaven',
        yearPublished: 2017,
        minPlayers: 1,
        maxPlayers: 4,
        playingTime: 120
      }

      expect(validateBGGData(validData)).toBe(true)
    })

    it('should reject invalid data', () => {
      const invalidData = {
        id: 'invalid',
        name: '',
        yearPublished: 'not-a-number'
      }

      expect(validateBGGData(invalidData)).toBe(false)
    })

    it('should reject data with missing required fields', () => {
      const incompleteData = {
        name: 'Test Game'
      }

      expect(validateBGGData(incompleteData)).toBe(false)
    })
  })
})