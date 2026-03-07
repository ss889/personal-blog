/**
 * Configuration Constants
 * Centralized configuration for the Blog Editor application
 */

const path = require('path');

/** Server port */
const PORT = 3001;

/** Ollama API URL */
const OLLAMA_URL = 'http://localhost:11434';

/** LLM model name */
const MODEL_NAME = 'blog-editor';

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

/** Path to .env file containing secrets */
const ENV_FILE_PATH = path.join(__dirname, '..', '.env');

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
  CONTENT_DIR,
  TEMP_DIR,
  WHISPER_MODEL,
  GITHUB_CONFIG,
  ENV_FILE_PATH,
  AUDIO_CONSTANTS,
  GIT_COMMIT_MESSAGE
};
