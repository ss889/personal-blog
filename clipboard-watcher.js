const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTENT_DIR = path.join(__dirname, 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');

let lastClipboard = '';

async function getClipboard() {
  try {
    const result = execSync('powershell -command "Get-Clipboard"', { encoding: 'utf-8' });
    return result.trim();
  } catch {
    return '';
  }
}

function processContent(text) {
  const match = text.match(/FILE:\s*(\S+)\s*\n([\s\S]*)/);
  if (!match) return null;

  const filename = match[1].replace('.md', '');
  let content = match[2].trim();

  // Clean up any extra stuff after the markdown
  const extraMatch = content.match(/^([\s\S]*?)\n---\n[\s\S]*?\n---\n[\s\S]*$/);
  if (extraMatch) {
    // Keep only the first valid block
    const firstBlock = content.match(/^(---[\s\S]*?---\n[\s\S]*?)(?=\n---\n|$)/);
    if (firstBlock) {
      content = firstBlock[1];
    }
  }

  let filePath;
  if (filename === 'homepage') {
    filePath = path.join(CONTENT_DIR, 'homepage.md');
  } else {
    filePath = path.join(POSTS_DIR, `${filename}.md`);
  }

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return { filePath, content, filename };
}

async function checkClipboard() {
  const current = await getClipboard();
  
  if (current !== lastClipboard && current.includes('FILE:')) {
    lastClipboard = current;
    
    const result = processContent(current);
    if (result) {
      fs.writeFileSync(result.filePath, result.content);
      console.log(`\n✅ Saved: ${result.filename}`);
      console.log(`   → ${result.filePath}`);
      
      // Show notification
      try {
        execSync(`powershell -command "[System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); [System.Windows.Forms.MessageBox]::Show('Saved: ${result.filename}', 'Blog Editor', 'OK', 'Information')"`, { stdio: 'ignore' });
      } catch {}
      
      // Ask about git push
      console.log('\n   To push: git add -A && git commit -m "Update content" && git push');
    }
  }
  
  lastClipboard = current;
}

console.log('');
console.log('╔════════════════════════════════════════════════════╗');
console.log('║       📋 Blog Clipboard Watcher Running            ║');
console.log('╠════════════════════════════════════════════════════╣');
console.log('║                                                    ║');
console.log('║  1. Open Ollama app                                ║');
console.log('║  2. Select "blog-editor" model                     ║');
console.log('║  3. Ask it to edit your content                    ║');
console.log('║  4. Copy the response (Ctrl+C)                     ║');
console.log('║                                                    ║');
console.log('║  Files are saved automatically when you copy!      ║');
console.log('║                                                    ║');
console.log('╚════════════════════════════════════════════════════╝');
console.log('');
console.log('Watching clipboard... (Ctrl+C to stop)\n');

// Check clipboard every 500ms
setInterval(checkClipboard, 500);
