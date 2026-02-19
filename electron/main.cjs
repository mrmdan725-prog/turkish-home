const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    console.log('Creating Window...');
    const isDev = !app.isPackaged;

    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../build/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        title: "البيت التركي - نسخة سطح المكتب",
    });

    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    console.log('Loading start URL:', startUrl);
    win.loadURL(startUrl);

    if (isDev) {
        win.webContents.openDevTools({ mode: 'detach' });
    }

    win.setMenu(null);
}

app.whenReady().then(() => {
    console.log('App Ready');
    createWindow();
}).catch(err => {
    console.error('App failed to start:', err);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
