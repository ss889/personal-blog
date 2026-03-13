/**
 * Design Service Module
 * Handles reading, backing up, writing, and verifying Next.js design files
 * Includes auto-revert if the build breaks after edits
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/** Root of the Next.js project */
const PROJECT_ROOT = path.join(__dirname, '..');

/**
 * All design files managed by this service, relative to project root
 */
const DESIGN_FILES = [
  'src/app/globals.css',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/blog/page.tsx',
  'src/app/blog/[slug]/page.tsx',
  'src/app/projects/page.tsx'
];

/**
 * File info object
 * @typedef {Object} DesignFile
 * @property {string} name - Display name (e.g. 'page.tsx - homepage')
 * @property {string} relativePath - Path relative to project root
 * @property {string} content - File contents
 */

/**
 * Reads all design files and returns their contents
 * @returns {DesignFile[]} Array of design file objects
 */
function getAllDesignFiles() {
  return DESIGN_FILES.map(relativePath => {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    return { name: relativePath, relativePath, content };
  });
}

/**
 * Formats design files as a readable string for LLM prompts
 * @param {string[]} [selectedPaths] - Optional subset of DESIGN_FILES
 * @returns {string} Formatted content section
 */
function formatDesignFilesForPrompt(selectedPaths = DESIGN_FILES) {
  const selectedSet = new Set(selectedPaths);
  return getAllDesignFiles()
    .filter(f => selectedSet.has(f.relativePath))
    .map(f => `=== FILE: ${f.relativePath} ===\n${f.content}\n=== END ${f.relativePath} ===`)
    .join('\n\n');
}

/**
 * Creates in-memory backups of all design files
 * @returns {Map<string, string>} Map of relativePath -> original content
 */
function backupDesignFiles() {
  const backups = new Map();
  for (const relativePath of DESIGN_FILES) {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    if (fs.existsSync(fullPath)) {
      backups.set(relativePath, fs.readFileSync(fullPath, 'utf8'));
    }
  }
  console.log(`Backed up ${backups.size} design files`);
  return backups;
}

/**
 * Restores design files from backups
 * @param {Map<string, string>} backups - Map of relativePath -> original content
 */
function revertDesignFiles(backups) {
  for (const [relativePath, content] of backups) {
    const fullPath = path.join(PROJECT_ROOT, relativePath);
    fs.writeFileSync(fullPath, content, 'utf8');
  }
  console.log('✓ Reverted design files to backup');
}

/**
 * Writes a single design file to disk
 * @param {string} relativePath - Path relative to project root
 * @param {string} content - New file content
 */
