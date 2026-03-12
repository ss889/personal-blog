/**
 * Blog Editor Electron Main Process
 * Desktop application wrapper for the blog editor
 */

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
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
 * Starts the Node.js server as a child process
 * @returns {Promise<void>} Resolves when server is ready
 */
function startServer() {
  return new Promise((resolve) => {
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

  // Load the server URL
  window.loadURL(getServerUrl());

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
  await startServer();
  mainWindow = createMainWindow();
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
