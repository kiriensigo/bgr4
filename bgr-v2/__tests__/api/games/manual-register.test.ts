/**
 * @jest-environment node
 */
import { POST } from '@/app/api/games/route'

// NextResponse mock
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, options?: any) => ({
      json: async () => data,
      status: options?.status || 200,
      ok: (options?.status || 200) < 400,
    })),
  },
}))

// Container mock
jest.mock('@/application/container', () => ({
  registerServices: jest.fn(),
  getGameUseCase: jest.fn(),
}))

import { getGameUseCase } from '@/application/container'
import { ConflictError } from '@/domain/errors/DomainErrors'

const mockGetGameUseCase = getGameUseCase as jest.MockedFunction<typeof getGameUseCase>

describe('POST /api/games (manual registration)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('401: x-user-id ヘッダが無い', async () => {
    const req = new Request('http://x/api/games', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ manual_registration: true, game: {} }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('201: 手動登録成功', async () => {
    const toPlainObject = () => ({ id: 10000001, name: '手動', japanese_name: '手動', min_players: 1, max_players: 4 })
    mockGetGameUseCase.mockResolvedValue({
      createGameManually: jest.fn().mockResolvedValue({ toPlainObject }),
    } as any)

    const req = new Request('http://x/api/games', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'u' },
      body: JSON.stringify({
        manual_registration: true,
        game: { name: '手動', japanese_name: '手動', min_players: 1, max_players: 4, play_time: 60 },
      }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(201)
    expect(data.id).toBe(10000001)
    expect(data.min_players).toBe(1)
  })

  it('409: 手動登録の重複（日本語名等）', async () => {
    mockGetGameUseCase.mockResolvedValue({
      createGameManually: jest.fn().mockRejectedValue(new ConflictError('duplicate', { field: 'japanese_name' })),
    } as any)

    const req = new Request('http://x/api/games', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'u' },
      body: JSON.stringify({
        manual_registration: true,
        game: { name: '手動', japanese_name: '手動', min_players: 1, max_players: 4, play_time: 60 },
      }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(409)
    expect(data.code).toBe('CONFLICT')
  })
})

