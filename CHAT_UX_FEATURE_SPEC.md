# Chat UX Feature Specification
## Ordo Chat Interface

### 1. Overview
The Ordo chat interface is a two-tier embedded chat system with pinned composer and scrolling messages, designed for high-volume conversation workflows.

**Key Principle**: Viewport-bounded, non-scrolling stage. Only the message area scrolls; composer is always visible.

---

## 2. Architecture

### 2.1 Component Hierarchy
```
ChatSurface (mode: "embedded" | "floating")
├── ChatContainer (layout orchestrator)
│   ├── ChatMessageViewport (scrollable viewport)
│   │   ├── MessageList (renders messages & hero state)
│   │   └── useChatScroll (auto-scroll logic)
│   └── ChatContentSurface (composer + progress strip)
│       ├── ChatInput (textarea + suggestions)
│       └── ChatProgressStrip (job status)
```

### 2.2 Layout Model
- **Stage**: `data-shell-viewport-stage="true"` — Full viewport height, non-scrolling
- **Message Viewport**: `data-chat-message-viewport="true"` — Scrolls internally
- **Composer Row**: `data-chat-composer-row="true"` — Pinned below messages
- **Safe Area**: Respects `--safe-area-inset-*` for mobile

---

## 3. Feature Set

### 3.1 Message Display
| Feature | Behavior |
|---------|----------|
| Hero State | First assistant message shows proof points + branded header |
| Role-Based Content | Messages filtered/rendered per user role |
| Streaming | Progressive token rendering with scroll lock option |
| Suggestions | Last assistant message can suggest follow-up queries |
| Retry | Failed user messages can be retried from message context |
| Search | Filter messages by text content |

**Code Pattern**:
```typescript
interface PresentedMessage {
  id: string;
  role: "user" | "assistant";
  content: RichContent;  // Parsed markdown/blocks
  suggestions: string[];  // Follow-ups
  status: "confirmed" | "pending" | "failed";
  timestamp: string;
}
```

### 3.2 Input & Composer
| Feature | Behavior |
|---------|----------|
| Textarea | Dynamic height (144-224px) |
| Mention System | "/" triggers command menu |
| File Upload | Drag-drop or file picker |
| Validation | Size limit (5MB), MIME whitelist |
| Error Display | Temporary error toast (3s) |
| Send State | Button disabled while sending |

**Allowed MIME Types**:
```
image/*, application/pdf, video/mp4, audio/mpeg, text/*
```

### 3.3 Auto-Scroll Behavior
- **At Bottom**: Auto-scroll on new message
- **User Scrolled Up**: Lock scroll, show "↓ Scroll to bottom" button
- **Conversation Switch**: Re-pin to bottom
- **Streaming**: Don't yank user mid-scroll

**Implementation**:
```typescript
const { scrollRef, isAtBottom, scrollToBottom, resetPin } = useChatScroll(scrollDependency);
```

### 3.4 Suggestions & Commands
- **Dynamic Suggestions**: Last assistant message `suggestions` array
- **Command Prefix**: "/" triggers registered commands
- **Mention System**: "@" for user/team mentions (if implemented)
- **Render**: Inline chips or dropdown menu

---

## 4. State Management

### 4.1 Chat Context
```typescript
interface ChatContextType {
  messages: ChatMessage[];
  isSending: boolean;
  conversationId: string | null;
  sendMessage(text: string, files?: File[]): Promise<Result>;
  stopStream(): Promise<Result>;
  setConversationId(id: string | null): void;
  refreshConversation(): Promise<void>;
}
```

### 4.2 Composer State
```typescript
interface ChatComposerState {
  input: string;
  pendingFiles: File[];
  mentionIndex: number;
  canSend: boolean;
  clearComposer(): void;
  restoreComposer(text: string, files: File[]): void;
  updateInput(value: string): void;
  handleFileSelect(event): void;
}
```

### 4.3 Scroll State
```typescript
interface ChatScrollState {
  scrollRef: RefObject<HTMLDivElement>;
  isAtBottom: boolean;
  scrollToBottom(): void;
  resetPin(): void;  // Force re-pin on conversation switch
  handleScroll(): void;
}
```

---

## 5. User Flows

### 5.1 First Message (Hero State)
```
Homepage load
→ ChatSurface renders hero intro with proof points
→ User enters text
→ Click Send
→ Request sent, hero state hidden
→ Response streams in, auto-scroll enabled
```

### 5.2 Conversation Switch
```
User clicks suggestion linking to /conversation/xyz
→ Conversation ID changed in context
→ Messages replaced (REPLACE_ALL action)
→ resetPin() called
→ New messages render, auto-scroll active
```

### 5.3 Scroll Lock During Streaming
```
Stream starts, user at bottom
→ Each token auto-scrolls
→ User scrolls up manually
→ Scroll lock engaged, "↓" button appears
→ New tokens arrive without yanking view
→ User clicks "↓" to re-engage auto-scroll
```

