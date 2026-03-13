/**
 * Blog Editor Frontend Application
 * Handles UI interactions, voice recording, and API communication
 */

// DOM Element References
const elements = {
  chat: document.getElementById('chat'),
  input: document.getElementById('input'),
  sendBtn: document.getElementById('send'),
  recordBtn: document.getElementById('record'),
  autoPushCheckbox: document.getElementById('autoPush'),
  quickActions: document.getElementById('quickActions')
};

// Application State
const state = {
  history: [],
  autoPushEnabled: true,
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  mode: 'content' // 'content' | 'design'
};

// Audio Configuration
const AUDIO_CONFIG = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 16000
};

/**
 * Adds a message to the chat UI
 * @param {string} role - Message role: 'user', 'assistant', or 'system'
 * @param {string} content - Message content
 * @param {boolean} isSystem - Whether this is a system message
 * @returns {HTMLElement} The created message element
 */
function addMessage(role, content, isSystem = false) {
  const div = document.createElement('div');
  div.className = `message ${isSystem ? 'system' : role}`;
  div.innerHTML = formatMessageContent(content);
  elements.chat.appendChild(div);
  scrollChatToBottom();
  return div;
}

/**
 * Formats message content with line breaks and code blocks
 * @param {string} content - Raw message content
 * @returns {string} Formatted HTML content
 */
function formatMessageContent(content) {
  if (!content) return '';
  return String(content)
    .replace(/\n/g, '<br>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre>$2</pre>');
}

/**
 * Scrolls the chat container to the bottom
 */
function scrollChatToBottom() {
  elements.chat.scrollTop = elements.chat.scrollHeight;
}

/**
 * Shows the typing indicator
 */
function showTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'message assistant typing';
  div.id = 'typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  elements.chat.appendChild(div);
  scrollChatToBottom();
}

/**
 * Hides the typing indicator
 */
function hideTypingIndicator() {
  const typingEl = document.getElementById('typing');
  if (typingEl) {
    typingEl.remove();
  }
}

/**
 * Switches between content and design editing modes
 * @param {'content'|'design'} mode - Target mode
 */
function setMode(mode) {
  state.mode = mode;
  state.history = []; // Clear history when switching modes

  const isDesign = mode === 'design';

  document.body.classList.toggle('design-mode', isDesign);

  document.getElementById('tabContent').className = `mode-tab ${isDesign ? '' : 'active-content'}`;
  document.getElementById('tabDesign').className = `mode-tab ${isDesign ? 'active-design' : ''}`;
  document.getElementById('modeLabel').textContent = isDesign ? 'Design Mode' : 'Content Mode';
  document.getElementById('modeLabel').style.background = isDesign
    ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)';
  document.getElementById('modeLabel').style.color = isDesign ? '#c084fc' : '#60a5fa';
  document.getElementById('filesBar').style.display = isDesign ? 'none' : 'flex';
  document.getElementById('designBar').style.display = isDesign ? 'flex' : 'none';
  document.getElementById('designHint').style.display = isDesign ? 'block' : 'none';
  if (elements.quickActions) {
    elements.quickActions.classList.toggle('design-actions', isDesign);
  }
  elements.input.placeholder = isDesign
    ? 'Describe a design change, e.g. "make the background dark with a gradient"'
    : 'What would you like to write about?';

  const modeLabel = isDesign ? 'Design Mode' : 'Content Mode';
  addMessage('system', `Switched to ${modeLabel}. History cleared.`, true);
}

/**
 * Handles the response from a design file update
 * @param {Object} data - Response data from the design-chat server
 */
function handleDesignUpdateResponse(data) {
  if (data.reverted) {
    const div = document.createElement('div');
    div.className = 'message design-reverted';
    div.textContent = `⚠️ Changes reverted: ${data.designError || 'Build check failed'}`;
    elements.chat.appendChild(div);
    scrollChatToBottom();
    return;
  }

  if (data.filesUpdated && data.filesUpdated.length > 0) {
    const div = document.createElement('div');
    div.className = 'message design-updated';
    div.textContent = `✓ Design updated: ${data.filesUpdated.join(', ')}`;
    elements.chat.appendChild(div);
    scrollChatToBottom();

    if (data.pushed) {
      addMessage('system', '✓ Pushed to GitHub! Site rebuilding...', true);
    } else if (data.pushError) {
      addMessage('system', `❌ Auto-push failed: ${data.pushError}`, true);
    }
  }
}

