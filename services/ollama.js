/**
 * LLM Service Module (Groq-backed)
 * Keeps original exported function names for compatibility with existing server code.
 */

const { GROQ_URL, GROQ_MODEL, GROQ_API_KEY } = require('../config');
const { getAllContent, getContentFileList, formatContentForPrompt } = require('./content');
const { formatDesignFilesForPrompt, DESIGN_FILES } = require('./design');

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

function requireGroqKey() {
  if (!GROQ_API_KEY) {
    throw new Error('Missing GROQ_API_KEY. Add it to ../.env and restart the app.');
  }
}

/**
 * Calls Groq chat completion endpoint
 * @param {ChatMessage[]} messages
 * @param {{ temperature?: number, maxTokens?: number, timeoutMs?: number }} options
 * @returns {Promise<string>}
 */
async function callGroq(messages, options = {}) {
  requireGroqKey();

  const {
    temperature = 0.3,
    maxTokens = 1800,
    timeoutMs = 240000
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Groq error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || 'No response';
  } catch (error) {
    if (error.name === 'AbortError') {
      return 'Request timed out while waiting for Groq. Try a more focused request or run again.';
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sends a chat request (Groq-backed, legacy function name retained)
 * @param {ChatMessage[]} messages - Chat history
 * @returns {Promise<string>} LLM response content
 */
async function chatWithOllama(messages) {
  const systemPrompt = buildSystemPrompt();
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];
  return callGroq(fullMessages, { temperature: 0.3, maxTokens: 1800, timeoutMs: 240000 });
}

/**
 * Ensures LLM backend is configured (legacy function name retained)
 * @throws {Error} If Groq API key is missing
 */
async function ensureModelExists() {
  requireGroqKey();
  console.log(`✓ Groq model ready (${GROQ_MODEL})`);
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
    return [...selected];
  }

  if (selected.size === 0) {
    selected.add('src/app/page.tsx');
    selected.add('src/app/globals.css');
  }

  return DESIGN_FILES.filter((f) => selected.has(f));
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
 * Sends a design chat request (Groq-backed)
 * @param {ChatMessage[]} messages - Chat history
 * @returns {Promise<string>} LLM response content
 */
async function chatForDesign(messages) {
  const latestUserMessage = getLatestUserMessage(messages);
  const systemPrompt = buildDesignSystemPrompt(latestUserMessage);
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  try {
    return await callGroq(fullMessages, { temperature: 0.2, maxTokens: 2000, timeoutMs: 240000 });
  } catch (error) {
    return `Groq request failed: ${error.message}`;
  }
}

module.exports = {
  chatWithOllama,
  chatForDesign,
  ensureModelExists
};
