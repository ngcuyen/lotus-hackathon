import { useEffect, useRef } from "react";

interface Props {
  code: string;
  editMode?: boolean;
  onElementSelected?: (element: any) => void;
  onElementDragged?: (element: any, deltaX: number, deltaY: number) => void;
}

export function LivePreview({ code, editMode = false, onElementSelected, onElementDragged }: Props) {
  const wrappedCode = ensureDefaultExport(code);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_CLICKED") {
        onElementSelected?.(event.data);
      } else if (event.data.type === "ELEMENT_DRAGGED") {
        onElementDragged?.(event.data.element, event.data.deltaX, event.data.deltaY);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementSelected, onElementDragged]);

  // Edit mode script injection
  const editModeScript = editMode
    ? `
    <script>
      // Hover effect
      document.addEventListener('mouseover', function(e) {
        if (e.target.id === 'root' || e.target.id === 'error') return;
        e.target.style.outline = '2px solid #ff6a00';
        e.target.style.outlineOffset = '2px';
        e.target.style.cursor = 'move';
      }, true);

      document.addEventListener('mouseout', function(e) {
        if (e.target === draggedElement && isDragging) return; // Don't remove outline while dragging
        e.target.style.outline = '';
        e.target.style.outlineOffset = '';
        e.target.style.cursor = '';
      }, true);

      // Drag and drop state
      let isDragging = false;
      let draggedElement = null;
      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let dragThreshold = 5; // px threshold to distinguish click from drag

      // Mouse down - prepare for drag
      document.addEventListener('mousedown', function(e) {
        const el = e.target;
        if (el.id === 'root' || el.id === 'error') return;

        draggedElement = el;
        startX = e.clientX;
        startY = e.clientY;
        currentX = startX;
        currentY = startY;
      }, true);

      // Mouse move - drag element
      document.addEventListener('mousemove', function(e) {
        if (!draggedElement) return;

        const deltaX = e.clientX - currentX;
        const deltaY = e.clientY - currentY;
        const totalDeltaX = e.clientX - startX;
        const totalDeltaY = e.clientY - startY;

        // Check if we've moved beyond threshold
        if (!isDragging && (Math.abs(totalDeltaX) > dragThreshold || Math.abs(totalDeltaY) > dragThreshold)) {
          isDragging = true;
          draggedElement.style.outline = '2px dashed #00d4ff';
          draggedElement.style.outlineOffset = '2px';
          draggedElement.style.opacity = '0.7';
        }

        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
          currentX = e.clientX;
          currentY = e.clientY;

          // Apply transform for smooth dragging
          draggedElement.style.transform = \`translate(\${totalDeltaX}px, \${totalDeltaY}px)\`;
          draggedElement.style.cursor = 'move';
        }
      }, true);

      // Mouse up - end drag or handle click
      document.addEventListener('mouseup', function(e) {
        if (!draggedElement) return;

        const el = draggedElement;
        const totalDeltaX = e.clientX - startX;
        const totalDeltaY = e.clientY - startY;

        if (isDragging) {
          // Drag end - apply final position with CSS
          e.preventDefault();
          e.stopPropagation();

          // Ensure element is positioned
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.position === 'static') {
            el.style.position = 'relative';
          }

          // Parse current position
          const currentLeft = parseFloat(computedStyle.left) || 0;
          const currentTop = parseFloat(computedStyle.top) || 0;

          // Apply final position (remove transform, use left/top)
          el.style.left = \`\${currentLeft + totalDeltaX}px\`;
          el.style.top = \`\${currentTop + totalDeltaY}px\`;
          el.style.transform = ''; // Remove transform

          // Send message (for logging/history only, not for regeneration)
          const rect = el.getBoundingClientRect();
          window.parent.postMessage({
            type: 'ELEMENT_DRAGGED',
            deltaX: Math.round(totalDeltaX),
            deltaY: Math.round(totalDeltaY),
            element: {
              tagName: el.tagName,
              className: el.className || '',
              textContent: (el.textContent || '').slice(0, 100),
              rect: {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
              }
            }
          }, '*');

          // Reset visual styles (keep position)
          el.style.outline = '';
          el.style.outlineOffset = '';
          el.style.opacity = '';
          el.style.cursor = '';
        } else {
          // Click - send selection
          e.preventDefault();
          e.stopPropagation();

          const rect = el.getBoundingClientRect();
          const computed = getComputedStyle(el);

          window.parent.postMessage({
            type: 'ELEMENT_CLICKED',
            tagName: el.tagName,
            className: el.className || '',
            textContent: (el.textContent || '').slice(0, 100),
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            },
            computedStyle: {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              fontSize: computed.fontSize,
              padding: computed.padding,
              borderRadius: computed.borderRadius,
            }
          }, '*');
        }

        // Reset drag state
        isDragging = false;
        draggedElement = null;
        startX = 0;
        startY = 0;
        currentX = 0;
        currentY = 0;
      }, true);
    <\/script>
    `
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
    #error { display: none; padding: 20px; color: #ef4444; font-size: 14px; white-space: pre-wrap; }
    ${editMode ? "* { user-select: none; }" : ""}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error"></div>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    try {
      ${wrappedCode}
      const _App = typeof App !== 'undefined' ? App : null;
      if (_App) {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(_App));
      }
    } catch (e) {
      document.getElementById('error').style.display = 'block';
      document.getElementById('error').textContent = 'Error: ' + e.message;
    }
  <\/script>
  ${editModeScript}
</body>
</html>`;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: "100%", height: "100%", minHeight: 500, border: "none", background: "white" }}
    />
  );
}

function ensureDefaultExport(code: string): string {
  // Remove import/export statements — not needed in script context
  let cleaned = code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .trim();

  // Ensure function is named App
  if (!cleaned.includes('function App')) {
    const funcMatch = cleaned.match(/function\s+(\w+)\s*\(/);
    if (funcMatch && funcMatch[1] !== 'App') {
      cleaned = cleaned.replace(funcMatch[0], 'function App(');
    }
  }

  return cleaned;
}
