# Spec 03 — Live Preview

**Owner**: Person A (Frontend)
**Priority**: P0 (Core — must work by hour 4)
**Estimated effort**: 2 hours
**Component**: `src/components/LivePreview.tsx`

---

## Problem

Take a string of generated React + Tailwind code and render it as a live, interactive application in the browser — with error handling, fast refresh, and zero build step. The preview must feel like a real app, not a code snippet.

## Solution

Use `@codesandbox/sandpack-react` to create an in-browser React sandbox. Sandpack provides a full React runtime, hot reload, and error boundaries out of the box.

---

## Component API

```typescript
interface LivePreviewProps {
  code: string;  // Raw React component code (may or may not have export default)
}
```

---

## Implementation Details

### Sandpack Configuration

```typescript
<SandpackProvider
  template="react-ts"
  files={{
    "/App.tsx": {
      code: ensureDefaultExport(code),
      active: true,
    },
    "/public/index.html": {
      code: HTML_WITH_TAILWIND_CDN,
      hidden: true,
    },
  }}
  options={{
    externalResources: ["https://cdn.tailwindcss.com"],
  }}
  theme="light"
>
  <SandpackPreview
    showOpenInCodeSandbox={false}
    showRefreshButton={false}
    style={{ height: "100%" }}
  />
</SandpackProvider>
```

### Tailwind Integration

Sandpack doesn't support PostCSS/Tailwind build pipeline. Solution: inject Tailwind via CDN `<script>` in the HTML template.

```html
<!-- Injected into Sandpack's index.html -->
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
</style>
```

### Export Default Handling

Claude sometimes generates code without `export default`. The wrapper must handle all patterns:

```typescript
function ensureDefaultExport(code: string): string {
  if (code.includes("export default")) return code;

  // Named function: function App() { ... }
  const funcMatch = code.match(/function\s+(\w+)\s*\(/);
  if (funcMatch) return `${code}\n\nexport default ${funcMatch[1]};`;

  // Arrow function: const App = () => { ... }
  const constMatch = code.match(/(?:const|let)\s+(\w+)\s*=\s*(?:\(|function)/);
  if (constMatch) return `${code}\n\nexport default ${constMatch[1]};`;

  // Last resort: wrap everything
  return `export default function App() {\n  return (\n${code}\n  );\n}`;
}
```

### Error Handling

Sandpack has built-in error display, but it's not styled to match our app. Wrap with custom error boundary:

```typescript
// Listen for Sandpack errors
<SandpackProvider
  onError={(error) => {
    // Log for debugging
    console.error("Sandpack error:", error);
    // Show user-friendly message
    setPreviewError("Generated code has an error. Try regenerating.");
  }}
>
```

---

## UI States

| State | Display |
|-------|---------|
| Empty (no code) | Centered placeholder: icon + "Your app will appear here" |
| Loading (code received, rendering) | Brief shimmer/skeleton (Sandpack loads in ~500ms) |
| Success | Full-width Sandpack preview, interactive |
| Error | Error message card + "Regenerate" button |

---

## Styling the Preview Container

```typescript
// Remove Sandpack default chrome — we want the preview to look like a standalone app
<div className="h-full [&_.sp-preview-container]:!h-full [&_.sp-preview-iframe]:!h-full">
  <SandpackPreview ... />
</div>
```

**Key CSS overrides:**
- Remove Sandpack header/footer
- Make preview iframe fill the entire right panel
- Hide the "Open in CodeSandbox" button
- Remove default padding/borders

---

## Sandpack Limitations to Know

| Limitation | Workaround |
|-----------|------------|
| No npm packages inside sandbox | Use CDN scripts in HTML template (Tailwind, fonts) |
| No file system access | All code in single App.tsx — no multi-file components |
| Cold start ~500ms on first render | Show skeleton loader during initialization |
| TypeScript errors block render | Use `// @ts-nocheck` at top of generated code as safety net |
| No hot module replacement between different code strings | Remount entire SandpackProvider when code changes |

### Remounting Strategy

When new code arrives (from regeneration or modification), we need to remount Sandpack cleanly:

```typescript
// Use key to force remount when code changes
<SandpackProvider key={codeHash} ...>
```

Compute `codeHash` as a simple hash of the code string. When code changes → key changes → Sandpack remounts → fresh render.

---

## Acceptance Criteria

- [ ] Valid React + Tailwind code renders correctly within 1 second
- [ ] Interactive elements work (buttons show hover, inputs accept text, toggles toggle)
- [ ] Tailwind utility classes render correctly (colors, spacing, rounded corners, shadows)
- [ ] Invalid JSX shows friendly error message, not a crash
- [ ] Missing `export default` is auto-fixed transparently
- [ ] Code with `useState` / `useEffect` hooks works correctly
- [ ] Preview is responsive — renders well at any panel width
- [ ] Sandpack chrome is hidden — preview looks like a standalone app

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Code imports non-existent package | Sandpack shows module not found error → display retry button |
| Infinite render loop (bad useEffect) | Sandpack has built-in loop detection → surfaces error |
| Code is empty string | Show empty state placeholder |
| Code is just HTML (no React wrapper) | `ensureDefaultExport` wraps it in a function component |
| Very long code (300+ lines) | Sandpack handles fine, but initial render may take 1-2s |
| Code uses `window` or `document` directly | Works — Sandpack iframe has full browser APIs |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Code received → interactive preview | < 1.5 seconds |
| Code update → re-render | < 800ms |
| Sandpack bundle size impact | ~400KB gzipped (acceptable) |
