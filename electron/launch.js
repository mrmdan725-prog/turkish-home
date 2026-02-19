import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const electronPath = path.join(__dirname, '../node_modules/electron/dist/electron.exe');
const appPath = path.join(__dirname, '../');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
delete env.ELECTRON_NO_ASAR;

console.log('Launching Electron from:', electronPath);
console.log('App path:', appPath);

const child = spawn(electronPath, [appPath], {
    env,
    stdio: 'inherit',
    shell: true
});

child.on('close', (code) => {
    process.exit(code);
});
