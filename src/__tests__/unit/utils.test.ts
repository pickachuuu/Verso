import { cn } from '@/lib/utils'

describe('cn (classname merge utility)', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes with clsx', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('merges Tailwind classes intelligently', () => {
    // tailwind-merge should resolve conflicting utilities
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('handles conflicting Tailwind colors', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('preserves non-conflicting Tailwind classes', () => {
    expect(cn('px-4 py-2', 'mt-4')).toBe('px-4 py-2 mt-4')
  })

  it('handles undefined and null inputs', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('handles empty arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles object syntax for conditional classes', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500')
  })

  it('combines multiple merge strategies', () => {
    const result = cn(
      'base-class',
      'p-4',
      { 'font-bold': true, hidden: false },
      'p-8' // should override p-4
    )
    expect(result).toBe('base-class font-bold p-8')
  })
})
