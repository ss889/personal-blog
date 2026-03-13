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
const { chatWithOllama, chatForDesign, ensureModelExists } = require('./services/ollama');
const { extractAndApplyFileUpdate, cleanResponseForDisplay, getAllContent, resolveContentPath } = require('./services/content');
const { pushToGitHub } = require('./services/git');
const { transcribeAudio, ensureTempDir } = require('./services/whisper');
const { parseDesignFileResponse, applyDesignChanges } = require('./services/design');

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
 * Renders a markdown content file as a styled HTML preview page
 * @param {string} url - Request URL containing ?file= param
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handlePreviewRequest(url, res) {
  const { remark } = await import('remark');
  const { default: remarkHtml } = await import('remark-html');
  const matter = require('gray-matter');

  const params = new URL(url, 'http://localhost').searchParams;
  const filename = params.get('file');

  if (!filename) {
    res.writeHead(400);
    res.end('Missing ?file= parameter');
    return;
  }

  const files = getAllContent();
  const raw = files[filename];

  if (!raw) {
    res.writeHead(404);
    res.end(`File not found: ${filename}`);
    return;
  }

  const { data, content } = matter(raw);
  const processed = await remark().use(remarkHtml).process(content);
  const bodyHtml = processed.toString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: ${data.title || filename}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f0f; color: #e0e0e0;
      padding: 40px 24px; line-height: 1.7;
    }
    .wrapper { max-width: 720px; margin: 0 auto; }
    .meta { margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #222; }
    .meta h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
    .meta .date { color: #666; font-size: 14px; }
    .meta .excerpt { color: #888; font-size: 15px; margin-top: 8px; }
    .badge {
      display: inline-block; font-size: 11px; background: rgba(59,130,246,0.15);
      color: #60a5fa; padding: 3px 10px; border-radius: 20px; margin-bottom: 12px;
    }
    article h1,h2,h3 { margin: 24px 0 12px; font-weight: 600; }
    article h1 { font-size: 1.6rem; }
    article h2 { font-size: 1.3rem; }
    article h3 { font-size: 1.1rem; }
    article p { margin-bottom: 16px; }
    article ul, article ol { padding-left: 24px; margin-bottom: 16px; }
    article li { margin-bottom: 6px; }
    article code {
      background: #1a1a1a; border: 1px solid #333;
      padding: 2px 6px; border-radius: 4px; font-size: 13px;
    }
    article pre {
      background: #1a1a1a; border: 1px solid #333;
      padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px;
    }
    article blockquote {
      border-left: 3px solid #3b82f6; padding-left: 16px;
      color: #888; margin-bottom: 16px;
    }
    article a { color: #60a5fa; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="meta">
      <span class="badge">Preview — ${filename}</span>
      <h1>${data.title || filename}</h1>
      ${data.date ? `<div class="date">${new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
      ${data.excerpt ? `<div class="excerpt">${data.excerpt}</div>` : ''}
    </div>
    <article>${bodyHtml}</article>
  </div>
</body>
</html>`;

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
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
 * Handles design chat API requests - edits Next.js/CSS files with backup + revert safety
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleDesignChatRequest(req, res) {
  try {
    const { messages, autoPush } = await parseJsonBody(req);
    const rawResponse = await chatForDesign(messages);
    const response = (typeof rawResponse === 'string' && rawResponse) ? rawResponse : '';

    if (!response) {
      sendJson(res, 200, {
        response: 'Ollama did not return a response. Make sure Ollama is running and the model is loaded.',
        filesUpdated: [],
        reverted: false,
        designError: 'Empty response from Ollama',
        pushed: false,
        pushError: null
      });
      return;
    }

    // Parse file changes from LLM response
    const fileChanges = parseDesignFileResponse(response);
    let designResult = { success: false, filesUpdated: [], reverted: false, error: null };

    if (fileChanges.length > 0) {
      designResult = applyDesignChanges(fileChanges);
    } else {
      designResult.error = 'The model did not produce valid code. Try rephrasing — e.g. "Redesign the homepage with a dark hero section and card grid using Tailwind CSS."';
    }

    // Strip code blocks from the displayed response
    const cleanResponse = response.replace(/```[\s\S]*?```\s*/g, '').trim();

    let pushed = false;
    let pushError = null;

    // Auto-push only if changes succeeded
    if (autoPush && designResult.success) {
      const pushResult = pushToGitHub(__dirname);
      pushed = pushResult.pushed;
      pushError = pushResult.error;
    }

    sendJson(res, 200, {
      response: cleanResponse || 'Done!',
      filesUpdated: designResult.filesUpdated,
      reverted: designResult.reverted,
      designError: designResult.error,
      pushed,
      pushError
    });
  } catch (error) {
    console.error('Design chat error:', error.message);
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

  // Route: GET /health - lightweight health check
  if (method === 'GET' && url === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  // Route: GET / - Serve index.html
  if (method === 'GET' && url === '/') {
    handleRootRequest(res);
    return;
  }

  // Route: GET /preview?file=filename - Render a markdown file as HTML preview
  if (method === 'GET' && url.startsWith('/preview')) {
    await handlePreviewRequest(url, res);
    return;
  }

  // Route: GET /static files - Serve CSS, JS, favicon, etc.
  if (method === 'GET' && (url.endsWith('.css') || url.endsWith('.js') || url.endsWith('.ico') || url.endsWith('.svg'))) {
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

  // Route: POST /design-chat - Edit Next.js design files
  if (method === 'POST' && url === '/design-chat') {
    await handleDesignChatRequest(req, res);
    return;
  }

  // 404 for unknown routes
  res.writeHead(404);
  res.end('Not found');
}

// Create HTTP server with top-level safety wrapper
const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('Unhandled request error:', error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: error.message || 'Internal server error' });
    } else {
      res.end();
    }
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

/**
 * Starts the server, then verifies the Ollama model in the background
 */
async function startServer() {
  // Listen immediately so Electron can load the UI right away
  server.listen(PORT, () => {
    console.log(`\n📝 Blog Editor running at http://localhost:${PORT}\n`);
    console.log('Chat with your blog-editor model to update content.');
    console.log('Changes are automatically saved to your markdown files.\n');
  });

  // Check/create the Ollama model after the server is already up
  try {
    await ensureModelExists();
    console.log('✓ Ollama model ready');
  } catch (error) {
    console.error('Warning: Ollama not available -', error.message);
    // Don't exit — server stays up so the UI is still usable
  }
}

// Start the server
startServer();
