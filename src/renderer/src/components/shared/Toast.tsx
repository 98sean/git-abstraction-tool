import { useAppContext } from '../../context/AppContext'
import styles from './shared.module.css'

export function ToastContainer(): JSX.Element {
  const { state, dispatch } = useAppContext()

  return (
    <div className={styles.toastContainer} aria-live="polite">
      {state.toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          <span>{toast.message}</span>
          <button
            className={styles.toastClose}
            onClick={() => dispatch({ type: 'REMOVE_TOAST', id: toast.id })}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
