/**
 * @jest-environment node
 */
import { POST } from '@/app/api/reviews/route'

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

jest.mock('@/application/container', () => ({
  registerServices: jest.fn(),
  getReviewUseCase: jest.fn(),
}))

import { getReviewUseCase } from '@/application/container'
import { ConflictError } from '@/domain/errors/DomainErrors'

const mockGetReviewUseCase = getReviewUseCase as jest.MockedFunction<typeof getReviewUseCase>

describe('POST /api/reviews', () => {
  beforeEach(() => jest.clearAllMocks())

  it('401: x-user-id が無い', async () => {
    const req = new Request('http://x/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ game_id: 1, title: 't', content: 'c' }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('201: 投稿成功', async () => {
    const created = { id: 9, title: 't', content: 'c', overallScore: 7, gameId: 1 }
    mockGetReviewUseCase.mockResolvedValue({ createReview: jest.fn().mockResolvedValue(created) } as any)

    const req = new Request('http://x/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'u' },
      body: JSON.stringify({ game_id: 1, title: 't', content: 'c', ratings: { overall: 7 } }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(201)
    expect(data.id).toBe(9)
    expect(data.title).toBe('t')
  })

  it('409: 重複（同一内容）', async () => {
    mockGetReviewUseCase.mockResolvedValue({
      createReview: jest.fn().mockRejectedValue(new ConflictError('duplicate', { existingReviewId: 7 })),
    } as any)

    const req = new Request('http://x/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'u' },
      body: JSON.stringify({ game_id: 1, title: 't', content: 'c' }),
    }) as any
    const res = await POST(req)
    const data = await (res as any).json()
    expect(res.status).toBe(409)
    expect(data.code).toBe('CONFLICT')
  })
})

