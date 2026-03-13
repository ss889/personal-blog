const fs = require('fs');
const path = require('path');

const PROFILES_DIR = path.join(__dirname, '..', '.style-profiles');

function ensureProfilesDir() {
  if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  }
}

function sanitizeProfileName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('profileName is required');
  }
  return name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

function getProfilePath(profileName) {
  const safeName = sanitizeProfileName(profileName);
  return path.join(PROFILES_DIR, `${safeName}.json`);
}

function nowIso() {
  return new Date().toISOString();
}

function readProfile(profileName) {
  ensureProfilesDir();
  const filePath = getProfilePath(profileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeProfile(profileName, data) {
  ensureProfilesDir();
  const filePath = getProfilePath(profileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

function listProfiles() {
  ensureProfilesDir();
  const files = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json'));
  return files.map((f) => f.replace(/\.json$/, ''));
}

function dedupeStrings(values = []) {
  return [...new Set((values || []).filter(Boolean).map((s) => String(s).trim()).filter(Boolean))];
}

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return target;
  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      output[key] = value;
    } else if (value && typeof value === 'object') {
      output[key] = deepMerge(output[key] && typeof output[key] === 'object' ? output[key] : {}, value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

function ingestDesignReferences({ profileName, urls = [], imagePaths = [], terminology = [], notes = '' }) {
  const safeName = sanitizeProfileName(profileName);
  const existing = readProfile(safeName) || {
    profileName: safeName,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    references: { urls: [], imagePaths: [] },
    terminology: [],
    notes: '',
    objective: '',
    tokens: {
      colors: {},
      typography: {},
      spacing: {},
      radii: {},
      shadows: {}
    },
    components: {},
    rules: []
  };

  const merged = {
    ...existing,
    updatedAt: nowIso(),
    references: {
      urls: dedupeStrings([...(existing.references?.urls || []), ...urls]),
      imagePaths: dedupeStrings([...(existing.references?.imagePaths || []), ...imagePaths])
    },
    terminology: dedupeStrings([...(existing.terminology || []), ...terminology]),
    notes: notes ? String(notes).trim() : (existing.notes || '')
  };

  return writeProfile(safeName, merged);
}

function buildStyleProfile({ profileName, objective = '', tokens = {}, components = {}, rules = [] }) {
  const safeName = sanitizeProfileName(profileName);
  const existing = readProfile(safeName);
  if (!existing) {
    throw new Error(`Profile not found: ${safeName}. Run ingest_design_references first.`);
  }

  const updated = {
    ...existing,
    updatedAt: nowIso(),
    objective: objective ? String(objective).trim() : existing.objective,
    tokens: deepMerge(existing.tokens || {}, tokens || {}),
    components: deepMerge(existing.components || {}, components || {}),
    rules: dedupeStrings([...(existing.rules || []), ...(rules || [])])
  };

  return writeProfile(safeName, updated);
}

function refineStyleProfile({ profileName, updates = {} }) {
  const safeName = sanitizeProfileName(profileName);
  const existing = readProfile(safeName);
  if (!existing) {
    throw new Error(`Profile not found: ${safeName}`);
  }

  const merged = deepMerge(existing, updates || {});
  merged.updatedAt = nowIso();

  if (merged.references) {
    merged.references.urls = dedupeStrings(merged.references.urls || []);
    merged.references.imagePaths = dedupeStrings(merged.references.imagePaths || []);
  }
  merged.terminology = dedupeStrings(merged.terminology || []);
  merged.rules = dedupeStrings(merged.rules || []);

  return writeProfile(safeName, merged);
}

function formatObjectLines(title, obj) {
  const entries = Object.entries(obj || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (entries.length === 0) return '';
  return [
    `${title}:`,
    ...entries.map(([k, v]) => `- ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`),
    ''
  ].join('\n');
}

function buildProfileDesignRequest(profile, options = {}) {
  const {
    goal = 'Adopt this style profile across target files while preserving existing app logic.',
    targetFiles = []
  } = options;

  const lines = [
    `Goal: ${goal}`,
    '',
    profile.objective ? `Style Objective: ${profile.objective}` : '',
    profile.notes ? `Notes: ${profile.notes}` : '',
    '',
    profile.references?.urls?.length ? `Reference URLs:\n${profile.references.urls.map((u) => `- ${u}`).join('\n')}` : '',
    profile.references?.imagePaths?.length ? `Reference Images:\n${profile.references.imagePaths.map((p) => `- ${p}`).join('\n')}` : '',
    profile.terminology?.length ? `Design Terminology:\n${profile.terminology.map((t) => `- ${t}`).join('\n')}` : '',
    '',
    formatObjectLines('Color Tokens', profile.tokens?.colors),
    formatObjectLines('Typography Tokens', profile.tokens?.typography),
    formatObjectLines('Spacing Tokens', profile.tokens?.spacing),
    formatObjectLines('Radius Tokens', profile.tokens?.radii),
    formatObjectLines('Shadow Tokens', profile.tokens?.shadows),
    formatObjectLines('Component Patterns', profile.components),
    profile.rules?.length ? `Rules:\n${profile.rules.map((r) => `- ${r}`).join('\n')}` : '',
    '',
    targetFiles.length ? `Only edit these files:\n${targetFiles.map((f) => `- ${f}`).join('\n')}` : '',
    '',
    'Return complete file contents in FILE code blocks that the editor can apply directly.'
  ].filter(Boolean);

  return lines.join('\n');
}

module.exports = {
  listProfiles,
  readProfile,
  ingestDesignReferences,
  buildStyleProfile,
  refineStyleProfile,
  buildProfileDesignRequest
};
