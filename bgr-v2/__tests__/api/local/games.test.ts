/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/local/games/route'

// Node.js環境でのテスト（API Routes用）
describe('/api/local/games', () => {
  describe('GET', () => {
    it('ゲーム一覧を正常に取得できる', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
      expect(data.data.length).toBeGreaterThan(0)
      
      // 最初のゲームの構造をチェック
      const firstGame = data.data[0]
      expect(firstGame).toHaveProperty('id')
      expect(firstGame).toHaveProperty('name')
      expect(firstGame).toHaveProperty('year_published')
      expect(firstGame).toHaveProperty('min_players')
      expect(firstGame).toHaveProperty('max_players')
    })

    it('レスポンスヘッダーが正しく設定される', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      
      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('ゲームデータの形式が正しい', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      const data = await response.json()
      
      data.data.forEach((game: any) => {
        expect(typeof game.id).toBe('number')
        expect(typeof game.name).toBe('string')
        expect(game.name.length).toBeGreaterThan(0)
        
        if (game.year_published) {
          expect(typeof game.year_published).toBe('number')
          expect(game.year_published).toBeGreaterThan(1800)
          expect(game.year_published).toBeLessThanOrEqual(new Date().getFullYear())
        }
        
        if (game.min_players) {
          expect(typeof game.min_players).toBe('number')
          expect(game.min_players).toBeGreaterThan(0)
        }
        
        if (game.max_players) {
          expect(typeof game.max_players).toBe('number')
          expect(game.max_players).toBeGreaterThanOrEqual(game.min_players || 1)
        }
        
        if (game.rating_average) {
          expect(typeof game.rating_average).toBe('number')
          expect(game.rating_average).toBeGreaterThanOrEqual(0)
          expect(game.rating_average).toBeLessThanOrEqual(10)
        }
      })
    })

    it('ゲーム配列が適切にソートされている', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      const data = await response.json()
      
      // IDの昇順でソートされているかチェック
      for (let i = 1; i < data.data.length; i++) {
        expect(data.data[i].id).toBeGreaterThan(data.data[i - 1].id)
      }
    })

    it('必須フィールドが全て含まれている', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      const data = await response.json()
      
      const requiredFields = ['id', 'name', 'created_at', 'updated_at']
      
      data.data.forEach((game: any) => {
        requiredFields.forEach(field => {
          expect(game).toHaveProperty(field)
          expect(game[field]).toBeDefined()
          expect(game[field]).not.toBe(null)
        })
      })
    })

    it('配列フィールドが正しい形式である', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      const data = await response.json()
      
      data.data.forEach((game: any) => {
        if (game.mechanics) {
          expect(Array.isArray(game.mechanics)).toBe(true)
          game.mechanics.forEach((mechanic: any) => {
            expect(typeof mechanic).toBe('string')
          })
        }
        
        if (game.categories) {
          expect(Array.isArray(game.categories)).toBe(true)
          game.categories.forEach((category: any) => {
            expect(typeof category).toBe('string')
          })
        }
        
        if (game.designers) {
          expect(Array.isArray(game.designers)).toBe(true)
          game.designers.forEach((designer: any) => {
            expect(typeof designer).toBe('string')
          })
        }
        
        if (game.publishers) {
          expect(Array.isArray(game.publishers)).toBe(true)
          game.publishers.forEach((publisher: any) => {
            expect(typeof publisher).toBe('string')
          })
        }
      })
    })

    it('日付フィールドが有効なISO形式である', async () => {
      const request = new NextRequest('http://localhost:3001/api/local/games')
      const response = await GET(request)
      const data = await response.json()
      
      data.data.forEach((game: any) => {
        expect(new Date(game.created_at)).toBeInstanceOf(Date)
        expect(new Date(game.updated_at)).toBeInstanceOf(Date)
        expect(isNaN(new Date(game.created_at).getTime())).toBe(false)
        expect(isNaN(new Date(game.updated_at).getTime())).toBe(false)
      })
    })

    it('レスポンス時間が適切である', async () => {
      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3001/api/local/games')
      await GET(request)
      const endTime = Date.now()
      
      const responseTime = endTime - startTime
      expect(responseTime).toBeLessThan(1000) // 1秒以内
    })
  })
})