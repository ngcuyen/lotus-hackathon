

# Spec 08 — Visual Editor (Figma-like Edit on Generated UI)

**Owner**: Person A (Frontend)
**Priority**: P0 (Key differentiator)
**Estimated effort**: 5 hours
**Files to create**: `frontend/src/components/VisualEditor.tsx`, `frontend/src/hooks/useVersionHistory.ts`
**Files to modify**: `frontend/src/App.tsx`, `frontend/src/components/LivePreview.tsx`
**Files NOT to touch**: `backend/*` (backend API đã hỗ trợ `modification` field — chỉ cần gọi đúng) 

---

## Problem

Sau khi AI sinh ra app, user muốn chỉnh sửa trực tiếp trên UI — đổi màu, kích thước, text, xóa element — giống Figma nhưng trên app đang chạy. Hiện tại chỉ có nút "Regenerate" — phải gen lại toàn bộ.

## Goal

1. User click vào element trên preview → hiện panel chỉnh sửa (màu, size, text, xóa)
2. Mỗi lần chỉnh sửa → gọi AI với `modification` → update preview
3. Lưu version history — undo/redo giữa các version

---

## Architecture

```
LivePreview (iframe)                    App
┌─────────────────┐                   ┌──────────────────┐
│  Generated app  │   postMessage     │  VisualEditor    │
│  + click handler│──────────────────▶│  (edit panel)    │
│  injected via   │                   │                  │
│  srcdoc         │                   │  - Color picker  │
└─────────────────┘                   │  - Size controls │
                                      │  - Text edit     │
                                      │  - Delete button │
                                      │  - Custom prompt │
                                      └────────┬─────────┘
                                               │
                                      ┌────────▼─────────┐
                                      │  useSketchToApp  │
                                      │  generate(img,   │
                                      │    modification)  │
                                      └──────────────────┘
```

---

## Scope — CHỈ sửa frontend

### Part 1: Click-to-Select trong iframe (`LivePreview.tsx`)

Inject script vào srcdoc HTML để bắt click event:

```javascript
// Inject vào cuối <body> trong srcdoc
document.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  const el = e.target;
  const rect = el.getBoundingClientRect();
  window.parent.postMessage({
    type: 'ELEMENT_CLICKED',
    tagName: el.tagName,
    className: el.className || '',
    textContent: (el.textContent || '').slice(0, 100),
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    computedStyle: {
      backgroundColor: getComputedStyle(el).backgroundColor,
      color: getComputedStyle(el).color,
      fontSize: getComputedStyle(el).fontSize,
      padding: getComputedStyle(el).padding,
      borderRadius: getComputedStyle(el).borderRadius,
    }
  }, '*');
}, true);
```

Thêm highlight effect — khi hover element trong iframe, hiện outline:

```javascript
document.addEventListener('mouseover', (e) => {
  e.target.style.outline = '2px solid #3b82f6';
  e.target.style.outlineOffset = '2px';
}, true);
document.addEventListener('mouseout', (e) => {
  e.target.style.outline = '';
  e.target.style.outlineOffset = '';
}, true);
```

**Quan trọng**: Chỉ inject khi `editMode === true`. Khi `editMode === false`, iframe hoạt động bình thường (user tương tác với app).

### Part 2: Visual Editor Panel (`VisualEditor.tsx`)

Component mới — hiện bên phải hoặc dưới preview khi có element được chọn.

```typescript
interface VisualEditorProps {
  selectedElement: SelectedElement | null;
  onModify: (modification: string) => void;  // gọi generate() với modification
  onClose: () => void;
}
```

UI gồm:
1. **Element info**: tag name, current text, current styles
2. **Quick actions** (mỗi cái = 1 modification string gửi cho AI):
   - 🎨 Color picker → "Change background color of this {tag} to {color}"
   - 📏 Size: Small / Medium / Large → "Make this {tag} {size}"
   - ✏️ Text edit input → "Change text of this {tag} to '{newText}'"
   - 🗑️ Delete → "Remove this {tag} element"
   - 🔄 Custom prompt input → user gõ tự do, ví dụ "add a shadow", "make it rounded"
3. **Apply button** → gọi `onModify(modificationString)`

