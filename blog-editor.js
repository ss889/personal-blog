#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readlineSync = require("readline-sync");

const OLLAMA_URL = "http://localhost:11434";
const CONTENT_DIR = path.join(__dirname, "content");
const POSTS_DIR = path.join(CONTENT_DIR, "posts");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function getModels() {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  const data = await response.json();
  return data.models.map((m) => m.name);
}

async function chat(model, messages) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  });
  const data = await response.json();
  return data.message.content;
}

function getContentFiles() {
  const files = [];

  // Homepage
  const homepagePath = path.join(CONTENT_DIR, "homepage.md");
  if (fs.existsSync(homepagePath)) {
    files.push({ name: "Homepage", path: homepagePath, type: "homepage" });
  }

  // Posts
  if (fs.existsSync(POSTS_DIR)) {
    const posts = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
    posts.forEach((post) => {
      files.push({
        name: `Post: ${post.replace(".md", "")}`,
        path: path.join(POSTS_DIR, post),
        type: "post",
      });
    });
  }

  return files;
}

function parseMarkdown(content) {
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (frontMatterMatch) {
    return {
      frontMatter: frontMatterMatch[1],
      body: frontMatterMatch[2],
    };
  }
  return { frontMatter: "", body: content };
}

function buildMarkdown(frontMatter, body) {
  if (frontMatter) {
    return `---\n${frontMatter}\n---\n${body}`;
  }
  return body;
}

async function gitPush(message) {
  const { execSync } = require("child_process");
  try {
    execSync("git add -A", { cwd: __dirname, stdio: "pipe" });
    execSync(`git commit -m "${message}"`, { cwd: __dirname, stdio: "pipe" });
    execSync("git push", { cwd: __dirname, stdio: "pipe" });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.clear();
  log(colors.bright + colors.cyan, "\n📝 Blog Content Editor with Ollama\n");

  // Check Ollama connection
  let models;
  try {
    models = await getModels();
  } catch (error) {
    log(colors.red, "❌ Cannot connect to Ollama. Make sure it's running.");
    process.exit(1);
  }

  // Select model
  log(colors.yellow, "Available models:");
  models.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  const modelIndex = readlineSync.questionInt(
    "\nSelect a model (number): ",
    { limitMessage: "Please enter a valid number" }
  );
  const selectedModel = models[modelIndex - 1];
  log(colors.green, `\n✓ Using model: ${selectedModel}\n`);

  // Main loop
  while (true) {
    const files = getContentFiles();

    log(colors.yellow, "\nWhat would you like to do?");
    console.log("  1. Edit existing content");
    console.log("  2. Create new blog post");
    console.log("  3. Push changes to GitHub");
    console.log("  4. Exit");

    const action = readlineSync.questionInt("\nSelect action: ");

    if (action === 4) {
      log(colors.cyan, "\nGoodbye! 👋\n");
      break;
    }

    if (action === 3) {
      log(colors.yellow, "\nPushing changes to GitHub...");
      const success = await gitPush("Update blog content via Ollama editor");
      if (success) {
        log(colors.green, "✓ Changes pushed! Site will update in ~2 minutes.");
      } else {
        log(colors.red, "No changes to push or push failed.");
      }
      continue;
    }

    if (action === 2) {
      // Create new post
      const slug = readlineSync.question("\nPost slug (e.g., my-new-post): ");
      const title = readlineSync.question("Post title: ");

      log(colors.cyan, "\nDescribe what you want the post to be about:");
      const description = readlineSync.question("> ");

      log(colors.yellow, "\n🤖 Generating post with Ollama...\n");

      const prompt = `Write a blog post with the following details:
Title: ${title}
Topic: ${description}

Write engaging, well-structured content in Markdown format. Include headers, paragraphs, and any relevant code examples if applicable. Do not include the front matter, just the body content starting with a heading.`;

      const messages = [{ role: "user", content: prompt }];
      const generated = await chat(selectedModel, messages);

      const today = new Date().toISOString().split("T")[0];
      const excerpt = readlineSync.question("\nShort excerpt for the post: ");

      const frontMatter = `title: ${title}\ndate: "${today}"\nexcerpt: ${excerpt}`;
      const fullContent = buildMarkdown(frontMatter, generated);

      const filePath = path.join(POSTS_DIR, `${slug}.md`);
      fs.writeFileSync(filePath, fullContent);

      log(colors.green, `\n✓ Post created: ${filePath}`);
      console.log("\n--- Preview ---");
      console.log(fullContent.substring(0, 500) + "...\n");
      continue;
    }

    if (action === 1) {
      // Edit existing content
      log(colors.yellow, "\nAvailable content:");
      files.forEach((f, i) => console.log(`  ${i + 1}. ${f.name}`));
      const fileIndex = readlineSync.questionInt("\nSelect file to edit: ");
      const selectedFile = files[fileIndex - 1];

      const content = fs.readFileSync(selectedFile.path, "utf8");
      const { frontMatter, body } = parseMarkdown(content);

      console.log("\n--- Current Content ---");
      console.log(body.substring(0, 800));
      if (body.length > 800) console.log("...(truncated)");
      console.log("--- End ---\n");

      // Chat loop for editing
      const conversationHistory = [
        {
          role: "system",
          content: `You are a helpful blog content editor. The user wants to edit their blog post. Here is the current content:\n\n${body}\n\nWhen the user asks for changes, provide the updated content. Only output the new content without any explanation unless asked. Keep the same general structure unless asked to change it.`,
        },
      ];

      while (true) {
        log(colors.cyan, "What changes would you like to make? (type 'done' to save, 'cancel' to discard)");
        const userInput = readlineSync.question("> ");

        if (userInput.toLowerCase() === "done") {
          // Save the last AI response as the new content
          const lastAssistantMessage = conversationHistory
            .filter((m) => m.role === "assistant")
            .pop();

          if (lastAssistantMessage) {
            const newContent = buildMarkdown(frontMatter, lastAssistantMessage.content);
            fs.writeFileSync(selectedFile.path, newContent);
            log(colors.green, `\n✓ Saved changes to ${selectedFile.path}`);
          } else {
            log(colors.yellow, "No changes were made.");
          }
          break;
        }

        if (userInput.toLowerCase() === "cancel") {
          log(colors.yellow, "Changes discarded.");
          break;
        }

        conversationHistory.push({ role: "user", content: userInput });

        log(colors.yellow, "\n🤖 Thinking...\n");
        const response = await chat(selectedModel, conversationHistory);
        conversationHistory.push({ role: "assistant", content: response });

        console.log("\n--- Updated Content ---");
        console.log(response.substring(0, 1000));
        if (response.length > 1000) console.log("...(truncated)");
        console.log("--- End ---\n");
      }
    }
  }
}

main().catch(console.error);
