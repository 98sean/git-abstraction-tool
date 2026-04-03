import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Expose electron APIs to the renderer process via contextBridge.
// Additional IPC channels will be added here as features are built out.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (defined in index.d.ts)
  window.electron = electronAPI
}
