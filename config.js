/**
 * Configuration Constants
 * Centralized configuration for the Blog Editor application
 */

const fs = require('fs');
const path = require('path');

/** Path to .env file containing secrets */
const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const idx = line.indexOf('=');
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFromFile(ENV_FILE_PATH);

/** Server port */
const PORT = 3001;

/** Ollama API URL */
const OLLAMA_URL = 'http://localhost:11434';

/** LLM model name */
const MODEL_NAME = 'blog-editor';

/** Groq API endpoint */
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Groq model name */
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

/** Groq API key */
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

/** Directory containing blog content */
const CONTENT_DIR = path.join(__dirname, 'content');

/** Directory for temporary files (audio processing) */
const TEMP_DIR = path.join(__dirname, 'temp');

/** Whisper model for transcription */
const WHISPER_MODEL = 'Xenova/whisper-small.en';

/** GitHub repository configuration */
const GITHUB_CONFIG = {
  owner: 'ss889',
  repo: 'personal-blog',
  branch: 'master',
  getRepoUrl: () => `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}.git`,
  getAuthRepoUrl: (token) => `https://${token}@github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}.git`
};

/** Audio processing constants */
const AUDIO_CONSTANTS = {
  /** Sample rate for audio processing (16kHz for Whisper) */
  SAMPLE_RATE: 16000,
  /** Normalization factor for 16-bit PCM to float conversion */
  PCM_NORMALIZATION_FACTOR: 32768.0
};

/** Git commit message for blog updates */
const GIT_COMMIT_MESSAGE = 'Update blog content';

module.exports = {
  PORT,
  OLLAMA_URL,
  MODEL_NAME,
  GROQ_URL,
  GROQ_MODEL,
  GROQ_API_KEY,
  CONTENT_DIR,
  TEMP_DIR,
  WHISPER_MODEL,
  GITHUB_CONFIG,
  ENV_FILE_PATH,
  AUDIO_CONSTANTS,
  GIT_COMMIT_MESSAGE
};
