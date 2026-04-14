import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { loadLocalEnv } from './config/env'
import { registerIpcHandlers } from './ipc'
import { startWatchingAllProjects, stopAllWatchers } from './watcher'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in the default browser, not the app window
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  loadLocalEnv()
  registerIpcHandlers()
  startWatchingAllProjects()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopAllWatchers()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