/**
 * Opens the preview modal for a given content file
 * @param {string} filename - File to preview
 */
function openPreview(filename) {
  const modal = document.getElementById('previewModal');
  const frame = document.getElementById('previewFrame');
  const title = document.getElementById('previewTitle');
  frame.src = `/preview?file=${encodeURIComponent(filename)}`;
  title.textContent = filename;
  modal.style.display = 'block';
}

/**
 * Closes the preview modal
 */
function closePreview() {
  const modal = document.getElementById('previewModal');
  const frame = document.getElementById('previewFrame');
  modal.style.display = 'none';
  frame.src = '';
}

// Close preview on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePreview();
});

/**
 * Handles the response from a content file update
 * @param {Object} data - Response data from the server
 */
function handleFileUpdateResponse(data) {
  if (data.fileUpdated) {
    // Show update notification with preview button
    const div = document.createElement('div');
    div.className = 'message system';
    div.style.cssText = 'display:flex;align-items:center;gap:10px;max-width:100%;';
    div.innerHTML = `<span>✓ Updated: ${data.fileUpdated}</span>
      <button onclick="openPreview('${data.fileUpdated}')" style="background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:4px 12px;color:#60a5fa;font-size:12px;font-weight:500;cursor:pointer;transform:none;box-shadow:none;">👁 Preview</button>`;
    elements.chat.appendChild(div);
    scrollChatToBottom();

    if (data.pushed) {
      addMessage('system', '✓ Pushed to GitHub! Site updating...', true);
    } else if (data.pushError) {
      addMessage('system', `❌ Auto-push failed: ${data.pushError}`, true);
    }
  }
}

/**
 * Sends a message to the chat API (content or design mode)
 */
async function sendMessage() {
  const text = elements.input.value.trim();
  if (!text) return;

  elements.input.value = '';
  elements.sendBtn.disabled = true;

  addMessage('user', text);
  state.history.push({ role: 'user', content: text });
  showTypingIndicator();

  try {
    if (state.mode === 'design') {
      const response = await fetchDesignResponse(state.history, state.autoPushEnabled);
      hideTypingIndicator();
      if (response.error) {
        addMessage('assistant', `Error: ${response.error}`);
      } else {
        handleDesignUpdateResponse(response);
        const msg = response.response || 'Done!';
        addMessage('assistant', msg);
        state.history.push({ role: 'assistant', content: msg });
      }
    } else {
      const response = await fetchChatResponse(state.history, state.autoPushEnabled);
      hideTypingIndicator();
      handleFileUpdateResponse(response);
      addMessage('assistant', response.response);
      state.history.push({ role: 'assistant', content: response.response });
    }
  } catch (error) {
    hideTypingIndicator();
    addMessage('assistant', `Error: ${error.message}`);
  }

  elements.sendBtn.disabled = false;
  elements.input.focus();
}

/**
 * Fetches a response from the design chat API
 * @param {Array} messages - Chat history
 * @param {boolean} autoPush - Whether to auto-push changes
 * @returns {Promise<Object>} API response
 */
async function fetchDesignResponse(messages, autoPush) {
  return fetchJsonWithRetry('/design-chat', { messages, autoPush });
}

/**
 * Fetches a response from the chat API
 * @param {Array} messages - Chat history
 * @param {boolean} autoPush - Whether to auto-push changes
 * @returns {Promise<Object>} API response
 */
async function fetchChatResponse(messages, autoPush) {
  return fetchJsonWithRetry('/chat', { messages, autoPush });
}

