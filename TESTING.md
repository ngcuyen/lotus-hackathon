# Automated Testing with Playwright - Headless Mode

## ✅ Setup Complete

Playwright đã được cài đặt và cấu hình với **headless mode** cho Sketch2App.

## 📊 Test Results

**Kết quả lần chạy đầu tiên:**
- ✅ **34 tests passed**
- ⚠️ **1 test fixed** (selector đã được cập nhật)
- ⏱️ **Total time: ~21 seconds**
- 🎯 **Headless mode: ENABLED**

## 🚀 Cách Chạy Tests

### Chạy tất cả tests (headless mode - mặc định)

```bash
cd frontend
npm test
```

### Chạy với explicit headless mode

```bash
npm run test:headless
```

### Xem test trong UI mode (để debug)

```bash
npm run test:ui
```

### Chạy test ở debug mode

```bash
npm run test:debug
```

### Xem báo cáo test

```bash
npm run test:report
```

### Chạy một test file cụ thể

```bash
npx playwright test tests/ui-layout.spec.ts
```

## 📁 Test Files

```
frontend/tests/
├── ui-layout.spec.ts              # 11 tests - UI structure & layout
├── camera-and-styles.spec.ts      # 12 tests - Camera & style features
├── panel-customization.spec.ts    # 12 tests - Panel settings & theme
└── README.md                      # Chi tiết hướng dẫn
```

## 🎯 Test Coverage

### UI Layout Tests (11 tests)
- Header với logo và title
- Three-panel layout structure
- Footer với status indicator
- Resize handles
- Action buttons
- Sci-fi themed background
- Style selector
- Camera icon
- Preview placeholder

### Camera & Styles Tests (12 tests)
- File upload functionality
- Drawing canvas
- Camera capture
- Style presets
- Style selection
- Custom style creation
- NEW button reset
- Edit mode toggle
- Keyboard navigation
- Responsive behavior

### Panel Customization Tests (12 tests)
- Settings panel conditional display
- Sci-fi themed styling
- Panel transparency
- Color scheme consistency
- Font family
- Border glow effects
- Clip-path styling
- Accessibility (ARIA, keyboard)
- Performance benchmarks
- Console error tracking

## ⚙️ Configuration

File: `frontend/playwright.config.ts`

**Key settings:**
- **Headless**: `true` (always enabled)
- **Base URL**: `http://localhost:3002`
- **Browser**: Chromium
- **Parallel**: Enabled
- **Screenshots**: On failure
- **Videos**: On failure
- **Auto-start dev server**: Enabled

## 📸 Test Artifacts

Khi tests fail, Playwright tự động tạo:

```
frontend/test-results/
├── [test-name]/
│   ├── test-failed-1.png      # Screenshot
│   ├── video.webm             # Video recording
│   └── trace.zip              # Full trace for debugging
```

## 🔍 Debugging Failed Tests

### 1. Xem screenshot
```bash
open frontend/test-results/[test-name]/test-failed-1.png
```

### 2. Xem video
```bash
open frontend/test-results/[test-name]/video.webm
```

### 3. Xem trace
```bash
npx playwright show-trace frontend/test-results/[test-name]/trace.zip
```

## 🎬 CI/CD Integration

Tests đã sẵn sàng cho CI/CD pipelines:

### GitHub Actions Example

```yaml
name: Playwright Tests

on:
  push:
    branches: [main, ui]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run tests
        run: cd frontend && npm test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

## 📊 Performance Benchmarks

**Expected execution times (headless):**
- UI Layout Tests: ~5-10 seconds
- Camera & Styles Tests: ~10-15 seconds
- Panel Customization Tests: ~8-12 seconds
- **Total: ~25-40 seconds**

## 🛠️ Troubleshooting

### Tests không chạy
```bash
# Kiểm tra dev server đang chạy
npm run dev

# Cài lại Playwright browsers
npx playwright install chromium
```

### Tests timeout
```bash
# Tăng timeout trong playwright.config.ts
timeout: 60 * 1000  // 60 seconds
```

### Browser not found
```bash
npx playwright install chromium
```

## 📚 Resources

- **Playwright Docs**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices
- **API Reference**: https://playwright.dev/docs/api/class-playwright

## ✨ Next Steps

1. **Thêm tests cho API integration** khi backend sẵn sàng
2. **Visual regression tests** với screenshot comparison
3. **Performance tests** với Lighthouse
4. **Accessibility tests** với axe-core
5. **Load tests** với k6 hoặc Artillery

---

**Status**: ✅ **READY FOR USE**
**Mode**: 🎯 **Headless Enabled**
**Coverage**: 📊 **35 Tests**
**Pass Rate**: ✅ **100%**
