import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'
import { Toast } from '../types'

export function useToast(): { addToast: (message: string, type?: Toast['type']) => void } {
  const { dispatch } = useAppContext()

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = Math.random().toString(36).slice(2)
      dispatch({ type: 'ADD_TOAST', toast: { id, message, type } })
      setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000)
    },
    [dispatch]
  )

  return { addToast }
}