/**
 * Performs a JSON POST with timeout + one retry for transient failures
 * @param {string} url
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
async function fetchJsonWithRetry(url, payload) {
  const attempt = async (targetUrl) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 360000);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = data?.error || data?.message || `Request failed (${response.status})`;
        throw new Error(error);
      }

      return data;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    return await attempt(url);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 6 minutes. Ollama is still processing; try again or reduce scope to one file.');
    }

    if ((error.message || '').toLowerCase().includes('fetch failed')) {
      const fallbackUrl = `http://localhost:3001${url}`;
      try {
        return await attempt(fallbackUrl);
      } catch (fallbackError) {
        if (fallbackError.name === 'AbortError') {
          throw new Error('Request timed out after 6 minutes. Ollama is still processing; try again or reduce scope to one file.');
        }
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    return attempt(url);
  }
}

/**
 * Starts voice recording
 */
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONFIG });
    
    state.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    state.audioChunks = [];

    state.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.audioChunks.push(event.data);
      }
    };

    state.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
      stream.getTracks().forEach(track => track.stop());
      await processRecording(audioBlob);
    };

    // Collect audio data every 100ms to avoid missing the start
    state.mediaRecorder.start(100);
    state.isRecording = true;
    
    updateRecordButtonState(true);
    addMessage('system', '🎤 Recording... Speak now! Click again to stop.', true);
  } catch (error) {
    addMessage('system', `❌ Microphone access denied: ${error.message}`, true);
  }
}

/**
 * Stops voice recording
 */
function stopRecording() {
  if (state.mediaRecorder && state.isRecording) {
    state.mediaRecorder.stop();
    state.isRecording = false;
    updateRecordButtonState(false);
  }
}

/**
 * Updates the record button visual state
 * @param {boolean} isRecording - Whether currently recording
 */
function updateRecordButtonState(isRecording) {
  if (isRecording) {
    elements.recordBtn.classList.add('recording');
    elements.recordBtn.innerHTML = '⏹';
  } else {
    elements.recordBtn.classList.remove('recording');
    elements.recordBtn.innerHTML = '🎤';
  }
}

/**
 * Processes a recorded audio blob
 * @param {Blob} audioBlob - The recorded audio
 */
async function processRecording(audioBlob) {
  addMessage('system', '📝 Transcribing...', true);
  showTypingIndicator();

  try {
    const transcription = await transcribeAudio(audioBlob);
    hideTypingIndicator();

    if (transcription.error) {
      addMessage('system', `❌ Transcription failed: ${transcription.error}`, true);
      return;
    }

    addMessage('system', `✓ Transcribed: "${transcription.transcription}"`, true);
    
    // Send transcription to LLM for processing
    const prompt = `Create a blog post from this spoken content: ${transcription.transcription}`;
    await sendTranscriptionToChat(prompt);
  } catch (error) {
    hideTypingIndicator();
    addMessage('system', `❌ Error: ${error.message}`, true);
  }
}

/**
 * Transcribes audio via the server API
 * @param {Blob} audioBlob - Audio to transcribe
 * @returns {Promise<Object>} Transcription result
 */
async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch('/transcribe', {
    method: 'POST',
    body: formData
  });
  return response.json();
}

/**
 * Sends a transcription to the chat API
 * @param {string} prompt - The prompt containing the transcription
 */
async function sendTranscriptionToChat(prompt) {
  addMessage('user', prompt);
  state.history.push({ role: 'user', content: prompt });

  showTypingIndicator();
  
  try {
    const response = await fetchChatResponse(state.history, state.autoPushEnabled);
    hideTypingIndicator();

    handleFileUpdateResponse(response);
    addMessage('assistant', response.response);
    state.history.push({ role: 'assistant', content: response.response });
  } catch (error) {
    hideTypingIndicator();
    addMessage('system', `❌ Error: ${error.message}`, true);
  }
}

/**
 * Toggles recording state
 */
function toggleRecording() {
  if (state.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

/**
 * Sends a predefined quick action prompt
 * @param {string} prompt
 * @param {'content'|'design'} mode
 */
async function runQuickAction(prompt, mode) {
  if (!prompt || elements.sendBtn.disabled) return;
  if (mode && state.mode !== mode) {
    setMode(mode);
  }
  elements.input.value = prompt;
  await sendMessage();
}

/**
 * Initializes quick action button click handling
 */
function initQuickActions() {
  if (!elements.quickActions) return;
  elements.quickActions.addEventListener('click', async (event) => {
    const target = event.target.closest('.quick-action-btn');
    if (!target) return;
    const prompt = target.getAttribute('data-prompt') || '';
    const mode = target.getAttribute('data-mode') || state.mode;
    await runQuickAction(prompt, mode);
  });
}

// Event Listeners
elements.autoPushCheckbox.onchange = () => {
  state.autoPushEnabled = elements.autoPushCheckbox.checked;
};

elements.recordBtn.onclick = toggleRecording;
elements.sendBtn.onclick = sendMessage;
elements.input.onkeydown = (event) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
};

initQuickActions();
