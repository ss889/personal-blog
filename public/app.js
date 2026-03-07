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
  autoPushCheckbox: document.getElementById('autoPush')
};

// Application State
const state = {
  history: [],
  autoPushEnabled: true,
  isRecording: false,
  mediaRecorder: null,
  audioChunks: []
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
  return content
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
 * Handles the response from a file update
 * @param {Object} data - Response data from the server
 */
function handleFileUpdateResponse(data) {
  if (data.fileUpdated) {
    addMessage('system', `✓ Updated: ${data.fileUpdated}`, true);
    
    if (data.pushed) {
      addMessage('system', '✓ Pushed to GitHub! Site updating...', true);
    } else if (data.pushError) {
      addMessage('system', `❌ Auto-push failed: ${data.pushError}`, true);
    }
  }
}

/**
 * Sends a message to the chat API
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
    const response = await fetchChatResponse(state.history, state.autoPushEnabled);
    hideTypingIndicator();
    
    handleFileUpdateResponse(response);
    addMessage('assistant', response.response);
    state.history.push({ role: 'assistant', content: response.response });
  } catch (error) {
    hideTypingIndicator();
    addMessage('assistant', `Error: ${error.message}`);
  }

  elements.sendBtn.disabled = false;
  elements.input.focus();
}

/**
 * Fetches a response from the chat API
 * @param {Array} messages - Chat history
 * @param {boolean} autoPush - Whether to auto-push changes
 * @returns {Promise<Object>} API response
 */
async function fetchChatResponse(messages, autoPush) {
  const response = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, autoPush })
  });
  return response.json();
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
