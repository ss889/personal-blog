const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = 3001;
const OLLAMA_URL = "http://localhost:11434";
const CONTENT_DIR = path.join(__dirname, "content");
const MODEL_NAME = "blog-editor";
const TEMP_DIR = path.join(__dirname, "temp");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Whisper transcription using @xenova/transformers
let pipeline = null;
async function getWhisperPipeline() {
  if (!pipeline) {
    console.log("Loading Whisper model (first time may take a minute)...");
    const { pipeline: createPipeline } = await import("@xenova/transformers");
    pipeline = await createPipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en");
    console.log("✓ Whisper model loaded");
  }
  return pipeline;
}

// Parse multipart form data for audio upload
function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from("--" + boundary);
  
  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;
  while (true) {
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;
    
    const part = buffer.slice(start, end - 2);
    const headerEnd = part.indexOf("\\r\\n\\r\\n");
    if (headerEnd === -1) {
      const headerEnd2 = part.indexOf(Buffer.from([13, 10, 13, 10]));
      if (headerEnd2 !== -1) {
        const data = part.slice(headerEnd2 + 4);
        parts.push({ data });
      }
    } else {
      const data = part.slice(headerEnd + 4);
      parts.push({ data });
    }
    start = end + boundaryBuffer.length + 2;
  }
  return parts;
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Editor</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%);
      color: #f0f0f0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    header {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      padding: 16px 28px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    header h1 { 
      font-size: 17px; 
      font-weight: 600;
      background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.3px;
    }
    
    header .model { 
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      padding: 5px 14px; 
      border-radius: 20px; 
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    
    .status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }
    
    .status .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 12px #22c55e;
      animation: glow 2s ease-in-out infinite;
    }
    
    @keyframes glow {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .auto-push {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-left: 20px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.04);
      border-radius: 10px;
      font-size: 12px;
      color: #888;
      transition: all 0.2s ease;
    }
    
    .auto-push:hover {
      background: rgba(255,255,255,0.07);
    }
    
    .auto-push input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #22c55e;
    }
    
    .auto-push-label {
      cursor: pointer;
      font-weight: 500;
    }
    
    .files {
      padding: 10px 28px;
      background: rgba(0,0,0,0.2);
      font-size: 12px;
      color: #555;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.03);
    }
    
    .files span { 
      color: #60a5fa;
      background: rgba(96,165,250,0.1);
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .files span:hover {
      background: rgba(96,165,250,0.2);
    }
    
    .chat {
      flex: 1;
      overflow-y: auto;
      padding: 28px;
      display: flex;
      flex-direction: column;
      gap: 18px;
      scroll-behavior: smooth;
    }
    
    .chat::-webkit-scrollbar {
      width: 6px;
    }
    
    .chat::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .chat::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
    }
    
    .message {
      max-width: 75%;
      padding: 14px 18px;
      border-radius: 18px;
      line-height: 1.6;
      font-size: 14px;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border-bottom-right-radius: 6px;
      box-shadow: 0 4px 20px rgba(59,130,246,0.3);
    }
    
    .message.assistant {
      align-self: flex-start;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-bottom-left-radius: 6px;
    }
    
    .message.system {
      align-self: center;
      background: rgba(34,197,94,0.1);
      border: 1px solid rgba(34,197,94,0.2);
      color: #4ade80;
      font-size: 13px;
      padding: 10px 18px;
      border-radius: 30px;
      font-weight: 500;
    }
    
    .message pre {
      background: rgba(0,0,0,0.3);
      padding: 14px;
      border-radius: 10px;
      margin-top: 10px;
      overflow-x: auto;
      font-size: 13px;
      font-family: 'SF Mono', 'Fira Code', monospace;
      border: 1px solid rgba(255,255,255,0.05);
    }
    
    .input-area {
      padding: 20px 28px;
      background: rgba(255,255,255,0.02);
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    
    .input-container {
      display: flex;
      gap: 12px;
      max-width: 900px;
      margin: 0 auto;
      align-items: center;
    }
    
    input[type="text"] {
      flex: 1;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px;
      padding: 14px 20px;
      color: #f0f0f0;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    
    input[type="text"]:focus { 
      outline: none; 
      border-color: rgba(59,130,246,0.5);
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    
    input[type="text"]::placeholder {
      color: #555;
    }
    
    button {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      border-radius: 12px;
      padding: 14px 28px;
      color: white;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    button:hover { 
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(59,130,246,0.4);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    button:disabled { 
      background: #333;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .typing {
      display: flex;
      gap: 5px;
      padding: 14px 18px;
      align-items: center;
    }
    
    .typing span {
      width: 8px;
      height: 8px;
      background: #666;
      border-radius: 50%;
      animation: bounce 1.4s infinite;
    }
    
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    
    .record-btn {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      padding: 0;
      box-shadow: 0 4px 20px rgba(239,68,68,0.3);
      transition: all 0.2s ease;
    }
    
    .record-btn:hover { 
      transform: scale(1.05);
      box-shadow: 0 6px 25px rgba(239,68,68,0.4);
    }
    
    .record-btn.recording {
      animation: pulse 1.5s infinite;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }
    
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
      50% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
    }
    
    .recording-status {
      color: #ef4444;
      font-size: 13px;
      text-align: center;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <header>
    <h1>✨ Blog Editor</h1>
    <span class="model">AI Powered</span>
    <div class="status">
      <span class="dot"></span>
      Connected
    </div>
    <label class="auto-push">
      <input type="checkbox" id="autoPush" checked>
      <span class="auto-push-label">Auto-deploy</span>
    </label>
  </header>
  <div class="files">
    <span style="background:none;color:#555;padding:0;">Files:</span>
    <span>homepage</span>
    <span>hello-world</span>
    <span>getting-started-with-nextjs</span>
  </div>
  <div class="chat" id="chat">
    <div class="message assistant">
      Hey! I'm your AI blog editor. What would you like to create or update?
      <br><br>
      <span style="color:#888">Try something like:</span><br>
      • "Write a post about my weekend project"<br>
      • "Make the homepage more personal"<br>
      • "Update hello-world with my story"
    </div>
  </div>
  <div class="input-area">
    <div class="input-container">
      <button id="record" class="record-btn" title="Record voice">🎤</button>
      <input type="text" id="input" placeholder="What would you like to write about?" autofocus>
      <button id="send">Send</button>
    </div>
  </div>
  <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    const autoPushCheckbox = document.getElementById('autoPush');
    let history = [];
    let autoPushEnabled = true;

    function addMessage(role, content, isSystem = false) {
      const div = document.createElement('div');
      div.className = 'message ' + (isSystem ? 'system' : role);
      div.innerHTML = content.replace(/\\n/g, '<br>').replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, '<pre>$2</pre>');
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'message assistant typing';
      div.id = 'typing';
      div.innerHTML = '<span></span><span></span><span></span>';
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function hideTyping() {
      const el = document.getElementById('typing');
      if (el) el.remove();
    }

    async function send() {
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      sendBtn.disabled = true;
      addMessage('user', text);
      history.push({ role: 'user', content: text });

      showTyping();

      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, autoPush: autoPushEnabled })
        });
        const data = await res.json();
        hideTyping();

        if (data.fileUpdated) {
          addMessage('system', '✓ Updated: ' + data.fileUpdated, true);
          if (data.pushed) {
            addMessage('system', '✓ Pushed to GitHub! Site updating...', true);
          } else if (data.pushError) {
            addMessage('system', '❌ Auto-push failed: ' + data.pushError, true);
          }
        }
        
        addMessage('assistant', data.response);
        history.push({ role: 'assistant', content: data.response });
      } catch (err) {
        hideTyping();
        addMessage('assistant', 'Error: ' + err.message);
      }

      sendBtn.disabled = false;
      input.focus();
    }

    autoPushCheckbox.onchange = () => {
      autoPushEnabled = autoPushCheckbox.checked;
    };
    // Voice Recording
    const recordBtn = document.getElementById('record');
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          await processRecording(audioBlob);
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('recording');
        recordBtn.innerHTML = '⏹';
        addMessage('system', '🎤 Recording... Click again to stop.', true);
      } catch (err) {
        addMessage('system', '❌ Microphone access denied: ' + err.message, true);
      }
    }

    function stopRecording() {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.classList.remove('recording');
        recordBtn.innerHTML = '🎤';
      }
    }

    async function processRecording(audioBlob) {
      addMessage('system', '📝 Transcribing...', true);
      showTyping();

      try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const res = await fetch('/transcribe', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        hideTyping();

        if (data.error) {
          addMessage('system', '❌ Transcription failed: ' + data.error, true);
          return;
        }

        addMessage('system', '✓ Transcribed: \"' + data.transcription + '\"', true);
        
        // Now send to LLM to format as blog post
        const prompt = 'Create a blog post from this spoken content: ' + data.transcription;
        addMessage('user', prompt);
        history.push({ role: 'user', content: prompt });

        showTyping();
        const chatRes = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, autoPush: autoPushEnabled })
        });
        const chatData = await chatRes.json();
        hideTyping();

        if (chatData.fileUpdated) {
          addMessage('system', '✓ Updated: ' + chatData.fileUpdated, true);
          if (chatData.pushed) {
            addMessage('system', '✓ Pushed to GitHub! Site updating...', true);
          } else if (chatData.pushError) {
            addMessage('system', '❌ Auto-push failed: ' + chatData.pushError, true);
          }
        }
        addMessage('assistant', chatData.response);
        history.push({ role: 'assistant', content: chatData.response });
      } catch (err) {
        hideTyping();
        addMessage('system', '❌ Error: ' + err.message, true);
      }
    }

    recordBtn.onclick = () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    sendBtn.onclick = send;
    input.onkeydown = (e) => { if (e.key === 'Enter') send(); };
  </script>
