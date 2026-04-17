import { invokeDb } from '../../ipc'
import styles from './GitNotInstalled.module.css'

interface Props {
  onRetry: () => void
}

export function GitNotInstalled({ onRetry }: Props): JSX.Element {
  const openGitDownload = (): void => {
    invokeDb('shell:openExternal', 'https://git-scm.com/downloads').catch(console.error)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.icon}>⚙️</div>
        <h1 className={styles.title}>Git is not installed</h1>
        <p className={styles.description}>
          This app requires Git to be installed on your computer. Git is a free tool used to
          track and manage your files.
        </p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span>
              Download and install Git from{' '}
              <button className={styles.link} onClick={openGitDownload}>
                git-scm.com/downloads
              </button>
            </span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span>Run the installer and keep the default options</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span>Restart this app once the installation is complete</span>
          </div>
        </div>

        <button className={styles.retryBtn} onClick={onRetry}>
          I've installed Git — check again
        </button>
      </div>
    </div>
  )
}
