const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  storage: {
    read: (f) => ipcRenderer.invoke('storage:read', f),
    write: (f, d) => ipcRenderer.invoke('storage:write', f, d),
    settings: () => ipcRenderer.invoke('storage:read', 'settings.json'),
    progress: () => ipcRenderer.invoke('storage:read', 'progress.json')
  },
  win: {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close')
  },
  player: {
    togglePause: () => ipcRenderer.send('player:togglePause'),
    forcePlay: () => ipcRenderer.send('player:forcePlay'),
    injectProgressTracker: () => ipcRenderer.send('player:injectProgressTracker'),
    injectCustomScrollbars: () => ipcRenderer.send('player:injectCustomScrollbars'),
    clearCache: () => ipcRenderer.invoke('player:clearCache'),
    clearAllCache: () => ipcRenderer.invoke('player:clearAllCache')
  },
  onWindowState: (cb) => ipcRenderer.on('window:state', (_e, max) => cb(max)),
  onFullScreen: (cb) => ipcRenderer.on('win:fullscreen', (_e, full) => cb(full)),
});
