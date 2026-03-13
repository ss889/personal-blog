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

  if (text.includes('project')) {
    selected.add('src/app/projects/page.tsx');
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

  return `You are an expert Next.js + React + Tailwind CSS developer. Your job is to edit design files with ZERO syntax errors.

CURRENT DESIGN FILES:
${currentFiles}

OUTPUT FORMAT (STRICT):
For each file you edit, output:

\`\`\`tsx
FILE: src/app/page.tsx
...COMPLETE file content...
\`\`\`

ABSOLUTE RULES - FOLLOW EXACTLY:

1. **VALID CODE ONLY**: Every character must be syntactically correct TypeScript/React/CSS
2. **COMPLETE FILES**: Output the ENTIRE file content - every line, import, export, closing brackets
3. **PRESERVE STRUCTURE**: Keep all imports, exports, data, and logic - only change styles/UI
4. **QUOTE STYLE**: Use ONLY straight single (') or double (") quotes - NEVER curly quotes, smart quotes, or backticks
5. **IMPORT PATHS**: Must be one of these:
   - import X from 'path'
   - import X from "path"
   - Nothing else. No backticks.
6. **JSX VALIDITY**: All tags must close properly: <div></div> or <div />
7. **BRACKETS**: Every { must have matching }, every [ must have ], every ( must have )
8. **EXPORTS**: Keep export syntax EXACTLY as original - don't remove export
9. **NO COMMENTS**: Don't add explanations inside code blocks

BEFORE OUTPUTTING, VERIFY:
- Does every opening brace have a closing brace? ✓
- Are all quotes straight (not curly)? ✓
- Does the file have valid import/export statements? ✓
- Are all JSX tags properly closed? ✓
- Did I keep all the important logic/data? ✓

EDITABLE FILES FOR THIS REQUEST: ${relevantFiles.join(', ')}

Any syntax error = revert = user angry. Triple-check everything.`;
}

/**
 * Sends a design chat request (Groq-backed)
 * @param {ChatMessage[]} messages - Chat history
 * @returns {Promise<{content: string, relevantFiles: string[]}>}
 */
async function chatForDesign(messages) {
  const latestUserMessage = getLatestUserMessage(messages);
  const relevantFiles = getRelevantDesignFiles(latestUserMessage);
  const systemPrompt = buildDesignSystemPrompt(latestUserMessage);
  const fullMessages = [{ role: 'system', content: systemPrompt }, ...messages];

  try {
    const content = await callGroq(fullMessages, { temperature: 0.2, maxTokens: 2000, timeoutMs: 240000 });
    return { content, relevantFiles };
  } catch (error) {
    return { content: `Groq request failed: ${error.message}`, relevantFiles };
  }
}

module.exports = {
  chatWithOllama,
  chatForDesign,
  ensureModelExists
};
