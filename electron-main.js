/**
 * Blog Editor Electron Main Process
 * Desktop application wrapper for the blog editor
 */

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

// Application Configuration
const APP_CONFIG = {
  width: 1200,
  height: 800,
  title: 'Blog Editor',
  serverStartupTimeout: 8000,
  serverPort: 3001
};

/** @type {BrowserWindow|null} */
let mainWindow = null;

/** @type {ChildProcess|null} */
let serverProcess = null;

/**
 * Path to the server entry point
 * @returns {string} Absolute path to server.js
 */
function getServerPath() {
  return path.join(__dirname, 'server.js');
}

/**
 * Path to the application icon
 * @returns {string} Absolute path to favicon.ico
 */
function getIconPath() {
  return path.join(__dirname, 'public', 'favicon.ico');
}

/**
 * URL for the local server
 * @returns {string} Server URL
 */
function getServerUrl() {
  return `http://localhost:${APP_CONFIG.serverPort}`;
}

/**
 * Checks whether the local server is reachable
 * @returns {Promise<boolean>}
 */
function isServerReachable() {
  return new Promise((resolve) => {
    const req = http.get(getServerUrl(), (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(1200, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Waits until the server responds or timeout is reached
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
async function waitForServerReady(timeoutMs) {
  const start = Date.now();
  while ((Date.now() - start) < timeoutMs) {
    if (await isServerReachable()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

/**
 * Starts the Node.js server as a child process
 * @returns {Promise<void>} Resolves when server is ready
 */
function startServer() {
  return new Promise(async (resolve) => {
    if (await isServerReachable()) {
      console.log('Server already running, reusing existing process');
      resolve();
      return;
    }

    serverProcess = spawn('node', [getServerPath()], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Server: ${output}`);
      
      // Resolve immediately when we see the server is ready
      if (output.includes('running at')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Server process failed to start:', error.message);
      resolve();
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Fallback timeout in case 'running at' message is missed
    setTimeout(resolve, APP_CONFIG.serverStartupTimeout);
  });
}

/**
 * Stops the server process if running
 */
function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

/**
 * Creates the main application window
 * @returns {BrowserWindow} The created window
 */
function createMainWindow() {
  const window = new BrowserWindow({
    width: APP_CONFIG.width,
    height: APP_CONFIG.height,
    title: APP_CONFIG.title,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Show an immediate loading screen for faster perceived startup
  window.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
    <!doctype html>
    <html>
      <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0b1020;color:#e5e7eb;font-family:Segoe UI,Arial,sans-serif;">
        <div style="text-align:center;opacity:.9;">
          <div style="font-size:18px;font-weight:600;margin-bottom:8px;">Launching Blog Editor…</div>
          <div style="font-size:13px;color:#9ca3af;">Starting local server</div>
        </div>
      </body>
    </html>
  `));

  // Open external links in the default browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Clean up reference on close
  window.on('closed', () => {
    mainWindow = null;
  });

  return window;
}

/**
 * Initializes the application - starts server and creates window
 */
async function initializeApp() {
  mainWindow = createMainWindow();
  await startServer();

  const ready = await waitForServerReady(APP_CONFIG.serverStartupTimeout);
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (ready) {
      mainWindow.loadURL(getServerUrl());
    } else {
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!doctype html>
        <html>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#0b1020;color:#e5e7eb;font-family:Segoe UI,Arial,sans-serif;">
            <div style="max-width:560px;text-align:center;padding:24px;">
              <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Could not reach local server</div>
              <div style="font-size:13px;color:#9ca3af;line-height:1.5;">Try closing other app instances and relaunching. If needed, run <code>npm run editor</code> manually.</div>
            </div>
          </body>
        </html>
      `));
    }
  }
}

// Application lifecycle handlers
app.whenReady().then(initializeApp);

app.on('window-all-closed', () => {
  stopServer();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    initializeApp();
  }
});

app.on('before-quit', () => {
  stopServer();
});
