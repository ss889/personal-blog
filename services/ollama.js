/**
 * Ollama LLM Service Module
 * Handles communication with the Ollama API for blog content generation
 */

const fs = require('fs');
const path = require('path');
const { OLLAMA_URL, MODEL_NAME } = require('../config');
const { getAllContent, getContentFileList, formatContentForPrompt } = require('./content');
const { formatDesignFilesForPrompt, DESIGN_FILES } = require('./design');

let cachedDesignModel = null;
let cachedDesignModelAt = 0;

async function getAvailableModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

/**
 * Builds the system prompt for the blog editor
 * @returns {string} System prompt with current content context
 */
function buildSystemPrompt() {
  const currentContent = getAllContent();
  const fileList = getContentFileList();
  const contentSection = formatContentForPrompt(currentContent);
  const today = new Date().toISOString().split('T')[0];

  return `You are a blog content editor. Your job is to EDIT and MODIFY existing content based on user requests.

CURRENT FILES AND THEIR CONTENT:
${contentSection}

CRITICAL FORMAT - Always respond with the EDITED file content like this:

\`\`\`markdown
FILE: filename
---
title: The Title
date: "${today}"
excerpt: Brief description
---

Your edited markdown content here.
\`\`\`

RULES:
1. When user asks to change/edit/update a file, MODIFY the existing content - don't create new files
2. If user mentions "homepage", edit the homepage file
3. If user mentions a post name, edit that specific post
4. For NEW posts only, create a new filename (use lowercase-with-dashes)
5. Always include proper frontmatter with title, date (${today}), and excerpt
6. Output the COMPLETE edited file content
7. After the code block, briefly explain what you changed

Available files to edit: ${fileList.join(', ')}`;
}

/**
 * Chat message format
 * @typedef {Object} ChatMessage
 * @property {string} role - Message role: 'user', 'assistant', or 'system'
 * @property {string} content - Message content
 */

/**
 * Sends a chat request to the Ollama API
 * @param {ChatMessage[]} messages - Chat history
 * @returns {Promise<string>} LLM response content
 */
async function chatWithOllama(messages) {
  const systemPrompt = buildSystemPrompt();

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: fullMessages,
      stream: false
    })
  });

  const data = await response.json();
  return data.message?.content || 'No response';
}

/**
 * Checks if the blog-editor model exists in Ollama
 * @returns {Promise<boolean>} True if model exists
 */
async function modelExists() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await response.json();
    return data.models?.some(m => m.name.startsWith(MODEL_NAME)) || false;
  } catch (error) {
    return false;
  }
}

/**
 * Creates the blog-editor model in Ollama
 * @returns {Promise<void>}
 */