### Part 3: Version History (`useVersionHistory.ts`)

Hook mới quản lý version:

```typescript
interface Version {
  id: string;
  code: string;
  description: string;
  modification?: string;  // what changed
  timestamp: number;
}

interface UseVersionHistoryReturn {
  versions: Version[];
  currentIndex: number;
  addVersion: (code: string, description: string, modification?: string) => void;
  undo: () => Version | null;
  redo: () => Version | null;
  goToVersion: (index: number) => Version;
  canUndo: boolean;
  canRedo: boolean;
}
```

- `addVersion()` — gọi sau mỗi lần AI trả về code mới
- `undo()` / `redo()` — navigate local, KHÔNG gọi AI
- `goToVersion(i)` — jump đến version bất kỳ

### Part 4: Version Timeline UI (trong `App.tsx`)

Thanh ngang ở dưới preview, hiện danh sách versions:

```
[v1 "Login form"] → [v2 "Changed button to green"] → [v3 "Made title bigger"] 
                                                        ↑ current
```

- Click version → jump đến version đó (instant, no AI call)
- Undo/Redo buttons ở header
- Current version highlighted

### Part 5: Edit Mode Toggle (trong `App.tsx`)

Thêm toggle button ở header:
```
[✏️ Edit Mode] / [👆 Interactive Mode]
```

- Edit Mode ON: click element → select → show editor panel
- Edit Mode OFF: click element → normal interaction (type in input, click button)

---

## Interaction Flow

```
1. User uploads sketch → AI generates v1
2. User clicks "Edit Mode" toggle → ON
3. User hovers element → blue outline appears
4. User clicks element → VisualEditor panel opens
5. User picks color → "Change background to #10b981"
6. Click "Apply" → loading → AI returns v2 → preview updates
7. Version timeline: [v1] → [v2 ← current]
8. User clicks "Undo" → preview shows v1 (instant)
9. User clicks "Redo" → preview shows v2 (instant)
```

---

## API Usage (backend đã hỗ trợ, KHÔNG cần sửa)

```typescript
// Gọi generate với modification
await generateFromSketch({
  image_base64: currentSketchImage,
  previous_code: currentCode,        // code hiện tại
  modification: "Change the Sign In button background color to green",
  style: selectedStyle,
});
```

Backend sẽ gửi `previous_code` + `modification` cho AI → AI chỉ sửa element được yêu cầu.

---

## File Structure

```
frontend/src/
├── components/
│   ├── LivePreview.tsx          # MODIFY: inject click handler khi editMode=true
│   ├── VisualEditor.tsx         # NEW: edit panel (color, size, text, delete, custom)
│   └── VersionTimeline.tsx      # NEW: horizontal version list
├── hooks/
│   ├── useSketchToApp.ts        # MODIFY: integrate version history
│   └── useVersionHistory.ts     # NEW: version state management
└── App.tsx                      # MODIFY: add edit mode toggle, version timeline, editor panel
```

---

## Acceptance Criteria

- [ ] Edit Mode toggle works — switch between edit and interactive mode
- [ ] Hover element in edit mode → blue outline
- [ ] Click element → VisualEditor panel opens with element info
- [ ] Color change → AI updates only that element's color
- [ ] Size change → AI updates only that element's size
- [ ] Text change → AI updates only that element's text
- [ ] Delete → AI removes that element
- [ ] Custom prompt → AI applies freeform modification
- [ ] Version history records every change
- [ ] Undo/Redo navigates versions instantly (no AI call)
- [ ] Version timeline shows all versions, click to jump
- [ ] 5 sequential edits produce reasonable output (no degradation)

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User clicks nested element (text inside button) | Select innermost interactive element |
| AI changes unrelated elements | Prompt says "ONLY modify the specified element" — best effort |
| Edit mode + iframe scroll | Account for scroll offset in rect calculations |
| Very fast sequential edits | Debounce — disable Apply button while processing |
| Undo past first version | canUndo = false, button disabled |
| Version history > 20 items | Scroll horizontally, keep all versions |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Click → editor panel visible | < 100ms |
| Apply modification → updated preview | < 8s (AI roundtrip) |
| Undo/Redo | < 50ms (local only) |
| Version jump | < 50ms (local only) |
