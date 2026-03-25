# Personal Blog - Food & Recipe Platform Transformation
## Project Status & Progress Tracking

**Timeline**: 7-Day Sprint (SPRINT 0 → SPRINT 7)  
**Status**: SPRINT 2 Complete - Ready for SPRINT 3  
**Owner**: Saber  

---

## 🎯 Project Vision

Transform existing personal blog into interactive food/recipe platform with:
- ✅ **AI Chat Interface** - Gordon Ramsay personality AI assistant
- ⏳ **Voice Input** - Transcribe audio to text (Hugging Face Whisper)
- ⏳ **Recipe Management** - Search, scale, and organize recipes
- ⏳ **Category Landing Page** - Quick Dinners, Desserts, Budget Meals, Use-What-You-Have
- Public API + MCP tools for integration

---

## ✅ Completed Work

### SPRINT 0: Architecture & Planning
- [x] Comprehensive architecture design (SPRINT_0_SPEC.md)
- [x] API endpoint specification with request/response contracts
- [x] MCP tool definitions (5 recipe management tools)
- [x] Risk assessment and mitigation strategies
- [x] File structure planning
- [x] System prompt design (Gordon Ramsay personality)

### SPRINT 1: Backend - Public Chat API
- [x] `POST /api/chat-public` endpoint
- [x] Rate limiter (10 req/minute per IP)
- [x] Gordon Ramsay system prompt (400+ words)
- [x] Groq LLM integration with callGroq service export
- [x] Error handling (400/429/500 status codes)
- [x] Conversation history support
- [x] Category context support for recipe suggestions

**Files Modified**:
- `server.js` - Added public chat handler, rate limiter, system prompt generator
- `services/ollama.js` - Exported callGroq function

### SPRINT 2: Frontend Chat UI
- [x] **ChatOverlay.tsx** - Modal chat interface
  - Message history display
  - Input field with send button
  - Loading state and error handling
  - Mobile responsive (bottom sheet on mobile, modal on desktop)
  - Dark mode support
  
- [x] **ChatMessage.tsx** - Message display component
  - Markdown parsing (bold, italic, line breaks)
  - Timestamp display
  - User/Assistant differentiation (colors)
  
- [x] **VoiceRecorder.tsx** - Voice input component
  - MediaRecorder API integration
  - Recording/stop toggle
  - Placeholder for audio processing
  - Clear visual feedback (red pulse during recording)
  
- [x] **ChatContext.tsx** - State management
  - Global chat state (isOpen, selectedCategory)
  - useChat hook for component integration
  - Context provider pattern
  
- [x] **ChatLayoutWrapper.tsx** - Layout integration
  - Floating chat button (bottom-right, red gradient)
  - Chat overlay modal management
  
- [x] **layout.tsx updates**
  - ChatProvider wrapper for entire app
  - ChatLayoutWrapper component integration
  
- [x] **globals.css enhancements**
  - Bounce animation keyframes
  - Delay utility classes for staggered animations
  - Dark mode compatible styling

**Files Created**:
- `src/components/ChatOverlay.tsx`
- `src/components/ChatMessage.tsx`
- `src/components/VoiceRecorder.tsx`
- `src/lib/ChatContext.tsx`
- `src/app/ChatLayoutWrapper.tsx`

**Styling**: Full Tailwind CSS integration with:
- Red/orange gradient (food theme) buttons
- Dark mode support
- Mobile-first responsive design
- Smooth animations and transitions

---

## ⏳ In Progress

### QA Agent Setup
- [x] Created `.github/agents/qa-reviewer.agent.md`
- [x] Read-only QA specialist for spec/sprint validation
- [x] Structured QA report output format
- [x] Committed to GitHub

---

## 🚀 Next Steps

### SPRINT 3: Voice Input Integration (6 hours)
1. Implement Hugging Face Whisper API integration
2. Create `/api/voice-to-text` endpoint in server.js
3. Wire VoiceRecorder to endpoint
4. Add audio blob → API → transcript flow
5. Test voice to text with browser audio
6. **Requires**: HF_API_TOKEN in .env

### SPRINT 4: Landing Page - Category Blocks (8 hours)
1. Create categories.json with 4 food categories
2. Build CategoryGrid.tsx component
3. Redesign home page with food blog aesthetic
4. Create category landing pages
5. Wire category context to chat (pre-populate queries)
6. Add food-themed images/icons

