const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONTENT_DIR = path.join(__dirname, 'content');
const POSTS_DIR = path.join(CONTENT_DIR, 'posts');
const OLLAMA_OUTPUT = path.join(__dirname, 'ollama-output.txt');

// Create empty file to watch
fs.writeFileSync(OLLAMA_OUTPUT, '');

console.log('📝 Ollama Blog Watcher Running\n');
console.log('1. Open Ollama app and select "blog-editor" model');
console.log('2. Chat with it to edit your content');
console.log('3. Copy the response and paste it here\n');
console.log('The file will auto-save to the correct location.\n');
console.log('Paste the response below (press Enter twice when done):\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let buffer = '';
let emptyLines = 0;

rl.on('line', (line) => {
  if (line === '') {
    emptyLines++;
    if (emptyLines >= 2 && buffer.trim()) {
      processOutput(buffer);
      buffer = '';
      emptyLines = 0;
    }
  } else {
    emptyLines = 0;
    buffer += line + '\n';
  }
});

function processOutput(text) {
  const match = text.match(/FILE:\s*(\S+)\s*\n([\s\S]*)/);
  if (!match) {
    console.log('❌ Could not parse output. Make sure it starts with FILE: filename');
    console.log('\nPaste next response:\n');
    return;
  }
  
  const filename = match[1].replace('.md', '');
  const content = match[2].trim();
  
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
  
  fs.writeFileSync(filePath, content);
  console.log(`\n✅ Saved to ${filePath}\n`);
  
  rl.question('Push to GitHub? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const { execSync } = require('child_process');
      try {
        execSync('git add -A && git commit -m "Update content" && git push', {
          cwd: __dirname,
          stdio: 'inherit'
        });
        console.log('\n✅ Pushed to GitHub!\n');
      } catch (e) {
        console.log('\n❌ Push failed (maybe no changes?)\n');
      }
    }
    console.log('Paste next response (or Ctrl+C to exit):\n');
  });
}

// Also watch the file for external pastes
fs.watchFile(OLLAMA_OUTPUT, { interval: 1000 }, () => {
  const content = fs.readFileSync(OLLAMA_OUTPUT, 'utf-8');
  if (content.trim()) {
    processOutput(content);
    fs.writeFileSync(OLLAMA_OUTPUT, '');
  }
});

console.log('Waiting for input...\n');
