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
            webSecurity: false // Disabled to allow CORS requests (Supabase, AI, etc.)
        },
        title: "البيت التركي - نسخة سطح المكتب",
        autoHideMenuBar: true
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools({ mode: 'detach' });
        console.log('Loaded development URL');
    } else {
        // Production: Load from file system
        // Use loadFile for better path handling
        const indexHtml = path.join(__dirname, '../dist/index.html');
        console.log('Loading production file:', indexHtml);

        win.loadFile(indexHtml).catch(e => {
            console.error('Failed to load file:', e);
        });

        // Remove menu in production
        win.setMenu(null);
    }

    win.on('closed', () => {
        console.log('Window closed');
    });
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
