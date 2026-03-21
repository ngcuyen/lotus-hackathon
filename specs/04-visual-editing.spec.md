# Spec 04 — Visual Editing

**Owner**: Person A (Frontend), assisted by Person B (AI prompt)
**Priority**: P1 (WOW feature — target hours 10-14)
**Estimated effort**: 4 hours
**Components**: `src/components/VisualEditor.tsx`, `src/hooks/useElementSelector.ts`

---

## Problem

After generating an app from a sketch, users want to tweak specific elements — change a button's text, adjust colors, resize components — without re-drawing the entire sketch or writing code. This must be visual and direct: click on the element → say what you want → see it change.

This is the **key differentiator** from every existing tool. None of tldraw, screenshot-to-code, v0, Bolt, or Lovable offer click-to-edit on a sketch-generated app.

## Solution

**Approach A: Click-to-select + AI modify** (chosen over contentEditable, code editor, or full drag-and-drop — see rationale in claude.md)

Inject a click interceptor into the Sandpack iframe. When user clicks any element in the preview, capture element metadata → show a modification prompt → send to AI with context → re-render updated code.

---

## User Flow

```
[Preview showing generated app]
  │
  ├── User clicks on "Sign In" button
  │     ↓
  │   [Button highlights with blue outline]
  │   [Floating popup appears: "What do you want to change?"]
  │     ↓
  │   User types: "Change to Get Started and make it green"
  │     ↓
  │   [Processing indicator on the element]
  │     ↓
  │   [Button updates to "Get Started" with green background]
  │
  └── User clicks on empty area → deselect
```

---

## Architecture

```
Sandpack iframe                    Parent app
┌─────────────────┐              ┌─────────────────┐
│  Generated app  │   postMsg    │  VisualEditor   │
│  + injected     │─────────────▶│  overlay         │
│  click handler  │              │                  │
│                 │◀─────────────│  Highlight +     │
│                 │   postMsg    │  edit popup      │
└─────────────────┘    (style)   └────────┬─────────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │ AI Pipeline   │
                                  │ (Spec 02)     │
                                  │ mode: modify  │
                                  └───────────────┘
```

---

## Implementation Details

### Step 1: Inject Click Interceptor into Sandpack

Append this script to the generated code before passing to Sandpack:

```javascript
// INJECTED CODE — appended to generated component
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    const rect = el.getBoundingClientRect();

    // Build a CSS-selector-like path for precise targeting
    const path = [];
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className && typeof current.className === 'string') {
        // Include first 3 Tailwind classes for identification
        const classes = current.className.split(' ').slice(0, 3).join('.');
        if (classes) selector += '.' + classes;
      }
      path.unshift(selector);
      current = current.parentElement;
    }

    window.parent.postMessage({
      type: 'ELEMENT_CLICKED',
      tagName: el.tagName,
      className: el.className || '',
      textContent: (el.textContent || '').slice(0, 100),
      innerHTML: (el.innerHTML || '').slice(0, 200),
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      path: path.join(' > '),
      computedStyle: {
        backgroundColor: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
        fontSize: getComputedStyle(el).fontSize,
        padding: getComputedStyle(el).padding,
      }
    }, '*');
  }, true);  // useCapture: true to intercept before any app handlers
}
```

### Step 2: Listen for Messages in Parent

```typescript
// src/hooks/useElementSelector.ts

interface SelectedElement {
  tagName: string;
  className: string;
  textContent: string;
  innerHTML: string;
  rect: { top: number; left: number; width: number; height: number };
  path: string;
  computedStyle: Record<string, string>;
}

export function useElementSelector() {
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'ELEMENT_CLICKED') {
        setSelected(e.data);
        setIsEditing(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const clearSelection = () => {
    setSelected(null);
    setIsEditing(false);
  };

  return { selected, isEditing, clearSelection };
}
```

### Step 3: Render Highlight Overlay + Edit Popup

