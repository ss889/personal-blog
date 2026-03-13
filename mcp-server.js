#!/usr/bin/env node
/**
 * Blog Editor MCP Server
 * Exposes blog content and design editing as MCP tools
 * that any AI assistant (VS Code Copilot, Claude Desktop, etc.) can call.
 *
 * Tools exposed:
 *  - list_content_files     : List all markdown content files
 *  - read_content_file      : Read a specific markdown file
 *  - write_content_file     : Create or update a markdown file
 *  - list_design_files      : List all editable Next.js design files
 *  - read_design_file       : Read a specific design file
 *  - write_design_file      : Edit a design file (with backup + TS check)
 *  - list_style_profiles    : List saved style profiles
 *  - ingest_design_references: Save URLs/images/terminology for a profile
 *  - build_style_profile    : Add objective/tokens/components/rules
 *  - read_style_profile     : Read the stored profile JSON
 *  - refine_style_profile   : Merge updates into an existing profile
 *  - apply_style_profile    : Run one-shot design update from profile
 *  - push_to_github         : Push all changes to GitHub
 *  - get_blog_status        : Overview of all files and git status
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

const { getAllContent, writeContentFile } = require('./services/content');
const { getAllDesignFiles, applyDesignChanges, parseDesignFileResponse, DESIGN_FILES } = require('./services/design');
const { chatForDesign } = require('./services/ollama');
const {
  listProfiles,
  readProfile,
  ingestDesignReferences,
  buildStyleProfile,
  refineStyleProfile,
  buildProfileDesignRequest
} = require('./services/style-profile');
const { pushToGitHub } = require('./services/git');
const { execSync } = require('child_process');

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'list_content_files',
    description: 'List all markdown blog content files (homepage and posts)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'read_content_file',
    description: 'Read the full content of a markdown blog file',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename without extension, e.g. "homepage", "hello-world"'
        }
      },
      required: ['filename']
    }
  },
  {
    name: 'write_content_file',
    description: 'Create or update a markdown blog file. Include full frontmatter (title, date, excerpt) and content.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'Filename without extension, e.g. "homepage", "my-new-post"'
        },
        content: {
          type: 'string',
          description: 'Full markdown file content including frontmatter'
        }
      },
      required: ['filename', 'content']
    }
  },
  {
    name: 'list_design_files',
    description: 'List all editable Next.js design files (TSX components and CSS)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'read_design_file',
    description: 'Read the full content of a Next.js design file',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path, e.g. "src/app/globals.css" or "src/app/page.tsx"'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_design_file',
    description: 'Edit a Next.js design file. Backs up files first; auto-reverts if TypeScript check fails.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path of the file to edit, e.g. "src/app/globals.css"'
        },
        content: {
          type: 'string',
          description: 'Complete new file content'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_style_profiles',
    description: 'List saved design style profiles',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'ingest_design_references',
    description: 'Store reference URLs, image paths, terminology, and notes in a named style profile',
    inputSchema: {
      type: 'object',
      properties: {
        profileName: {
          type: 'string',
          description: 'Profile name, e.g. portfolio-v1'
        },
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Reference URLs to mimic'
        },
        imagePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Local image paths with reference designs'
        },
        terminology: {
          type: 'array',
          items: { type: 'string' },
          description: 'Design terms like glassmorphism, minimal, etc.'
        },
        notes: {
          type: 'string',
          description: 'Free-form notes and constraints'
        }
      },
      required: ['profileName']
    }
  },
  {
    name: 'build_style_profile',
    description: 'Set objective and design tokens/components/rules for a profile',
    inputSchema: {
      type: 'object',
      properties: {
        profileName: { type: 'string' },
        objective: { type: 'string' },
        tokens: { type: 'object' },
        components: { type: 'object' },
        rules: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['profileName']
    }
  },
  {
    name: 'read_style_profile',
    description: 'Read a saved style profile JSON',
    inputSchema: {
      type: 'object',
      properties: {
        profileName: { type: 'string' }
      },
      required: ['profileName']
    }
  },
  {
    name: 'refine_style_profile',
    description: 'Merge updates into an existing style profile',
    inputSchema: {
      type: 'object',
      properties: {
        profileName: { type: 'string' },
        updates: { type: 'object' }
      },
      required: ['profileName', 'updates']
    }
  },
  {
    name: 'apply_style_profile',
    description: 'Apply a style profile to design files using the design model, then optionally auto-push',
    inputSchema: {
      type: 'object',
      properties: {
        profileName: { type: 'string' },
        goal: {
          type: 'string',
          description: 'Optional task objective, e.g. "Adopt profile on homepage only"'
        },
        targetFiles: {
          type: 'array',
          items: { type: 'string' },
          description: 'Subset of editable design files'
        },
        autoPush: {
          type: 'boolean',
          description: 'If true, push after successful apply'
        }
      },
      required: ['profileName']
    }
  },
  {
    name: 'push_to_github',
    description: 'Commit and push all pending changes to GitHub. The GitHub Actions workflow will then rebuild and deploy the site.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_blog_status',
    description: 'Get an overview of all blog files and current git status',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

/**
 * Returns MCP tool result format
 * @param {string} text - Result text
 * @param {boolean} isError - Whether this is an error result
 */
