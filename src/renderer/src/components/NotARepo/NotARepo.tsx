import { useState } from 'react'
import { useTerms } from '../../hooks/useTerms'
import styles from './NotARepo.module.css'

interface Props {
  projectPath: string
  onInit: () => Promise<void>
}

export function NotARepo({ projectPath, onInit }: Props): JSX.Element {
  const t = useTerms()
  const [loading, setLoading] = useState(false)

  const handleInit = async (): Promise<void> => {
    setLoading(true)
    try {
      await onInit()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.icon}>📂</div>
      <h2 className={styles.title}>{t.notARepoTitle}</h2>
      <p className={styles.desc}>{t.notARepoDesc}</p>
      <code className={styles.path}>{projectPath}</code>
      <button className={styles.initBtn} onClick={handleInit} disabled={loading}>
        {loading ? 'Setting up…' : t.initRepoBtn}
      </button>
    </div>
  )
}
