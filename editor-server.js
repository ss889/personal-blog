const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const OLLAMA_URL = "http://localhost:11434";
const CONTENT_DIR = path.join(__dirname, "content");
const MODEL_NAME = "blog-editor";

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog Editor - Ollama</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: #e5e5e5;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #2d2d2d;
      padding: 16px 24px;
      border-bottom: 1px solid #404040;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    header h1 { font-size: 18px; font-weight: 600; }
    header .model { 
      background: #4a4a4a; 
      padding: 4px 12px; 
      border-radius: 12px; 
      font-size: 12px;
    }
    .status {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #888;
    }
    .status .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
    }
    .chat {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      line-height: 1.5;
    }
    .message.user {
      align-self: flex-end;
      background: #3b82f6;
      color: white;
    }
    .message.assistant {
      align-self: flex-start;
      background: #2d2d2d;
    }
    .message.system {
      align-self: center;
      background: #22c55e22;
      border: 1px solid #22c55e44;
      color: #22c55e;
      font-size: 13px;
    }
    .message pre {
      background: #1a1a1a;
      padding: 12px;
      border-radius: 8px;
      margin-top: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    .input-area {
      padding: 16px 24px;
      background: #2d2d2d;
      border-top: 1px solid #404040;
    }
    .input-container {
      display: flex;
      gap: 12px;
      max-width: 900px;
      margin: 0 auto;
    }
    input {
      flex: 1;
      background: #1a1a1a;
      border: 1px solid #404040;
      border-radius: 8px;
      padding: 12px 16px;
      color: #e5e5e5;
      font-size: 14px;
    }
    input:focus { outline: none; border-color: #3b82f6; }
    button {
      background: #3b82f6;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      color: white;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: #2563eb; }
    button:disabled { background: #4a4a4a; cursor: not-allowed; }
    .files {
      padding: 8px 24px;
      background: #252525;
      font-size: 12px;
      color: #888;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .files span { color: #3b82f6; }
    .typing {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
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
      30% { transform: translateY(-8px); }
    }
  </style>
</head>
<body>
  <header>
    <h1>📝 Blog Editor</h1>
    <span class="model">blog-editor</span>
    <div class="status">
      <span class="dot"></span>
      Connected to Ollama
    </div>
  </header>
  <div class="files">
    Available files: <span>homepage</span> <span>posts/hello-world</span> <span>posts/getting-started-with-nextjs</span>
  </div>
  <div class="chat" id="chat">
    <div class="message assistant">
      Hi! I'm your blog editor. Tell me what content you'd like to change. For example:
      <br><br>
      • "Update the homepage to be more casual"<br>
      • "Write a new post about JavaScript tips"<br>
      • "Change hello-world post to talk about my coding journey"
    </div>
  </div>
  <div class="input-area">
    <div class="input-container">
      <input type="text" id="input" placeholder="Tell me what to change..." autofocus>
      <button id="send">Send</button>
    </div>
  </div>
  <script>
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const sendBtn = document.getElementById('send');
    let history = [];

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
          body: JSON.stringify({ messages: history })
        });
        const data = await res.json();
        hideTyping();

        if (data.fileUpdated) {
          addMessage('system', '✓ Updated: ' + data.fileUpdated, true);
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
        const { messages } = JSON.parse(body);
        const response = await chatWithOllama(messages);
        const fileUpdated = extractAndApplyJson(response);

        // Remove JSON block from displayed response
        const cleanResponse = response.replace(/```json[\s\S]*?```\s*/g, "").trim();

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ response: cleanResponse || "Done!", fileUpdated }));
      } catch (err) {
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
