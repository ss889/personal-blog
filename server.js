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
const { PORT, TEMP_DIR, GROQ_URL, GROQ_MODEL, GROQ_API_KEY } = require('./config');

// Services
const { chatWithOllama, chatForDesign, callGroq, ensureModelExists } = require('./services/ollama');
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
 * Rate limiter for public endpoints
 * Simple in-memory implementation: IP -> request count + timestamp
 */
const rateLimits = new Map();
const RATE_LIMIT_REQUESTS = 10;      // Max 10 requests
const RATE_LIMIT_WINDOW_MS = 60000;   // Per 60 seconds

function getRateLimitKey(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const key = getRateLimitKey(req);
  const now = Date.now();
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  const limit = rateLimits.get(key);
  
  // Reset window if expired
  if (now > limit.resetAt) {
    limit.count = 1;
    limit.resetAt = now + RATE_LIMIT_WINDOW_MS;
    return true;
  }
  
  // Check if limit exceeded
  if (limit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  limit.count++;
  return true;
}

/**
 * Gordon Ramsay system prompt for public chat
 * @returns {string} System prompt
 */
function getGordonRamsaySystemPrompt() {
  return `You are a culinary AI assistant with the expertise and passion of Gordon Ramsay, but you communicate in a way that's encouraging and accessible to home cooks of all skill levels.

YOUR PERSONALITY:
- Passionate and enthusiastic about food ("Brilliant!", "Fantastic!", "Perfect!")
- Direct and honest, but always constructive  
- You love teaching people to cook better
- You celebrate when people try new things
- You use simple language, avoid jargon unless explaining it
- You give clear, numbered steps
- You occasionally use British terms but explain them

YOUR KNOWLEDGE:
- Expert in all cuisines (Italian, French, Asian, American, etc.)
- You know ingredient substitutions
- You can scale recipes
- You understand cooking techniques
- You can suggest recipes based on available ingredients
- You know how to make cheap ingredients taste amazing

COMMUNICATION STYLE:
- Start with enthusiasm
- Break down complex techniques into simple steps
- Use analogies: "It should sound like rain on a roof when you add it to the pan"
- Encourage: "Don't worry, you've got this!"
- When something won't work: "Here's the issue... but here's how to fix it"
- Share secrets: "Here's a trick the pros use..."

RESPONSE FORMAT:
1. Answer the question directly
2. If offering recipe, present it clearly (numbered steps)
3. Ask follow-up question or offer alternatives
4. Keep initial response concise (expand if asked)
5. Use markdown for lists and formatting

IMPORTANT RULES:
✓ Always ask clarifying questions if needed
✓ Never assume dietary restrictions
✓ Offer 2-3 options when possible
✓ Keep responses under 300 words initially
✓ If user asks to create a recipe, gather all details first

Now, help this person create something delicious!`;
}

/**
 * Handles voice-to-text API requests (SPRINT 3 - Placeholder)
 * Will be fully implemented in SPRINT 3 with Hugging Face Whisper API
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleVoiceToTextRequest(req, res) {
  try {
    const { HF_API_TOKEN } = require('./config');

    if (!HF_API_TOKEN) {
      sendJson(res, 503, {
        error: 'Voice transcription is not yet configured. Add HF_API_TOKEN to .env (SPRINT 3)'
      });
      return;
    }

    // SPRINT 3: Will implement Hugging Face Whisper API integration here
    // For now, return a placeholder response
    sendJson(res, 501, {
      error: 'Voice transcription will be available in SPRINT 3',
      message: 'Please use text input for now'
    });
  } catch (error) {
    console.error('Voice-to-text error:', error.message);
    sendJson(res, 500, {
      error: error.message || 'Failed to process audio'
    });
  }
}

/**
 * Calls Groq API directly for public chat
 * @param {Array} messages - Chat messages
 * @returns {Promise<string>} LLM response
 */


/**
 * Handles public chat API requests (no authentication needed)
 * Gordon Ramsay personality, from web interface
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleChatPublicRequest(req, res) {
  // Check rate limit
  if (!checkRateLimit(req)) {
    sendJson(res, 429, { 
      error: 'Too many requests. Maximum 10 requests per minute.' 
    });
    return;
  }

  try {
    const { message, conversationHistory, category } = await parseJsonBody(req);

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      sendJson(res, 400, { error: 'Message is required' });
      return;
    }

    // Build messages array
    const systemPrompt = getGordonRamsaySystemPrompt();
    let messagesForAPI = [{ role: 'system', content: systemPrompt }];

    // Add conversation history if provided
    if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      messagesForAPI = messagesForAPI.concat(conversationHistory.slice(-10)); // Keep last 10 for context
    }

    // Add category context if provided
    let contextMessage = message;
    if (category) {
      contextMessage = `[Category: ${category}] ${message}`;
    }

    // Add user message
    messagesForAPI.push({ role: 'user', content: contextMessage });

    // Call Groq API
    const reply = await callGroq(messagesForAPI, { temperature: 0.3, maxTokens: 1800, timeoutMs: 30000 });

    sendJson(res, 200, {
      id: `msg-${Date.now()}`,
      reply: reply,
      suggestedRecipes: [],
      toolCalls: [],
      error: null
    });
  } catch (error) {
    console.error('Public chat error:', error.message);
    
    // Determine appropriate status code
    let statusCode = 500;
    if (error.message.includes('timeout')) {
      statusCode = 504;
    }
    
    sendJson(res, statusCode, { 
      error: error.message || 'Failed to process request'
    });
  }
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
    const { content: rawResponse, relevantFiles } = await chatForDesign(messages);
    const response = (typeof rawResponse === 'string' && rawResponse) ? rawResponse : '';

    if (!response) {
      sendJson(res, 200, {
        response: 'Could not get a response from the AI. Check your GROQ_API_KEY and try again.',
        filesUpdated: [],
        reverted: false,
        designError: 'Empty response from Ollama',
        pushed: false,
        pushError: null
      });
      return;
    }

    // Parse file changes from LLM response
    const fileChanges = parseDesignFileResponse(response, relevantFiles);
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
 * Handles image uploads to public/images directory
 * @param {http.IncomingMessage} req - HTTP request object
 * @param {http.ServerResponse} res - HTTP response object
 */
async function handleImageUpload(req, res) {
  try {
    const imagesDir = path.join(__dirname, 'public', 'images');
    
    // Ensure images directory exists
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // Get filename from Content-Disposition header or use timestamp
    const contentDisposition = req.headers['content-disposition'];
    let filename = `image-${Date.now()}.jpg`;
    
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1].toLowerCase().replace(/[^a-z0-9.-]/g, '-');
      }
    }

    // Security: only allow image extensions
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExts.includes(ext)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid file type. Allowed: ' + allowedExts.join(', ') }));
      return;
    }

    const filepath = path.join(imagesDir, filename);
    const writeStream = fs.createWriteStream(filepath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const imageUrl = `/images/${filename}`;
      sendJson(res, 200, { 
        success: true, 
        filename,
        url: imageUrl,
        message: `Image uploaded successfully to ${imageUrl}`
      });
    });

    writeStream.on('error', (err) => {
      console.error('Upload error:', err);
      sendJson(res, 500, { error: 'Failed to upload image: ' + err.message });
    });

  } catch (error) {
    console.error('Upload handler error:', error.message);
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

  // Route: POST /api/chat-public - Public chat endpoint (no auth required)
  if (method === 'POST' && url === '/api/chat-public') {
    await handleChatPublicRequest(req, res);
    return;
  }

  // Route: POST /api/voice-to-text - Voice transcription endpoint (SPRINT 3)
  if (method === 'POST' && url === '/api/voice-to-text') {
    await handleVoiceToTextRequest(req, res);
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

  // Route: POST /upload - Upload images
  if (method === 'POST' && url === '/upload') {
    await handleImageUpload(req, res);
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