### SPRINT 5: Recipe Management - MCP Tools (8 hours)
1. Create `/api/recipes` endpoint
2. Export 5 MCP tools:
   - `create_recipe` - Add new recipe to system
   - `scale_ingredients` - Adjust recipe quantities
   - `substitute_ingredients` - Food substitution suggestions
   - `search_by_ingredients` - Find recipes by available ingredients
   - `generate_shopping_list` - Create shopping list from recipes
3. Integrate tools with chat handler
4. Implement recipe file storage

### SPRINT 6: Real-Time Page Updates (6 hours)
1. Chat → File system operations
2. Auto-generate recipe content
3. Publish changes to GitHub Pages
4. Add success/countdown feedback

### SPRINT 7: Polish & Deploy (8 hours)
1. Write 10 starter recipes
2. End-to-end testing
3. Mobile testing (iOS Safari, Android Chrome)
4. Performance optimization
5. GitHub Pages deployment
6. Final QA pass

---

## 📋 Environment Variables Required

Copy `.env.example` → `.env` and fill in:

```bash
# REQUIRED for chat API
GROQ_API_KEY=sk-xxx...
GROQ_MODEL=llama-3.1-8b-instant

# REQUIRED for voice transcription (SPRINT 3)
HF_API_TOKEN=hf_xxx...

# OPTIONAL
GITHUB_TOKEN=ghp_xxx...
```

**Get Your Keys:**
- Groq: https://console.groq.com/keys (free)
- Hugging Face: https://huggingface.co/settings/tokens (free)
- GitHub: https://github.com/settings/tokens

---

## 🧪 Testing Checklist

### SPRINT 1 (Backend)
- [ ] Test `/api/chat-public` with valid GROQ_API_KEY
- [ ] Verify rate limiting (11th request should return 429)
- [ ] Test empty message validation (should return 400)
- [ ] Verify error handling (timeout, API down)
- [ ] Check conversation history is appended correctly
- [ ] Test category context in prompts

### SPRINT 2 (Frontend)
- [ ] Open chat overlay from floating button
- [ ] Send message → see response appear
- [ ] Verify markdown parsing (bold, italic)
- [ ] Test on mobile (responsive layout)
- [ ] Check dark mode styling
- [ ] Verify loading animation

### Integration
- [ ] Frontend connects to backend successfully
- [ ] Chat receives Gordon Ramsay responses
- [ ] Error messages display properly
- [ ] Rate limiting protects API

---

## 📊 Repository Information

**GitHub Repo**: https://github.com/ss889/personal-blog  
**Main Branch**: master  
**Latest Commits**:
1. QA Reviewer agent setup
2. SPRINT 2 - Frontend chat UI complete

---

## 💡 Key Architecture Decisions

1. **Public API Pattern**: No authentication for `/api/chat-public` with rate limiting instead
2. **Client-Side State**: React Context for chat state (simple, no backend state needed)
3. **Streaming Chat**: Return full response (not streaming) for simplicity
4. **Rate Limiting**: In-memory Map (production should use Redis/database)
5. **Voice Processing**: Delegated to Hugging Face API (no local models)
6. **Content Storage**: Markdown files in `content/` directory (GitHub Pages compatible)

---

## 🔧 Tech Stack Summary

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 | ✅ |
| Backend | Node.js HTTP server | ✅ |
| LLM | Groq API (llama-3.1-8b-instant) | ✅ |
| Voice | Hugging Face Whisper API | ⏳ SPRINT 3 |
| State | React Context API | ✅ |
| Deployment | GitHub Pages | ⏳ SPRINT 7 |
| MCP Tools | 5 recipe management tools | ⏳ SPRINT 5 |

---

## 📝 Notes for Next Device

When continuing on another device:

1. Clone repo: `git clone https://github.com/ss889/personal-blog.git`
2. Copy `.env.example` → `.env`
3. Add your API keys to `.env`
4. Start server: `node server.js` (port 3001)
5. Build Next.js: `npm run build`
6. Run SPRINT 3: Voice integration with Hugging Face

---

**Last Updated**: March 24, 2026  
**Next Review**: Before SPRINT 3 implementation
