import React from 'react'
import styles from './FloatingPanel.module.css'

interface Props {
  children: React.ReactNode
  onClose: () => void
}

export function FloatingPanel({ children, onClose }: Props): JSX.Element {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.panel}>{children}</div>
    </>
  )
}
