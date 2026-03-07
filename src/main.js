const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const https = require('https');
const http  = require('http');

// ══════════════════════════════════════
// WINDOW
// ══════════════════════════════════════
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 800,
    minHeight: 560,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0d0d0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ══════════════════════════════════════
// AE PATH AUTO-DETECTION
// ══════════════════════════════════════
ipcMain.handle('detect-ae-paths', () => {
  const platform = process.platform;
  const found = [];

  const years = ['2025', '2024', '2023', '2022'];

  if (platform === 'darwin') {
    for (const year of years) {
      const p = `/Applications/Adobe After Effects ${year}/Scripts/ScriptUI Panels`;
      if (fs.existsSync(p)) found.push({ year, path: p });
    }
  } else if (platform === 'win32') {
    const drives = ['C:', 'D:'];
    for (const drive of drives) {
      for (const year of years) {
        const p = `${drive}\\Program Files\\Adobe\\Adobe After Effects ${year}\\Support Files\\Scripts\\ScriptUI Panels`;
        if (fs.existsSync(p)) found.push({ year, path: p });
      }
    }
  }

  return found;
});

// ══════════════════════════════════════
// SETTINGS (stored as JSON in userData)
// ══════════════════════════════════════
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
const installedPath = path.join(app.getPath('userData'), 'installed.json');

ipcMain.handle('load-settings', () => {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch { return {}; }
});

ipcMain.handle('save-settings', (_, data) => {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('load-installed', () => {
  try {
    return JSON.parse(fs.readFileSync(installedPath, 'utf8'));
  } catch { return {}; }
});

ipcMain.handle('save-installed', (_, data) => {
  fs.writeFileSync(installedPath, JSON.stringify(data, null, 2));
  return true;
});

// ══════════════════════════════════════
// FILE DOWNLOAD & INSTALL
// ══════════════════════════════════════
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'AELauncher/1.0' } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Fetch registry JSON
ipcMain.handle('fetch-registry', async (_, url) => {
  try {
    const buf  = await fetchUrl(url + '?t=' + Date.now());
    return { ok: true, data: JSON.parse(buf.toString('utf8')) };
  } catch(err) {
    return { ok: false, error: err.message };
  }
});

// Install script: download → write directly to AE Scripts folder
ipcMain.handle('install-script', async (_, { script, installDir }) => {
  try {
    // Ensure directory exists
    if (!fs.existsSync(installDir)) {
      return { ok: false, error: `フォルダが見つかりません:\n${installDir}` };
    }

    const buf = await fetchUrl(script.download_url);

    const fileName = script.file_name || (script.download_url.split('/').pop().split('?')[0]);
    const destPath = path.join(installDir, fileName);

    fs.writeFileSync(destPath, buf);

    return { ok: true, path: destPath };
  } catch(err) {
    return { ok: false, error: err.message };
  }
});

// Uninstall: delete file
ipcMain.handle('uninstall-script', (_, { filePath }) => {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return { ok: true };
  } catch(err) {
    return { ok: false, error: err.message };
  }
});

// Browse folder dialog
ipcMain.handle('browse-folder', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    title: 'AEのScriptsフォルダを選択'
  });
  return result.canceled ? null : result.filePaths[0];
});

// Open folder in Finder/Explorer
ipcMain.handle('open-folder', (_, folderPath) => {
  shell.openPath(folderPath);
});

// Get app version
ipcMain.handle('get-version', () => app.getVersion());
