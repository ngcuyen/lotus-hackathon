# Spec 06 — Iteration Loop

**Owner**: Person B (AI/Backend), assisted by Person A (frontend state)
**Priority**: P1 (Differentiator — target hours 6-10)
**Estimated effort**: 3 hours
**Files**: `backend/lambda/prompts.py` (iteration prompts), `src/hooks/useSketchToApp.ts` (state management)

---

## Problem

After generating an app from a sketch, the user wants to refine it — draw more on the sketch, describe changes in text, or click-to-edit elements (Spec 04). Each modification should build on the previous result, not start from scratch. The AI must maintain context across iterations while only changing what's requested.

This "iterative co-creation" loop is what turns a one-shot demo trick into a genuinely useful tool.

## Solution

Multi-turn conversation with Bedrock Claude. Each generation call includes the previous code as context, so the AI can make targeted modifications instead of regenerating everything. The frontend maintains a version history for undo/compare.

---

## Iteration Modes

| Mode | Trigger | What happens |
|------|---------|--------------|
| **Re-sketch** | User draws more on paper/whiteboard, captures new image | AI sees new image + previous code → updates components to match new sketch |
| **Text modify** | User types "add a search bar at the top" | AI modifies previous code based on text instruction |
| **Visual edit** | User clicks element + describes change (Spec 04) | AI modifies specific element in previous code |
| **Continuous** | Whiteboard session detects new drawing (Spec 05) | Same as re-sketch, but auto-triggered |

All four modes use the same backend endpoint with different parameters.

---

## API Contract (extends Spec 02)

```
POST /api/generate

// Mode 1: First generation (no context)
{ "image_base64": "..." }

// Mode 2: Re-sketch (new image + previous code)
{ "image_base64": "...", "previous_code": "export default..." }

// Mode 3: Text modify (no new image, just instruction)
{ "previous_code": "export default...", "modification": "add a search bar" }

// Mode 4: Visual edit (element-specific)
{
  "previous_code": "export default...",
  "modification": "User clicked on <button class='bg-blue-600'>Sign In</button>. They want: change text to Get Started"
}
```

---

## Prompt Strategy for Each Mode

### Mode 2: Re-sketch

```
[system prompt unchanged]

[few-shot examples]

User message:
[new image attached]

"The user has updated their sketch. Here is the previous version's code:
```
{previous_code}
```

Compare the new sketch with the previous code. 
- Keep components that still match between sketch and code
- Add new components that appear in the new sketch but not in the code  
- Remove components that were in the code but are gone from the new sketch
- Preserve styling improvements from the previous version

Output the complete updated component as JSON."
```

### Mode 3: Text modify

```
[system prompt unchanged]

[few-shot examples]

User message:
"Here is the current component code:
```
{previous_code}
```

The user wants this modification: "{modification}"

RULES for modification:
1. Make ONLY the requested change
2. Keep all other elements exactly as they are
3. Preserve all existing styling, spacing, and interactions
4. If the request is ambiguous, make the most reasonable interpretation

Output the complete updated component as JSON."
```

### Mode 4: Visual edit

```
[system prompt unchanged]

User message:
"Here is the current component code:
```
{previous_code}
```

The user clicked on this element in the rendered UI:
  Tag: {element.tagName}
  Classes: {element.className}
  Text: {element.textContent}
  Path: {element.path}
  
They want: "{modification}"

RULES:
1. Identify this SPECIFIC element in the code by matching its tag, classes, and text
2. Modify ONLY this element and its direct children
3. DO NOT change any other elements, their order, or their styling
4. If the modification affects layout (e.g., "make bigger"), adjust only the target element's classes

Output the complete updated component as JSON."
```

---

## Frontend State Management

### Version History

