import { describe, it, expect } from 'vitest'
import { store } from '../store'
import { baseApi } from '../api/baseApi'

describe('Redux Store', () => {
  it('should have the correct initial state', () => {
    const state = store.getState()
    expect(state).toBeDefined()
    expect(state[baseApi.reducerPath]).toBeDefined()
  })

  it('should have baseApi reducer registered', () => {
    const state = store.getState()
    expect(state).toHaveProperty(baseApi.reducerPath)
  })

  it('should be able to dispatch actions', () => {
    expect(() => {
      store.dispatch({ type: 'test/action' })
    }).not.toThrow()
  })

  it('should have correct types for RootState', () => {
    const state = store.getState()
    // This is a type check - if it compiles, the test passes
    const _typeCheck: typeof state = state
    expect(_typeCheck).toBeDefined()
  })
})