function toolResult(text, isError = false) {
  return {
    content: [{ type: 'text', text }],
    isError
  };
}

/**
 * Handles list_content_files
 */
function handleListContentFiles() {
  const files = getAllContent();
  const fileList = Object.keys(files);
  return toolResult(
    `Blog content files (${fileList.length}):\n` +
    fileList.map(f => `  - ${f}`).join('\n')
  );
}

/**
 * Handles read_content_file
 */
function handleReadContentFile({ filename }) {
  const files = getAllContent();
  if (!files[filename]) {
    return toolResult(`File not found: "${filename}". Available files: ${Object.keys(files).join(', ')}`, true);
  }
  return toolResult(`=== ${filename} ===\n${files[filename]}`);
}

/**
 * Handles write_content_file
 */
function handleWriteContentFile({ filename, content }) {
  try {
    writeContentFile(filename, content);
    return toolResult(`✓ Successfully wrote: ${filename}`);
  } catch (error) {
    return toolResult(`Failed to write file: ${error.message}`, true);
  }
}

/**
 * Handles list_design_files
 */
function handleListDesignFiles() {
  return toolResult(
    `Editable design files (${DESIGN_FILES.length}):\n` +
    DESIGN_FILES.map(f => `  - ${f}`).join('\n')
  );
}

/**
 * Handles read_design_file
 */
function handleReadDesignFile({ path: filePath }) {
  const files = getAllDesignFiles();
  const file = files.find(f => f.relativePath === filePath);
  if (!file) {
    return toolResult(
      `File not found: "${filePath}".\nAvailable: ${DESIGN_FILES.join(', ')}`,
      true
    );
  }
  return toolResult(`=== ${file.relativePath} ===\n${file.content}`);
}

/**
 * Handles write_design_file
 */
function handleWriteDesignFile({ path: filePath, content }) {
  if (!DESIGN_FILES.includes(filePath)) {
    return toolResult(
      `Not an editable design file: "${filePath}".\nAllowed: ${DESIGN_FILES.join(', ')}`,
      true
    );
  }

  const result = applyDesignChanges([{ relativePath: filePath, content }]);

  if (result.success) {
    return toolResult(`✓ Design file updated: ${filePath}`);
  } else if (result.reverted) {
    return toolResult(
      `Changes reverted - TypeScript check failed:\n${result.error}`,
      true
    );
  } else {
    return toolResult(`Failed: ${result.error}`, true);
  }
}

function handleListStyleProfiles() {
  const profiles = listProfiles();
  if (profiles.length === 0) {
    return toolResult('No style profiles yet. Use ingest_design_references first.');
  }
  return toolResult(
    `Style profiles (${profiles.length}):\n` +
    profiles.map((p) => `  - ${p}`).join('\n')
  );
}

function handleIngestDesignReferences(args) {
  try {
    const profile = ingestDesignReferences(args);
    return toolResult(
      `✓ Saved references for profile: ${profile.profileName}\n` +
      `URLs: ${profile.references.urls.length}, Images: ${profile.references.imagePaths.length}, Terms: ${profile.terminology.length}`
    );
  } catch (error) {
    return toolResult(`Failed to ingest references: ${error.message}`, true);
  }
}

function handleBuildStyleProfile(args) {
  try {
    const profile = buildStyleProfile(args);
    return toolResult(
      `✓ Updated style profile: ${profile.profileName}\n` +
      `Objective: ${profile.objective || '(none)'}\n` +
      `Rules: ${(profile.rules || []).length}`
    );
  } catch (error) {
    return toolResult(`Failed to build style profile: ${error.message}`, true);
  }
}

function handleReadStyleProfile({ profileName }) {
  const profile = readProfile(profileName);
  if (!profile) {
    return toolResult(`Profile not found: ${profileName}`, true);
  }
  return toolResult(JSON.stringify(profile, null, 2));
}

function handleRefineStyleProfile(args) {
  try {
    const profile = refineStyleProfile(args);
    return toolResult(`✓ Refined style profile: ${profile.profileName}`);
  } catch (error) {
    return toolResult(`Failed to refine profile: ${error.message}`, true);
  }
}

