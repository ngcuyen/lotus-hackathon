# Spec 07 — AI Output Quality (Sketch Fidelity + Beautiful UI)

**Owner**: Person B (AI/Backend)
**Priority**: P0 (Critical — directly affects demo quality)
**Estimated effort**: 3 hours
**Files to modify**: `backend/lambda/prompts.py`, `backend/dev_server.py`
**Files NOT to touch**: `frontend/src/components/*`, `frontend/src/App.tsx`, `frontend/src/hooks/*`

---

## Problem

AI output hiện tại quá đơn giản — sketch hình tròn chỉ sinh ra 1 div tròn, sketch phức tạp bị bỏ qua nhiều element. UI sinh ra trông generic, không đẹp, không đủ interactive.

## Goal

1. Output phải bám sát layout của sketch — đếm đúng số element, đúng vị trí, đúng cấu trúc
2. UI sinh ra phải đẹp như thiết kế chuyên nghiệp — gradient, shadow, hover effects, realistic data
3. Tất cả form/button/input phải interactive (useState)
4. Code sinh ra phải 80-200 dòng JSX cho UI phong phú

## Scope — CHỈ sửa backend

### 1. Cải thiện System Prompt (`prompts.py`)

Thêm section "SKETCH FIDELITY" vào `BASE_PROMPT`:
```
CRITICAL — SKETCH FIDELITY:
- Study the sketch CAREFULLY. Count every element.
- Reproduce EXACT layout: 3 columns in sketch = 3 columns in code
- Every rectangle = card/section/container
- Every line of text = heading/paragraph/label  
- Every circle = avatar/icon/button
- Do NOT simplify or skip elements
```

Thêm section "DESIGN EXCELLENCE":
```
- Make it look like a $10,000 professionally designed app
- Real names (John Smith, Sarah Chen), real emails, real prices ($49.99)
- Every element: proper padding, rounded corners, shadows, hover states
```

### 2. Tăng max_tokens (`dev_server.py`)

```python
MAX_TOKENS = 8192  # tăng từ 4096 → 8192 để sinh UI phức tạp hơn
```

### 3. Cải thiện few-shot example (`prompts.py`)

Thay few-shot example hiện tại bằng example phức tạp hơn — dashboard hoặc e-commerce card, không chỉ login form đơn giản.

### 4. Cải thiện user message (`prompts.py` → `build_messages()`)

Thay message đơn giản:
```
"Convert this wireframe sketch to a React component"
```
Bằng message chi tiết hơn:
```
"Analyze this sketch carefully. Count every UI element (boxes, text, buttons, inputs, icons). 
Reproduce the EXACT layout structure. Then elevate the design to production quality.
Output strict JSON only."
```

### 5. Style presets quality (`prompts.py`)

Mỗi style preset cần thêm:
- Ví dụ cụ thể về color codes
- Ví dụ cụ thể về spacing/sizing
- Ví dụ về animation/transition

---

## API Contract (không thay đổi)

Request và response format giữ nguyên:
```
POST /api/generate
{ "image_base64": "...", "style": "modern", "previous_code": "...", "modification": "..." }

Response: { "component": "...", "description": "...", "latency_seconds": 4.2 }
```

Thêm endpoint mới (đã có):
```
GET /api/styles → { "modern": {"name": "Modern Minimal"}, ... }
```

---

## Testing

Sau khi sửa, test với 5 sketch khác nhau:
1. Login form đơn giản → phải có gradient, shadow, loading state
2. Dashboard với sidebar + cards → phải đúng layout sidebar + grid cards
3. E-commerce product page → phải có image placeholder, price, add to cart
4. Landing page với hero + features → phải có hero section + feature grid
5. Hình vẽ abstract (hình tròn, đường thẳng) → phải interpret thành UI có ý nghĩa

Mỗi output phải:
- [ ] Đúng layout sketch (±1 element)
- [ ] ≥ 80 dòng JSX
- [ ] Có ít nhất 1 useState interactive
- [ ] Có hover/transition effects
- [ ] Realistic placeholder data

---

## Acceptance Criteria

- [ ] Sketch login form → output có gradient background, shadow cards, focus rings, loading state
- [ ] Sketch dashboard → output có sidebar, metric cards, table, status badges
- [ ] Sketch 5 boxes → output có đúng 5 cards/sections
- [ ] Mỗi style preset tạo ra visual khác biệt rõ ràng
- [ ] max_tokens = 8192
- [ ] Không break API contract hiện tại