function writeDesignFile(relativePath, content) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Wrote design file: ${relativePath}`);
}

/**
 * Runs a TypeScript type check (fast, no full build needed)
 * @returns {{ success: boolean, error: string|null }}
 */
function verifyTypeCheck() {
  try {
    execSync('npx tsc --noEmit', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000
    });
    console.log('✓ TypeScript check passed');
    return { success: true, error: null };
  } catch (err) {
    const errorOutput = err.stdout || err.message || 'TypeScript errors found';
    console.error('TypeScript check failed:', errorOutput);
    return { success: false, error: errorOutput };
  }
}

/**
 * Result of a design update operation
 * @typedef {Object} DesignUpdateResult
 * @property {boolean} success - Whether the update succeeded
 * @property {string[]} filesUpdated - List of files that were changed
 * @property {boolean} reverted - Whether the files were reverted due to error
 * @property {string|null} error - Error message if failed
 */

/**
 * Applies design file changes from an LLM response with backup/revert safety
 * @param {Array<{relativePath: string, content: string}>} fileChanges - Files to write
 * @returns {DesignUpdateResult}
 */
function applyDesignChanges(fileChanges) {
  if (!fileChanges || fileChanges.length === 0) {
    return { success: false, filesUpdated: [], reverted: false, error: 'No file changes provided' };
  }

  const backups = backupDesignFiles();
  const filesUpdated = [];

  try {
    // Write all changes
    for (const { relativePath, content } of fileChanges) {
      writeDesignFile(relativePath, content);
      filesUpdated.push(relativePath);
    }

    // Verify TypeScript still compiles
    const check = verifyTypeCheck();
    if (!check.success) {
      console.log('Build check failed, reverting...');
      revertDesignFiles(backups);
      return {
        success: false,
        filesUpdated: [],
        reverted: true,
        error: `Changes reverted - TypeScript errors detected:\n${check.error}`
      };
    }

    return { success: true, filesUpdated, reverted: false, error: null };
  } catch (err) {
    revertDesignFiles(backups);
    return {
      success: false,
      filesUpdated: [],
      reverted: true,
      error: `Changes reverted due to error: ${err.message}`
    };
  }
}

/**
 * Parses design file blocks from an LLM response
 * Expected format:
 *   ```tsx
 *   FILE: src/app/page.tsx
 *   ...content...
 *   ```
 * @param {string} response - LLM response text
 * @returns {Array<{relativePath: string, content: string}>}
 */
/**
 * Returns true if the content looks like real code rather than placeholder text
 * @param {string} content
 * @returns {boolean}
 */
function looksLikeCode(content) {
  if (!content || content.trim().length < 30) return false;
  const codeSignals = [
    /<[a-z]/i,           // JSX/HTML tags
    /className=/,        // Tailwind JSX
    /import /,           // ES imports
    /export /,           // ES exports
    /\{.*\}/,            // JS expressions
    /@import/,           // CSS imports
    /:[^:]+;/,           // CSS property: value;
  ];
  const signalCount = codeSignals.filter(re => re.test(content)).length;
  // Reject if it's mostly short lines with no code signals (placeholder headings)
  if (signalCount === 0) {
    console.warn('parseDesignFileResponse: content has no code signals — likely placeholder text, skipping');
    return false;
  }
  return true;
}

/**
 * Sanitizes LLM-generated code to fix common quote/encoding issues
 * that cause TypeScript parse errors before we attempt to apply.
 * @param {string} content
 * @returns {string}
 */
function sanitizeGeneratedCode(content) {
  // Replace smart/curly quotes with straight quotes
  let out = content
    .replace(/\u2018|\u2019/g, "'")   // left/right single curly quotes → '
    .replace(/\u201C|\u201D/g, '"')   // left/right double curly quotes → "
    .replace(/\u2032/g, "'")          // prime → '
    .replace(/\u201A/g, "'")          // single low-9 quotation → '
    .replace(/\u201E/g, '"');         // double low-9 quotation → "

  // Fix module/declare declarations that use backticks instead of quotes
  // e.g. declare module `foo` { ... } → declare module 'foo' { ... }
  out = out.replace(/(declare\s+module\s+)`([^`]+)`/g, "$1'$2'");

  // Fix import paths that ended up with backticks (rare but happens)
  // e.g. import foo from `bar` → import foo from 'bar'
  out = out.replace(/(from\s+)`([^`]+)`/g, "$1'$2'");
  out = out.replace(/(import\s+)`([^`]+)`/g, "$1'$2'");
  out = out.replace(/(require\s*\()`([^`]+)`/g, "$1'$2'");

  return out;
}

/**
 * Validates that code is syntactically complete and not broken
 * @param {string} content - Code to validate
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateCodeSyntax(content) {
  // Check for balanced braces/brackets/parens
  const braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
  const bracketCount = (content.match(/\[/g) || []).length - (content.match(/\]/g) || []).length;
  const parenCount = (content.match(/\(/g) || []).length - (content.match(/\)/g) || []).length;

  if (braceCount !== 0) {
    return { valid: false, error: `Unbalanced braces: ${braceCount > 0 ? 'missing }' : 'extra }'}` };
  }
  if (bracketCount !== 0) {
    return { valid: false, error: `Unbalanced brackets: ${bracketCount > 0 ? 'missing ]' : 'extra ]'}` };
  }
  if (parenCount !== 0) {
    return { valid: false, error: `Unbalanced parentheses: ${parenCount > 0 ? 'missing )' : 'extra )'}` };
  }

  // Check for unclosed JSX tags
  const openTags = (content.match(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?>/g) || []).length;
  const closeTags = (content.match(/<\/[A-Z][A-Za-z0-9]*>/g) || []).length;
  const selfClosingTags = (content.match(/<[A-Z][A-Za-z0-9]*(?:\s[^>]*)?\s*\/>/g) || []).length;
  
  if (openTags !== closeTags + selfClosingTags) {
    return { valid: false, error: `Unclosed JSX tags detected` };
  }

  // Check for incomplete file (no closing braces at all)
  if (!content.trim().endsWith('}') && !content.trim().endsWith(';') && !content.trim().endsWith(')')) {
    // CSS files can end with } or other ways
    if (!content.includes('CSS') && !content.includes('@media')) {
      return { valid: false, error: `File appears incomplete (doesn't end with closing bracket)` };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validates that parsed content is complete and safe to apply
 * @param {string} relativePath - File path
 * @param {string} content - File content
 * @returns {{ safe: boolean, warning: string|null }}
 */
function validateParsedContent(relativePath, content) {
  const syntaxCheck = validateCodeSyntax(content);
  if (!syntaxCheck.valid) {
    return { safe: false, warning: syntaxCheck.error };
  }

  // Check that file isn't truncated (should have at least some structure)
  const isTsx = relativePath.endsWith('.tsx');
  const isCss = relativePath.endsWith('.css');

  if (isTsx) {
    if (!content.includes('export')) {
      return { safe: false, warning: 'TSX file missing export statement' };
    }
    if (!content.includes('return') && !content.includes('return (')) {
      return { safe: false, warning: 'Component missing return statement' };
    }
  }

  if ((isTsx || isCss) && content.length < 50) {
    return { safe: false, warning: 'File content too short - likely incomplete' };
  }

  return { safe: true, warning: null };
}

function parseDesignFileResponse(response, hintFiles = []) {
  const changes = [];
  const seen = new Set();

  function addChange(relativePath, content) {
    if (!DESIGN_FILES.includes(relativePath)) {
      console.warn(`Ignoring unknown design file: ${relativePath}`);
      return;
    }

    const sanitized = sanitizeGeneratedCode(content);

    if (!looksLikeCode(sanitized)) {
      console.warn(`Skipping ${relativePath}: content does not appear to be code`);
      return;
    }

    // NEW: Validate before adding
    const validation = validateParsedContent(relativePath, sanitized);
    if (!validation.safe) {
      console.warn(`Skipping ${relativePath}: ${validation.warning}`);
      return;
    }

    if (seen.has(relativePath)) {
      const idx = changes.findIndex((c) => c.relativePath === relativePath);
      if (idx >= 0) {
        changes[idx] = { relativePath, content: sanitized };
      }
      return;
    }

    seen.add(relativePath);
    changes.push({ relativePath, content: sanitized });
  }

  const codeBlockRegex = /```(?:tsx?|css|javascript)?\s*\n?\s*FILE:\s*(\S+)\s*\n([\s\S]*?)```/gi;
  let match;

  while ((match = codeBlockRegex.exec(response)) !== null) {
    const relativePath = match[1].trim();
    const content = match[2].trim();
    addChange(relativePath, content);
  }

  const plainBlockRegex = /(?:^|\n)FILE:\s*(\S+)\s*\n([\s\S]*?)(?=\nFILE:\s*\S+\s*\n|$)/gi;
  if (changes.length === 0) {
    while ((match = plainBlockRegex.exec(response)) !== null) {
      const relativePath = match[1].trim();
      const content = match[2].trim();
      addChange(relativePath, content);
    }
  }

  // Fallback: code blocks without FILE: prefix — look for a design file path
  // mentioned in the text preceding the block, in the response, or use the hint list
  if (changes.length === 0) {
    const bareBlockRegex = /```(?:tsx?|css|javascript)?\s*\n([\s\S]*?)```/gi;
    while ((match = bareBlockRegex.exec(response)) !== null) {
      const content = match[1].trim();
      const blockStart = match.index;
      const before = response.slice(Math.max(0, blockStart - 350), blockStart);

      let targetPath = null;

      // 1. Look for a known path in the surrounding text
      for (const filePath of DESIGN_FILES) {
        if (before.includes(filePath) || response.slice(blockStart, blockStart + 30).includes(filePath)) {
          targetPath = filePath;
          break;
        }
      }

      // 2. Look anywhere in the full response
      if (!targetPath) {
        for (const filePath of DESIGN_FILES) {
          if (response.includes(filePath)) {
            targetPath = filePath;
            break;
          }
        }
      }

      // 3. Use hintFiles from the prompt context (single hint = unambiguous target)
      if (!targetPath && hintFiles.length === 1 && DESIGN_FILES.includes(hintFiles[0])) {
        targetPath = hintFiles[0];
      }

      if (targetPath) {
        addChange(targetPath, content);
      }
    }
  }

  return changes;
}

module.exports = {
  DESIGN_FILES,
  getAllDesignFiles,
  formatDesignFilesForPrompt,
  backupDesignFiles,
  revertDesignFiles,
  applyDesignChanges,
  parseDesignFileResponse
};