async function handleApplyStyleProfile({ profileName, goal, targetFiles = [], autoPush = false }) {
  const profile = readProfile(profileName);
  if (!profile) {
    return toolResult(`Profile not found: ${profileName}. Create it with ingest_design_references first.`, true);
  }

  const normalizedTargets = Array.isArray(targetFiles) ? targetFiles.filter((f) => DESIGN_FILES.includes(f)) : [];
  const invalidTargets = Array.isArray(targetFiles)
    ? targetFiles.filter((f) => !DESIGN_FILES.includes(f))
    : [];

  if (invalidTargets.length > 0) {
    return toolResult(`Invalid targetFiles: ${invalidTargets.join(', ')}\nAllowed: ${DESIGN_FILES.join(', ')}`, true);
  }

  const requestText = buildProfileDesignRequest(profile, {
    goal,
    targetFiles: normalizedTargets
  });

  const { content: llmContent, relevantFiles: llmHintFiles } = await chatForDesign([
    { role: 'user', content: requestText }
  ]);
  const llmResponse = llmContent || '';

  const fileChanges = parseDesignFileResponse(llmResponse, llmHintFiles);
  if (fileChanges.length === 0) {
    return toolResult(
      `No valid code changes produced by model.\nModel response:\n${llmResponse || '(empty)'}`,
      true
    );
  }

  const applyResult = applyDesignChanges(fileChanges);
  if (!applyResult.success) {
    return toolResult(`Apply failed: ${applyResult.error}`, true);
  }

  let pushed = false;
  let pushMsg = '';
  if (autoPush) {
    const pushResult = pushToGitHub(__dirname);
    pushed = !!pushResult.pushed;
    pushMsg = pushResult.success
      ? (pushed ? '\n✓ Auto-pushed to GitHub.' : '\nNo new changes to push.')
      : `\nAuto-push failed: ${pushResult.error}`;
  }

  return toolResult(
    `✓ Applied style profile: ${profile.profileName}\n` +
    `Files updated (${applyResult.filesUpdated.length}):\n` +
    applyResult.filesUpdated.map((f) => `  - ${f}`).join('\n') +
    `${pushMsg}`
  );
}

/**
 * Handles push_to_github
 */
function handlePushToGitHub() {
  const result = pushToGitHub(__dirname);
  if (result.success && result.pushed) {
    return toolResult('✓ Pushed to GitHub. Site will rebuild in ~2 minutes.');
  } else if (result.success && !result.pushed) {
    return toolResult('No changes to push.');
  } else {
    return toolResult(`Push failed: ${result.error}`, true);
  }
}

/**
 * Handles get_blog_status
 */
function handleGetBlogStatus() {
  const contentFiles = getAllContent();
  const designFiles = getAllDesignFiles();

  let gitStatus = 'unknown';
  try {
    gitStatus = execSync('git status --short', { cwd: __dirname, encoding: 'utf8' }).trim() || 'clean';
  } catch (e) {
    gitStatus = `error: ${e.message}`;
  }

  const lines = [
    '=== Blog Status ===',
    '',
    `Content files (${Object.keys(contentFiles).length}):`,
    ...Object.keys(contentFiles).map(f => `  - ${f}`),
    '',
    `Design files (${designFiles.length}):`,
    ...designFiles.map(f => `  - ${f.relativePath}`),
    '',
    'Git status:',
    gitStatus || '  (nothing to commit)'
  ];

  return toolResult(lines.join('\n'));
}

// ---------------------------------------------------------------------------
// Route tool calls to handlers
// ---------------------------------------------------------------------------

/**
 * Dispatches a tool call to the appropriate handler
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 */
function dispatchTool(name, args) {
  switch (name) {
    case 'list_content_files':  return handleListContentFiles();
    case 'read_content_file':   return handleReadContentFile(args);
    case 'write_content_file':  return handleWriteContentFile(args);
    case 'list_design_files':   return handleListDesignFiles();
    case 'read_design_file':    return handleReadDesignFile(args);
    case 'write_design_file':   return handleWriteDesignFile(args);
    case 'list_style_profiles': return handleListStyleProfiles();
    case 'ingest_design_references': return handleIngestDesignReferences(args);
    case 'build_style_profile': return handleBuildStyleProfile(args);
    case 'read_style_profile': return handleReadStyleProfile(args);
    case 'refine_style_profile': return handleRefineStyleProfile(args);
    case 'push_to_github':      return handlePushToGitHub();
    case 'get_blog_status':     return handleGetBlogStatus();
    default:
      return toolResult(`Unknown tool: ${name}`, true);
  }
}

// ---------------------------------------------------------------------------
// MCP Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'blog-editor', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === 'apply_style_profile') {
    return handleApplyStyleProfile(args || {});
  }
  return dispatchTool(name, args || {});
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Blog Editor MCP server running (stdio)');
}

main().catch(err => {
  console.error('MCP server error:', err);
  process.exit(1);
});
