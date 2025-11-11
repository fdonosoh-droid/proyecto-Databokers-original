import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import type { ReactNode } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { createTestStore } from '@/test/test-utils'

describe('Redux Hooks', () => {
  const createWrapper = () => {
    const store = createTestStore()
    return ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    )
  }

  describe('useAppDispatch', () => {
    it('should return dispatch function', () => {
      const { result } = renderHook(() => useAppDispatch(), {
        wrapper: createWrapper(),
      })
      expect(result.current).toBeDefined()
      expect(typeof result.current).toBe('function')
    })

    it('should be able to dispatch actions', () => {
      const { result } = renderHook(() => useAppDispatch(), {
        wrapper: createWrapper(),
      })
      expect(() => {
        result.current({ type: 'test/action' })
      }).not.toThrow()
    })
  })

  describe('useAppSelector', () => {
    it('should return state from selector', () => {
      const { result } = renderHook(
        () => useAppSelector((state) => state),
        { wrapper: createWrapper() }
      )
      expect(result.current).toBeDefined()
    })

    it('should return specific slice of state', () => {
      const { result } = renderHook(
        () => useAppSelector((state) => Object.keys(state)),
        { wrapper: createWrapper() }
      )
      expect(Array.isArray(result.current)).toBe(true)
    })
  })
})