```typescript
interface AppVersion {
  id: string;              // UUID
  code: string;            // Generated React code
  description: string;     // AI description of what was generated
  sketchImage?: string;    // Base64 of sketch (if re-sketch mode)
  modification?: string;   // Text instruction (if modify mode)
  timestamp: number;
  latency: number;         // AI response time in ms
}

// In useSketchToApp hook:
const [versions, setVersions] = useState<AppVersion[]>([]);
const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);

// After each successful generation:
const newVersion: AppVersion = {
  id: crypto.randomUUID(),
  code: response.component,
  description: response.description,
  sketchImage: imageBase64 || undefined,
  modification: modification || undefined,
  timestamp: Date.now(),
  latency: aiLatency,
};
setVersions(prev => [...prev.slice(0, currentVersionIndex + 1), newVersion]);
setCurrentVersionIndex(prev => prev + 1);
```

### Undo / Redo

```typescript
const canUndo = currentVersionIndex > 0;
const canRedo = currentVersionIndex < versions.length - 1;

const undo = () => {
  if (canUndo) setCurrentVersionIndex(prev => prev - 1);
};

const redo = () => {
  if (canRedo) setCurrentVersionIndex(prev => prev + 1);
};

// Current code is always:
const currentCode = versions[currentVersionIndex]?.code || null;
```

---

## Version History UI (bonus)

Show a timeline of all iterations below the preview:

```typescript
<div className="flex gap-2 overflow-x-auto p-2 bg-neutral-50 border-t">
  {versions.map((v, i) => (
    <button
      key={v.id}
      onClick={() => setCurrentVersionIndex(i)}
      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all ${
        i === currentVersionIndex
          ? "bg-neutral-900 text-white"
          : "bg-white border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
      }`}
    >
      <span className="font-medium">v{i + 1}</span>
      <span className="ml-1.5 text-[10px] opacity-70">
        {v.modification ? `"${v.modification.slice(0, 20)}..."` : v.description.slice(0, 25)}
      </span>
    </button>
  ))}
</div>
```

---

## Context Window Management

Claude Sonnet has a 200K token context window. Each iteration adds ~2,000 tokens (previous code + prompt). After ~50 iterations, we should trim:

```python
def trim_context(previous_code: str, max_chars: int = 15000) -> str:
    """If code is too long, keep only the last version (no history accumulation)."""
    if len(previous_code) > max_chars:
        # Just use the latest code, no accumulated history
        return previous_code[:max_chars]
    return previous_code
```

In practice, for a 24h hackathon demo, we'll never hit 50 iterations. This is a safety valve.

---

## Handling AI Drift

After 5+ iterations, the AI may slowly drift from the original sketch. Mitigation strategies:

1. **Always include the original sketch image** in re-sketch mode (not just the latest one)
2. **Anchor prompt**: "The original sketch is the source of truth for layout. Only modify what the user explicitly requested."
3. **Hard reset option**: "Start fresh from this sketch" button that clears context

```typescript
const hardReset = (imageBase64: string) => {
  setVersions([]);
  setCurrentVersionIndex(-1);
  generate(imageBase64);  // First generation, no context
};
```

---

## Acceptance Criteria

- [ ] Re-sketch: draw more → app gains new components without losing existing ones
- [ ] Text modify: "add a search bar" → search bar appears, everything else unchanged
- [ ] Visual edit: click button → "make it red" → button turns red, nothing else changes
- [ ] Version history shows all iterations
- [ ] Undo/redo navigates between versions instantly (no AI call)
- [ ] 5 sequential modifications produce reasonable, non-degraded output
- [ ] "Start fresh" resets all context and generates from scratch
- [ ] Each iteration preserves styling quality from previous versions

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Contradictory modifications ("make it red" then "make it blue") | Each modification is independent — AI just follows the latest instruction |
| Modification that breaks layout ("remove the container div") | AI should interpret reasonably — remove contents or replace with simpler container |
| User undoes then makes new modification | Branch: new version forks from the undo point, discarding later versions |
| AI "forgets" an element after several iterations | Include original sketch image periodically to re-anchor |
| User asks to modify something that doesn't exist | AI adds it: "Change the footer" on an app without a footer → AI adds a footer |
| Very long code after many additions | Trim previous_code context if > 15,000 chars |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Modification → updated preview | < 6 seconds |
| Undo/redo (local, no AI) | < 50ms |
| Version count before quality degrades | > 10 iterations |
| Context preserved accurately | 95%+ elements survive across 5 iterations |
