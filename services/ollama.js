/**
 * Ollama LLM Service Module
 * Handles communication with the Ollama API for blog content generation
 */

const fs = require('fs');
const path = require('path');
const { OLLAMA_URL, MODEL_NAME } = require('../config');
const { getAllContent, getContentFileList, formatContentForPrompt } = require('./content');

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

module.exports = {
  chatWithOllama,
  ensureModelExists
};
