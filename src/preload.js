const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ae', {
  detectAePaths:   ()       => ipcRenderer.invoke('detect-ae-paths'),
  loadSettings:    ()       => ipcRenderer.invoke('load-settings'),
  saveSettings:    (data)   => ipcRenderer.invoke('save-settings', data),
  loadInstalled:   ()       => ipcRenderer.invoke('load-installed'),
  saveInstalled:   (data)   => ipcRenderer.invoke('save-installed', data),
  fetchRegistry:   (url)    => ipcRenderer.invoke('fetch-registry', url),
  installScript:   (args)   => ipcRenderer.invoke('install-script', args),
  uninstallScript: (args)   => ipcRenderer.invoke('uninstall-script', args),
  browseFolder:    ()       => ipcRenderer.invoke('browse-folder'),
  openFolder:      (p)      => ipcRenderer.invoke('open-folder', p),
  getVersion:      ()       => ipcRenderer.invoke('get-version'),
});
