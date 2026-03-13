/**
 * Whisper Transcription Service Module
 * Handles audio transcription using Hugging Face Transformers
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { WHISPER_MODEL, TEMP_DIR, AUDIO_CONSTANTS } = require('../config');

/** Cached Whisper pipeline instance */
let whisperPipeline = null;

/**
 * Lazily initializes and returns the Whisper pipeline
 * @returns {Promise<Function>} The Whisper transcription pipeline
 */
async function getWhisperPipeline() {
  if (!whisperPipeline) {
    console.log('Loading Whisper model (this may take a moment on first use)...');
    const { pipeline } = await import('@xenova/transformers');
    whisperPipeline = await pipeline('automatic-speech-recognition', WHISPER_MODEL);
    console.log('✓ Whisper model loaded');
  }
  return whisperPipeline;
}

/**
 * Parses multipart form data to extract audio buffer
 * @param {Buffer} buffer - Raw request buffer
 * @param {string} boundary - Multipart boundary string
 * @returns {Buffer} Extracted audio data
 */
function extractAudioFromMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from('--' + boundary);
  const startMarker = Buffer.from('\r\n\r\n');
  
  let audioStart = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;
  audioStart = buffer.indexOf(startMarker, audioStart) + 4;
  const audioEnd = buffer.indexOf(boundaryBuffer, audioStart) - 2;
  
  return buffer.slice(audioStart, audioEnd);
}

/**
 * Saves audio data to a temporary file
 * @param {Buffer} audioData - Audio data to save
 * @param {string} filename - Filename for the temp file
 * @returns {string} Path to the saved file
 */
function saveTempAudioFile(audioData, filename) {
  const tempFile = path.join(TEMP_DIR, filename);
  fs.writeFileSync(tempFile, audioData);
  console.log('Saved audio:', audioData.length, 'bytes');
  return tempFile;
}

/**
 * Converts WebM audio to WAV format using ffmpeg
 * @param {string} inputPath - Path to input WebM file
 * @param {string} outputPath - Path for output WAV file
 * @returns {boolean} True if conversion succeeded, false if ffmpeg unavailable
 */
function convertToWav(inputPath, outputPath) {
  try {
    execSync(
      `ffmpeg -y -i "${inputPath}" -ar ${AUDIO_CONSTANTS.SAMPLE_RATE} -ac 1 -c:a pcm_s16le "${outputPath}"`,
      { stdio: 'ignore' }
    );
    console.log('Converted to WAV');
    return true;
  } catch (error) {
    console.log('ffmpeg not available, using webm directly');
    return false;
  }
}

/**
 * Parses WAV file and extracts audio data as Float32Array
 * Includes auto-gain adjustment for quiet audio and clip suppression
 * @param {string} audioPath - Path to audio file (WAV preferred)
 * @returns {Float32Array} Audio samples normalized to [-1, 1] with gain adjustment
 */
function parseWavToFloat32(audioPath) {
  const wavBuffer = fs.readFileSync(audioPath);
  
  // Parse WAV header to locate audio data
  // WAV format: RIFF header + 'data' chunk contains PCM samples
  const dataStart = wavBuffer.indexOf(Buffer.from('data')) + 8;
  const pcmData = wavBuffer.slice(dataStart);
  
  // Convert 16-bit PCM to Float32Array with normalization
  const floatData = new Float32Array(pcmData.length / 2);
  for (let i = 0; i < floatData.length; i++) {
    const sample = pcmData.readInt16LE(i * 2);
    floatData[i] = sample / AUDIO_CONSTANTS.PCM_NORMALIZATION_FACTOR;
  }
  
  // Auto-gain adjustment: detect peak level and normalize if too quiet
  // Whisper works better with consistent audio levels
  let maxAbsValue = 0;
  for (let i = 0; i < floatData.length; i++) {
    const absValue = Math.abs(floatData[i]);
    if (absValue > maxAbsValue) maxAbsValue = absValue;
  }
  
  console.log(`Audio level: ${(maxAbsValue * 100).toFixed(1)}%`);
  
  // If audio is too quiet (below 30% of max range), apply gentle gain
  if (maxAbsValue > 0 && maxAbsValue < 0.3) {
    const gainFactor = 0.3 / maxAbsValue;
    console.log(`Applying gain adjustment: ${gainFactor.toFixed(2)}x`);
    for (let i = 0; i < floatData.length; i++) {
      // Clip if it goes over 1.0 to prevent distortion
      floatData[i] = Math.max(-1.0, Math.min(1.0, floatData[i] * gainFactor));
    }
  }
  
  return floatData;
}

/**
 * Transcription result
 * @typedef {Object} TranscriptionResult
 * @property {string} [transcription] - Transcribed text (on success)
 * @property {string} [error] - Error message (on failure)
 */

/**
 * Transcribes audio from a multipart request
 * @param {Buffer} requestBuffer - Raw request buffer with multipart data
 * @param {string} boundary - Multipart boundary string
 * @returns {Promise<TranscriptionResult>} Transcription result
 */
async function transcribeAudio(requestBuffer, boundary) {
  // Extract audio from multipart data
  const audioData = extractAudioFromMultipart(requestBuffer, boundary);
  
  // Save to temp file
  const webmPath = saveTempAudioFile(audioData, 'recording.webm');
  const wavPath = path.join(TEMP_DIR, 'recording.wav');
  
  // Try to convert to WAV with ffmpeg
  const converted = convertToWav(webmPath, wavPath);
  const audioPath = converted && fs.existsSync(wavPath) ? wavPath : webmPath;
  
  // Parse audio file and convert to Float32Array
  const floatData = parseWavToFloat32(audioPath);
  
  // Run transcription
  const whisper = await getWhisperPipeline();
  const result = await whisper(floatData);
  
  const transcription = (result.text || result).trim();
  console.log('Transcription:', transcription);
  
  return { transcription };
}

/**
 * Ensures the temp directory exists
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

module.exports = {
  getWhisperPipeline,
  transcribeAudio,
  ensureTempDir
};