</body>
</html>`;

async function chatWithOllama(messages) {
  const systemPrompt = `You are a blog content editor. Output ONLY markdown content for blog files.

CRITICAL FORMAT - Always respond exactly like this:

\`\`\`markdown
FILE: homepage
---
title: Your Title Here
subtitle: Optional subtitle
---

# Main Heading

Your content here with proper markdown formatting.
\`\`\`

RULES:
1. Always wrap output in markdown code block
2. First line inside must be FILE: followed by filename (homepage, hello-world, getting-started-with-nextjs)
3. Include proper front matter with --- delimiters
4. For posts, include: title, date (YYYY-MM-DD format), excerpt in front matter
5. Output COMPLETE file content
6. After the code block, add a brief message about what you changed.

Available files: homepage, hello-world, getting-started-with-nextjs`;

  const fullMessages = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: fullMessages,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.message?.content || "No response";
}

function extractAndApplyJson(response) {
  // Try markdown format first: ```markdown\nFILE: filename\n...```
  const mdMatch = response.match(/```(?:markdown)?\s*\n?\s*FILE:\s*(\S+)\s*\n([\s\S]*?)```/i);
  if (mdMatch) {
    const filename = mdMatch[1].replace('.md', '');
    const content = mdMatch[2].trim();
    
    let filePath;
    if (filename === "homepage") {
      filePath = path.join(CONTENT_DIR, "homepage.md");
    } else {
      filePath = path.join(CONTENT_DIR, "posts", `${filename}.md`);
    }

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
    return filename;
  }

  // Fallback: Try JSON format
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (parsed.action && parsed.file && parsed.content) {
      let filePath;
      if (parsed.file === "homepage") {
        filePath = path.join(CONTENT_DIR, "homepage.md");
      } else if (parsed.file.startsWith("posts/")) {
        const slug = parsed.file.replace("posts/", "");
        filePath = path.join(CONTENT_DIR, "posts", `${slug}.md`);
      } else {
        return null;
      }

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, parsed.content);
      console.log(`✓ Updated: ${filePath}`);
      return parsed.file;
    }
  } catch (e) {
    console.error("JSON parse error:", e.message);
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { messages, autoPush } = JSON.parse(body);
        const response = await chatWithOllama(messages);
        const fileUpdated = extractAndApplyJson(response);

        // Remove JSON block from displayed response
        const cleanResponse = response.replace(/```json[\s\S]*?```\s*/g, "").trim();

        let pushed = false;
        let pushError = null;
        
        // Auto-push if enabled and file was updated
        if (autoPush && fileUpdated) {
          try {
            const { execSync } = require("child_process");
            const envPath = path.join(__dirname, "..", ".env");
            const envContent = fs.readFileSync(envPath, "utf8");
            const tokenMatch = envContent.match(/GITHUB_API_TOKEN=(.+)/);
            const token = tokenMatch ? tokenMatch[1].trim() : null;

            if (token) {
              execSync("git add -A", { cwd: __dirname });
              execSync('git commit -m "Update blog content"', { cwd: __dirname });
              execSync(`git remote set-url origin https://${token}@github.com/ss889/personal-blog.git`, { cwd: __dirname });
              execSync("git push", { cwd: __dirname });
              execSync("git remote set-url origin https://github.com/ss889/personal-blog.git", { cwd: __dirname });
              pushed = true;
              console.log("✓ Auto-pushed to GitHub");
            } else {
              pushError = "No GitHub token found";
            }
          } catch (e) {
            pushError = e.message;
            console.error("Auto-push error:", e.message);
          }
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: cleanResponse || "Done!", fileUpdated, pushed, pushError }));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (req.method === "POST" && req.url === "/push") {
    const { execSync } = require("child_process");
    try {
      // Read token from .env file
      const envPath = path.join(__dirname, "..", ".env");
      const envContent = fs.readFileSync(envPath, "utf8");
      const tokenMatch = envContent.match(/GITHUB_API_TOKEN=(.+)/);
      const token = tokenMatch ? tokenMatch[1].trim() : null;

      if (!token) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "No GitHub token found" }));
        return;
      }

      execSync("git add -A", { cwd: __dirname });
      execSync('git commit -m "Update blog content"', { cwd: __dirname });
      execSync(`git remote set-url origin https://${token}@github.com/ss889/personal-blog.git`, { cwd: __dirname });
      execSync("git push", { cwd: __dirname });
      // Reset remote URL to not include token
      execSync("git remote set-url origin https://github.com/ss889/personal-blog.git", { cwd: __dirname });

      console.log("✓ Pushed to GitHub");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } catch (err) {
      console.error("Push error:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  if (req.method === "POST" && req.url === "/transcribe") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Get boundary from content-type
        const contentType = req.headers["content-type"] || "";
        const boundaryMatch = contentType.match(/boundary=(.+)/);
        if (!boundaryMatch) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No boundary found" }));
          return;
        }
        
        // Find audio data in multipart
        const boundary = boundaryMatch[1];
        const boundaryBuffer = Buffer.from("--" + boundary);
        const startMarker = Buffer.from("\r\n\r\n");
        
        let audioStart = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;
        audioStart = buffer.indexOf(startMarker, audioStart) + 4;
        const audioEnd = buffer.indexOf(boundaryBuffer, audioStart) - 2;
        const audioData = buffer.slice(audioStart, audioEnd);
        
        // Save audio to temp file
        const tempFile = path.join(TEMP_DIR, "recording.webm");
        fs.writeFileSync(tempFile, audioData);
        console.log("Saved audio:", audioData.length, "bytes");
        
        // Use ffmpeg to convert to wav if available, otherwise transcribe directly
        const wavFile = path.join(TEMP_DIR, "recording.wav");
        
        // Try to convert with ffmpeg
        try {
          const { execSync } = require("child_process");
          execSync(`ffmpeg -y -i "${tempFile}" -ar 16000 -ac 1 -c:a pcm_s16le "${wavFile}"`, { stdio: "ignore" });
          console.log("Converted to WAV");
        } catch (e) {
          console.log("ffmpeg not available, using webm directly");
        }
        
        // Use Whisper to transcribe
        const whisper = await getWhisperPipeline();
        const audioPath = fs.existsSync(wavFile) ? wavFile : tempFile;
        
        // Read WAV file and convert to Float32Array for Whisper
        const wavBuffer = fs.readFileSync(audioPath);
        
        // Parse WAV header to get audio data
        // WAV format: RIFF header (44 bytes) + raw PCM data
        const dataStart = wavBuffer.indexOf(Buffer.from("data")) + 8;
        const pcmData = wavBuffer.slice(dataStart);
        
        // Convert 16-bit PCM to Float32Array
        const floatData = new Float32Array(pcmData.length / 2);
        for (let i = 0; i < floatData.length; i++) {
          const sample = pcmData.readInt16LE(i * 2);
          floatData[i] = sample / 32768.0;
        }
        
        const result = await whisper(floatData);
        const transcription = result.text || result;
        
        console.log("Transcription:", transcription);
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ transcription: transcription.trim() }));
      } catch (err) {
        console.error("Transcription error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// Check if model exists, create if not
async function ensureModel() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    const data = await res.json();
    const exists = data.models?.some((m) => m.name.startsWith(MODEL_NAME));

    if (!exists) {
      console.log("Creating blog-editor model...");
      const modelfile = fs.readFileSync(path.join(__dirname, "Modelfile"), "utf8");
      await fetch(`${OLLAMA_URL}/api/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: MODEL_NAME, modelfile }),
      });
      console.log("✓ Model created");
    }
  } catch (err) {
    console.error("Could not connect to Ollama:", err.message);
    process.exit(1);
  }
}

ensureModel().then(() => {
  server.listen(PORT, () => {
    console.log(`\n📝 Blog Editor running at http://localhost:${PORT}\n`);
    console.log("Chat with your blog-editor model to update content.");
    console.log("Changes are automatically saved to your markdown files.\n");
  });
});
