import styles from './shared.module.css'

export function Spinner({ size = 18 }: { size?: number }): JSX.Element {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      aria-label="Loading…"
    />
  )
}