async function createModel() {
  const modelfilePath = path.join(__dirname, '..', 'Modelfile');
  const modelfile = fs.readFileSync(modelfilePath, 'utf8');
  
  await fetch(`${OLLAMA_URL}/api/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: MODEL_NAME, modelfile })
  });
  
  console.log('✓ Model created');
}

/**
 * Ensures the blog-editor model exists, creating it if necessary
 * @throws {Error} If Ollama is not reachable
 */
async function ensureModelExists() {
  try {
    const exists = await modelExists();
    
    if (!exists) {
      console.log('Creating blog-editor model...');
      await createModel();
    }
  } catch (error) {
    console.error('Could not connect to Ollama:', error.message);
    throw new Error('Ollama connection failed');
  }
}

/**
 * Builds the system prompt for the design editor
 * @returns {string} System prompt with current design file context
 */
function getLatestUserMessage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return '';
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user' && typeof messages[i].content === 'string') {
      return messages[i].content;
    }
  }
  return '';
}

function getRelevantDesignFiles(userMessage) {
  const text = (userMessage || '').toLowerCase();
  const selected = new Set();

  const mentionsLayout =
    text.includes('nav') ||
    text.includes('navbar') ||
    text.includes('header') ||
    text.includes('menu') ||
    text.includes('brand') ||
    text.includes('logo') ||
    text.includes('top right') ||
    text.includes('top-left') ||
    text.includes('top left') ||
    text.includes('articles') ||
    text.includes('contact') ||
    text.includes('projects');

  const mentionsHomepage =
    text.includes('home') ||
    text.includes('homepage') ||
    text.includes('hero') ||
    text.includes('landing');

  const mentionsGlobalStyling =
    text.includes('global') ||
    text.includes('theme') ||
    text.includes('background') ||
    text.includes('gradient') ||
    text.includes('color') ||
    text.includes('typography') ||
    text.includes('font');

  if (mentionsHomepage) {
    selected.add('src/app/page.tsx');
  }

  if (mentionsLayout) {
    selected.add('src/app/layout.tsx');
  }

  if (mentionsGlobalStyling) {
    selected.add('src/app/globals.css');
  }

  if (text.includes('blog list') || text.includes('all posts') || text.includes('blog page')) {
    selected.add('src/app/blog/page.tsx');
  }

  if (text.includes('post page') || text.includes('article') || text.includes('slug') || text.includes('single post')) {
    selected.add('src/app/blog/[slug]/page.tsx');
  }

  if (text.includes('blog')) {
    selected.add('src/app/blog/page.tsx');
    selected.add('src/app/blog/[slug]/page.tsx');
  }

  if (selected.size === 1) {
    // keep single-file requests fast by not forcing extra files
    return [...selected];
  }

  if (selected.size === 0) {
    // safe default for generic design asks
    selected.add('src/app/page.tsx');
    selected.add('src/app/globals.css');
  }

  return DESIGN_FILES.filter((f) => selected.has(f));
}

async function getFastDesignModel() {
  const now = Date.now();
  if (cachedDesignModel && (now - cachedDesignModelAt) < 10 * 60 * 1000) {
    return cachedDesignModel;
  }

  const available = await getAvailableModels();

  const preferredOrder = [
    'llama3.2:3b',
    'mistral:latest',
    'qwen2.5:3b',
    'phi3:mini',
    'gemma2:2b',
    MODEL_NAME,
    'llama3.1:8b'
  ];

  const chosen = preferredOrder.find((name) => available.some((a) => a === name || a.startsWith(name))) || MODEL_NAME;
  cachedDesignModel = chosen;
  cachedDesignModelAt = now;
  return chosen;
}

function getDesignFallbackModels(primaryModel, availableModels) {
  const ordered = [
    primaryModel,
    'llama3.2:3b',
    'mistral:latest',
    MODEL_NAME,
    'llama3.1:8b'
  ];

  const seen = new Set();
  const result = [];

  for (const model of ordered) {
    if (!model || seen.has(model)) continue;
    if (availableModels.length > 0 && !availableModels.some((a) => a === model || a.startsWith(model))) {
      continue;
    }
    seen.add(model);
    result.push(model);
  }

  if (result.length === 0) {
    result.push(primaryModel || MODEL_NAME);
  }
  return result;
}

function isRunnerCrashText(text) {
  const t = (text || '').toLowerCase();
  return t.includes('runner process has terminated') || t.includes('exit status 2') || t.includes('llama runner');
}

function buildDesignSystemPrompt(userMessage = '') {
  const relevantFiles = getRelevantDesignFiles(userMessage);
  const currentFiles = formatDesignFilesForPrompt(relevantFiles);

  return `You are a Next.js + Tailwind CSS developer. Edit only the files below.

CURRENT DESIGN FILES:
${currentFiles}

OUTPUT FORMAT (required):
\`\`\`tsx
FILE: src/app/page.tsx
...complete file content...
\`\`\`

Rules:
1) Real code only (no placeholder headings)
2) Complete file content for each changed file
3) Preserve imports/types/data logic
4) No explanations inside code blocks
5) Editable files for this request: ${relevantFiles.join(', ')}`;
}

/**
 * Sends a design chat request to the Ollama API
 * @param {ChatMessage[]} messages - Chat history
 * @returns {Promise<string>} LLM response content
 */
async function chatForDesign(messages) {
  const latestUserMessage = getLatestUserMessage(messages);
  const systemPrompt = buildDesignSystemPrompt(latestUserMessage);
  const designModel = await getFastDesignModel();
  const availableModels = await getAvailableModels();
  const candidateModels = getDesignFallbackModels(designModel, availableModels);

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  for (const model of candidateModels) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000);

    let response;
    try {
      response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 1800
          }
        }),
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return 'Request timed out while waiting for Ollama (4 min). Try a more focused request or run again.';
      }
      continue;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('Ollama error:', response.status, errText, 'model=', model);

      if (isRunnerCrashText(errText)) {
        if (cachedDesignModel === model) {
          cachedDesignModel = null;
          cachedDesignModelAt = 0;
        }
        continue;
      }

      return `Ollama returned an error (${response.status}): ${errText}`;
    }

    const data = await response.json().catch(() => ({}));
    const content = data.message?.content || data.response || '';
    if (content) {
      cachedDesignModel = model;
      cachedDesignModelAt = Date.now();
      return content;
    }
  }

  return 'Ollama runner crashed for available models. Try restarting Ollama (`ollama serve`) and retry.';
}

module.exports = {
  chatWithOllama,
  chatForDesign,
  ensureModelExists
};
