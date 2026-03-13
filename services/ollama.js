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

  return `You are a blog content editor. Your job is to EDIT existing content files based on user requests.

**CRITICAL**: Read the EXACT CURRENT content below before making any changes.

CURRENT FILES AND THEIR CONTENT:
${contentSection}

YOUR TASK:
1. Read the CURRENT content above carefully
2. Find EXACTLY what the user is asking to change
3. Change ONLY that text - preserve the file structure (frontmatter, formatting)
4. Output the COMPLETE edited file

RESPONSE FORMAT:
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
1. **READ ACTUAL CONTENT**: Use the current content shown above, not templates
2. **CHANGE ONLY WHAT ASKED**: If user says "change X to Y", find X in current content and replace exactly
3. **PRESERVE EVERYTHING ELSE**: Keep frontmatter, formatting, line breaks - change NOTHING except what's requested
4. **COMPLETE FILES**: Output the entire file content
5. **FRONTMATTER**: Keep title, date (${today}), and excerpt exactly as original unless user asks to change them
6. For NEW posts only, create a new filename (use lowercase-with-dashes)
7. After the code block, briefly explain what you changed

VERIFICATION:
- Did I read the current content? YES
- Did I find what user asked to change? YES  
- Did I preserve the file structure? YES

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

  return `You are an expert Next.js + React + Tailwind CSS developer. Your job is to EDIT existing design files with ZERO syntax errors.

**CRITICAL**: You MUST read and understand the EXACT CURRENT content below before making any changes.

CURRENT DESIGN FILES (READ THIS CAREFULLY):
${currentFiles}

YOUR TASK:
1. Read the CURRENT content above carefully
2. Find EXACTLY what the user is asking to change
3. Change ONLY that part - preserve everything else exactly as-is
4. Output the COMPLETE edited file

USER REQUEST: "${userMessage}"

OUTPUT FORMAT (STRICT):
For EACH file you edit, output:

\`\`\`tsx
FILE: src/app/page.tsx
...COMPLETE file content - every line, import, export...
\`\`\`

ABSOLUTE RULES - NO EXCEPTIONS:

1. **READ ACTUAL CONTENT**: Use the CURRENT content shown above, not what you think it should be
2. **CHANGE ONLY WHAT USER ASKED**: If user says "change X to Y", find X in current content and replace with Y
3. **PRESERVE EVERYTHING ELSE**: Keep all imports, exports, structure, formatting - change NOTHING else
4. **COMPLETE FILES**: Output entire file line-for-line - missing even one line breaks the app
5. **VALID SYNTAX ONLY**: Every { [ ( must have closing } ] ) - count them
6. **STRAIGHT QUOTES ONLY**: Use ' or " only - NEVER curly quotes (" " ' ')
7. **JSX TAGS**: All <tags> must properly close as </tags> or />
8. **EXPORTS**: Keep export statements exactly as original
9. **NO EXPLANATIONS**: No comments or text inside code blocks

VERIFICATION BEFORE SUBMIT:
- Did I read the current content above? YES
- Did I find exactly what user asked to change? YES
- Did I preserve everything else in the file? YES
- Do all brackets match? YES
- Are all quotes straight? YES
- Is the file complete? YES

EDITABLE FILES: ${relevantFiles.join(', ')}

REMEMBER: If you misunderstand what needs to change, the app breaks. Re-read the current content and user request multiple times.`;
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
