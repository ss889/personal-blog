/**
 * Content Service Module
 * Handles reading and writing blog content files
 */

const fs = require('fs');
const path = require('path');
const { CONTENT_DIR } = require('../config');

/**
 * Content file map
 * @typedef {Object.<string, string>} ContentMap
 * Maps filename (without extension) to file content
 */

/**
 * Reads the current content of all markdown files
 * @returns {ContentMap} Map of filename to content
 */
function getAllContent() {
  const files = {};
  
  // Read homepage
  const homepagePath = path.join(CONTENT_DIR, 'homepage.md');
  if (fs.existsSync(homepagePath)) {
    files.homepage = fs.readFileSync(homepagePath, 'utf8');
  }
  
  // Read all posts
  const postsDir = path.join(CONTENT_DIR, 'posts');
  if (fs.existsSync(postsDir)) {
    const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    for (const file of postFiles) {
      const slug = file.replace('.md', '');
      files[slug] = fs.readFileSync(path.join(postsDir, file), 'utf8');
    }
  }
  
  return files;
}

/**
 * Gets a list of all content file names
 * @returns {string[]} Array of file names
 */
function getContentFileList() {
  return Object.keys(getAllContent());
}

/**
 * Formats content map as a readable string for LLM prompts
 * @param {ContentMap} contentMap - Map of filename to content
 * @returns {string} Formatted content section
 */
function formatContentForPrompt(contentMap) {
  return Object.entries(contentMap)
    .map(([name, content]) => `=== FILE: ${name} ===\n${content}\n=== END ${name} ===`)
    .join('\n\n');
}

/**
 * Resolves the file path for a given content file
 * @param {string} filename - Filename (without extension)
 * @returns {string} Full file path
 */
function resolveContentPath(filename) {
  if (filename === 'homepage') {
    return path.join(CONTENT_DIR, 'homepage.md');
  }
  return path.join(CONTENT_DIR, 'posts', `${filename}.md`);
}

/**
 * Writes content to a file, creating directories as needed
 * @param {string} filename - Filename (without extension)
 * @param {string} content - Content to write
 * @returns {string} The filename that was written
 */
function writeContentFile(filename, content) {
  const filePath = resolveContentPath(filename);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✓ Updated: ${filePath}`);
  return filename;
}

/**
 * Parses a markdown file response and extracts filename and content
 * @param {string} response - LLM response containing markdown code block
 * @returns {{filename: string, content: string}|null} Parsed file info or null
 */
function parseMarkdownFileResponse(response) {
  const mdMatch = response.match(/```(?:markdown)?\s*\n?\s*FILE:\s*(\S+)\s*\n([\s\S]*?)```/i);
  
  if (mdMatch) {
    return {
      filename: mdMatch[1].replace('.md', ''),
      content: mdMatch[2].trim()
    };
  }
  
  return null;
}

/**
 * Parses a JSON file response and extracts file info
 * @param {string} response - LLM response containing JSON code block
 * @returns {{filename: string, content: string}|null} Parsed file info or null
 */
function parseJsonFileResponse(response) {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    
    if (parsed.action && parsed.file && parsed.content) {
      let filename = parsed.file;
      
      if (filename.startsWith('posts/')) {
        filename = filename.replace('posts/', '');
      }
      
      return { filename, content: parsed.content };
    }
  } catch (error) {
    console.error('JSON parse error:', error.message);
  }
  
  return null;
}

/**
 * Extracts file content from LLM response and writes to disk
 * @param {string} response - LLM response
 * @returns {string|null} Updated filename or null if no file was updated
 */
function extractAndApplyFileUpdate(response) {
  // Try markdown format first
  let fileInfo = parseMarkdownFileResponse(response);
  
  // Fallback to JSON format
  if (!fileInfo) {
    fileInfo = parseJsonFileResponse(response);
  }
  
  if (fileInfo) {
    return writeContentFile(fileInfo.filename, fileInfo.content);
  }
  
  return null;
}

/**
 * Removes JSON code blocks from a response for display
 * @param {string} response - Raw LLM response
 * @returns {string} Cleaned response
 */
function cleanResponseForDisplay(response) {
  return response.replace(/```json[\s\S]*?```\s*/g, '').trim();
}

module.exports = {
  getAllContent,
  getContentFileList,
  formatContentForPrompt,
  resolveContentPath,
  writeContentFile,
  extractAndApplyFileUpdate,
  cleanResponseForDisplay
};
