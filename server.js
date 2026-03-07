/**
 * Blog Editor Server
 * HTTP server for the blog editing application
 * 
 * Responsibilities:
 * - Serves static files (HTML, CSS, JS)
 * - Handles chat API requests to Ollama
 * - Handles audio transcription requests
 * - Handles git push operations
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const { PORT, TEMP_DIR } = require('./config');

// Services
const { chatWithOllama, ensureModelExists } = require('./services/ollama');
const { extractAndApplyFileUpdate, cleanResponseForDisplay } = require('./services/content');
const { pushToGitHub } = require('./services/git');
const { transcribeAudio, ensureTempDir } = require('./services/whisper');

// Ensure temp directory exists
ensureTempDir();

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/**
 * Serves a static file from the public directory
 * @param {string} filePath - Path to the file
 * @param {http.ServerResponse} res - HTTP response object
 */
function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
}

/**
 * Handles the root path request - serves index.html
 * @param {http.ServerResponse} res - HTTP response object
 */
function handleRootRequest(res) {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  serveStaticFile(indexPath, res);
}

/**
 * Handles static file requests from /public
 * @param {string} url - Request URL
 * @param {http.ServerResponse} res - HTTP response object
 */
function handleStaticRequest(url, res) {
  const filePath = path.join(__dirname, 'public', url);
  serveStaticFile(filePath, res);
}

/**
 * Parses JSON from request body
 * @param {http.IncomingMessage} req - HTTP request object
 * @returns {Promise<Object>} Parsed JSON body
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Collects request body as a buffer
 * @param {http.IncomingMessage} req - HTTP request object
 * @returns {Promise<Buffer>} Request body buffer
 */
function collectRequestBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Sends a JSON response
 * @param {http.ServerResponse} res - HTTP response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - Data to send as JSON
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Handles chat API requests
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleChatRequest(req, res) {
  try {
    const { messages, autoPush } = await parseJsonBody(req);
    const response = await chatWithOllama(messages);
    const fileUpdated = extractAndApplyFileUpdate(response);
    const cleanResponse = cleanResponseForDisplay(response);

    let pushed = false;
    let pushError = null;

    // Auto-push if enabled and file was updated
    if (autoPush && fileUpdated) {
      const pushResult = pushToGitHub(__dirname);
      pushed = pushResult.pushed;
      pushError = pushResult.error;
    }

    sendJson(res, 200, {
      response: cleanResponse || 'Done!',
      fileUpdated,
      pushed,
      pushError
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    sendJson(res, 500, { error: error.message });
  }
}

/**
 * Handles manual push API requests
 * @param {http.ServerResponse} res - HTTP response object
 */
function handlePushRequest(res) {
  const result = pushToGitHub(__dirname);
  
  if (result.success) {
    sendJson(res, 200, { success: true });
  } else {
    sendJson(res, 500, { success: false, error: result.error });
  }
}

/**
 * Handles audio transcription requests
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleTranscribeRequest(req, res) {
  try {
    const buffer = await collectRequestBuffer(req);
    
    // Extract boundary from content-type header
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    
    if (!boundaryMatch) {
      sendJson(res, 400, { error: 'No boundary found in multipart request' });
      return;
    }
    
    const result = await transcribeAudio(buffer, boundaryMatch[1]);
    sendJson(res, 200, result);
  } catch (error) {
    console.error('Transcription error:', error);
    sendJson(res, 500, { error: error.message });
  }
}

/**
 * Main request router
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleRequest(req, res) {
  const { method, url } = req;

  // Route: GET / - Serve index.html
  if (method === 'GET' && url === '/') {
    handleRootRequest(res);
    return;
  }

  // Route: GET /static files - Serve CSS, JS, etc.
  if (method === 'GET' && (url.endsWith('.css') || url.endsWith('.js') || url.endsWith('.ico'))) {
    handleStaticRequest(url, res);
    return;
  }

  // Route: POST /chat - Chat with LLM
  if (method === 'POST' && url === '/chat') {
    await handleChatRequest(req, res);
    return;
  }

  // Route: POST /push - Manual git push
  if (method === 'POST' && url === '/push') {
    handlePushRequest(res);
    return;
  }

  // Route: POST /transcribe - Audio transcription
  if (method === 'POST' && url === '/transcribe') {
    await handleTranscribeRequest(req, res);
    return;
  }

  // 404 for unknown routes
  res.writeHead(404);
  res.end('Not found');
}

// Create HTTP server
const server = http.createServer(handleRequest);

/**
 * Starts the server
 */
async function startServer() {
  try {
    await ensureModelExists();
    
    server.listen(PORT, () => {
      console.log(`\n📝 Blog Editor running at http://localhost:${PORT}\n`);
      console.log('Chat with your blog-editor model to update content.');
      console.log('Changes are automatically saved to your markdown files.\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