```typescript
// src/components/VisualEditor.tsx

// Position a highlight overlay on the selected element
// Use the rect from postMessage, offset by the iframe's position
<div
  className="absolute border-2 border-blue-500 rounded pointer-events-none"
  style={{
    top: iframeOffset.top + selected.rect.top,
    left: iframeOffset.left + selected.rect.left,
    width: selected.rect.width,
    height: selected.rect.height,
  }}
/>

// Floating edit popup below the highlight
<div className="absolute bg-white rounded-xl shadow-lg border p-3 w-72">
  <p className="text-xs text-neutral-400 mb-1">
    Selected: {selected.tagName.toLowerCase()} — "{selected.textContent}"
  </p>
  <input
    autoFocus
    placeholder="What do you want to change?"
    onKeyDown={(e) => {
      if (e.key === 'Enter') submitModification(e.target.value);
    }}
    className="w-full border rounded-lg px-3 py-2 text-sm"
  />
  <div className="flex gap-2 mt-2">
    <button className="btn-primary text-xs flex-1" onClick={submit}>Apply</button>
    <button className="btn-ghost text-xs" onClick={clearSelection}>Cancel</button>
  </div>
</div>
```

### Step 4: Send Modification to AI

```typescript
const submitModification = async (instruction: string) => {
  // Build rich context for the AI
  const context = {
    element: `<${selected.tagName.toLowerCase()} class="${selected.className}">${selected.textContent}</${selected.tagName.toLowerCase()}>`,
    path: selected.path,
    style: selected.computedStyle,
  };

  await generate(currentImage, {
    previous_code: currentCode,
    modification: `User clicked on element: ${context.element} (at path: ${context.path}). 
They want: "${instruction}". 
Update ONLY this element and its immediate context. Keep everything else unchanged.`,
  });
};
```

---

## Quick-Action Buttons (bonus)

For common modifications, show one-click action buttons alongside the text input:

```typescript
const quickActions = [
  { label: "Change text", prompt: (el) => `Change the text of this ${el.tagName} to: ` },
  { label: "Make bigger", prompt: (el) => `Make this ${el.tagName} larger (bigger font, more padding)` },
  { label: "Make smaller", prompt: (el) => `Make this ${el.tagName} smaller (smaller font, less padding)` },
  { label: "Change color", prompt: (el) => `Change the color scheme of this ${el.tagName} to: ` },
  { label: "Remove", prompt: (el) => `Remove this ${el.tagName} element entirely` },
];
```

---

## UI States

| State | Display |
|-------|---------|
| Idle (no selection) | Preview is interactive, cursor shows crosshair hint |
| Element selected | Blue highlight overlay + floating edit popup |
| Modification in progress | Highlight pulses + spinner in popup |
| Modification complete | Brief green flash on element → popup closes |

---

## Toggle: Edit Mode vs Interactive Mode

Users need to switch between "clicking to edit" and "clicking to interact with the app" (e.g., typing in inputs, clicking buttons for their normal function).

```typescript
// Toggle in the header bar
<button onClick={() => setEditMode(!editMode)}>
  {editMode ? "Exit edit mode" : "Edit mode"}
</button>

// When editMode is OFF, don't inject the click interceptor
// When editMode is ON, inject it and show the overlay
```

---

## Acceptance Criteria

- [ ] Clicking any visible element in preview highlights it with a blue border
- [ ] Edit popup appears positioned below the selected element
- [ ] Text input "Change to Get Started" → button text updates
- [ ] "Make it green" → element background changes to green variant
- [ ] "Remove this" → element disappears from the generated app
- [ ] Quick action buttons work for common modifications
- [ ] Edit mode toggle works — can switch between editing and interacting
- [ ] Clicking empty area deselects current selection
- [ ] Multiple sequential edits work (each builds on the previous code)

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User clicks nested element (text inside button inside div) | Use innermost interactive element (button, not div) |
| Iframe scroll offset | Account for iframe scroll position in rect calculations |
| Element has no text (image placeholder, icon) | Show path-based description: "div with class bg-gray-100" |
| AI changes unrelated elements | Prompt instructs "ONLY modify the specified element" — but can't guarantee; user can undo |
| Very small elements (< 20px) | Expand click target area by 8px padding |
| Selected element disappears after code update | Clear selection, show brief "Element modified" toast |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Click → highlight visible | < 50ms |
| Modification submit → new preview | < 6 seconds (AI roundtrip) |
| Popup positioning accuracy | Within 4px of actual element bounds |
