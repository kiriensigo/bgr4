import { cn } from '@/lib/utils'

describe('lib/utils', () => {
  describe('cn (className utility)', () => {
    it('クラス名を正しく結合する', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('条件付きクラス名を正しく処理する', () => {
      expect(cn('base', true && 'active', false && 'inactive')).toBe('base active')
    })

    it('undefined や null を適切に処理する', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end')
    })

    it('オブジェクト形式のクラス名を処理する', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })

    it('配列形式のクラス名を処理する', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    it('Tailwindのクラス名重複を適切に処理する', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('複雑な組み合わせを正しく処理する', () => {
      const result = cn(
        'base-class',
        'p-4',
        {
          'text-red-500': true,
          'bg-blue-500': false,
        },
        'text-blue-500', // これが優先される
        ['flex', 'items-center']
      )
      expect(result).toBe('base-class p-4 text-blue-500 flex items-center')
    })
  })
})