### 5.4 File Upload & Validation
```
User drags file over input
→ onFileDrop validates (MIME, size)
→ Accepted file added to pendingFiles
→ Filename chip shown in composer
→ User can remove chips before send
→ On send, files included in request
```

---

## 6. Data Structures

### 6.1 Message Parts
```typescript
type MessagePart =
  | { type: "text"; text: string }
  | { type: "code-inline"; text: string }
  | { type: "tool-call"; name: string; args: Record<string, unknown>; result?: unknown }
  | { type: "job-status"; jobId: string; status: string; label: string };

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  parts: MessagePart[];
  timestamp: Date;
}
```

### 6.2 Rich Content
```typescript
interface RichContent {
  blocks: (
    | { type: "paragraph"; content: InlineNode[] }
    | { type: "heading"; level: 1|2|3; content: InlineNode[] }
    | { type: "code-block"; code: string; language?: string }
    | { type: "list"; items: InlineNode[][] }
    | { type: "divider" }
  )[];
}

type InlineNode =
  | { type: "text"; text: string }
  | { type: "bold"; content: InlineNode[] }
  | { type: "code-inline"; text: string }
  | { type: "action-link"; label: string; action: string; params?: Record<string, string> };
```

---

## 7. CSS Architecture

### 7.1 Layout Tokens
```css
/* Viewport sizing */
--viewport-block-size: 100vh; /* or calc(100dvh - nav-height) */

/* Composer sizing */
--space-2: 8px;
--space-4: 16px;
--space-16: 128px;

/* Hero intro spacing */
--hero-badge-gap: 12px;
--hero-title-font-size: 2rem;
--hero-body-font-size: 1rem;
```

### 7.2 Key Selectors
```
[data-shell-viewport-stage="true"]       — Home stage container
[data-chat-container-mode="embedded"]    — Chat wrapper
[data-chat-message-viewport="true"]      — Scrolling area
[data-chat-message-stack="true"]         — Message stack
[data-chat-composer-row="true"]          — Pinned composer
[data-chat-composer-plane="true"]        — Fullscreen variant
[data-chat-bottom-rail="true"]           — Progress + composer
[data-homepage-chat-intro="true"]        — Hero state intro
```

### 7.3 Safe Area Handling
```css
.ui-chat-composer-plane {
  padding: var(--space-4);
  padding-bottom: max(var(--space-4), var(--safe-area-inset-bottom));
}

@supports (padding: max(1px)) {
  .ui-chat-viewport-glow {
    top: max(0px, var(--safe-area-inset-top));
  }
}
```

---

## 8. Accessibility

| Feature | Pattern |
|---------|---------|
| Message Role | `role="log"` or implicit via `<article>` |
| Composer | `<textarea>` with label + error aria-live |
| Buttons | Descriptive `aria-label` ("Send", "Scroll to bottom") |
| Loading | `aria-busy="true"` on container |
| Search Results | Announce via `aria-live="polite"` |
| Skip Link | Skip-to-main on some routes |

---

## 9. Performance Considerations

1. **Memoization**: `React.memo(ChatMessageViewport)` to avoid re-renders on parent updates
2. **Virtual Scrolling**: Consider for 1000+ messages (use `react-window`)
3. **Lazy Rich Content**: Parse markdown on-demand per message
4. **Request Debouncing**: Mention/command search debounced 200ms
5. **Stream Batching**: Group token updates if streaming > 100/sec

---

## 10. Error Handling

| Error | Display | Recovery |
|-------|---------|----------|
| Send Failure | Toast (3s) + restore composer | User can retry or edit |
| File Too Large | Inline error, reject file | Prompt user to compress |
| Network Timeout | Toast + Stop button | Retry or manual refresh |
| Invalid MIME | Skip silently or warn | File picker fallback |

---

## 11. Testing Strategy

### Unit Tests
- `useChatComposerState` — Input, files, validation
- `useChatScroll` — Scroll logic, pin/lock behavior
- `ChatPresenter` — Message parsing, suggestion extraction

### Integration Tests
- Message send → display flow
- Conversation switch → reset scroll
- File upload → error handling
- Suggestions → click tracking

### E2E Tests
- Hero state → first message → suggestions
- Auto-scroll during stream
- Mention/command triggering
- Safe-area rendering on mobile

---

## 12. Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ iOS Safari 14+
- ✅ Android Chrome 90+

**Constraints**:
- Viewport units: Use `100dvh` on mobile (dynamic viewport height)
- Textarea: Monitor `contenteditable` support for rich text
- File API: Graceful degradation if drag-drop unsupported

---

## 13. Related Specs

- [RBAC System](./RBAC_SYSTEM_SPEC.md)
- [Message Presenter](./MESSAGE_PRESENTER_SPEC.md)
- [Prompt Runtime](./PROMPT_RUNTIME_SPEC.md)
