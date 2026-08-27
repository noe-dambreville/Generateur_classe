import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string | undefined;

if (started) app.quit();

function createWindow(): BrowserWindow {
  const rdr = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 1000,
    minHeight: 600,
    autoHideMenuBar: true,
    
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
    },
  });

  if (!app.isPackaged) rdr.webContents.openDevTools();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    rdr.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    rdr.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  rdr.on('closed', () => app.quit());
  return rdr;
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
