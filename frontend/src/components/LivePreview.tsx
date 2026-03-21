import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface Props {
  code: string;
  editMode?: boolean;
  onElementSelected?: (element: any) => void;
  onElementDragged?: (element: any, deltaX: number, deltaY: number) => void;
}

export interface LivePreviewHandle {
  applyStyle: (styles: Record<string, string>) => void;
  applyText: (text: string) => void;
  deleteElement: () => void;
}

export const LivePreview = forwardRef<LivePreviewHandle, Props>(
  ({ code, editMode = false, onElementSelected, onElementDragged }, ref) => {
    const wrappedCode = ensureDefaultExport(code);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      applyStyle: (styles) => {
        iframeRef.current?.contentWindow?.postMessage({ type: "APPLY_STYLE", styles }, "*");
      },
      applyText: (text) => {
        iframeRef.current?.contentWindow?.postMessage({ type: "APPLY_TEXT", text }, "*");
      },
      deleteElement: () => {
        iframeRef.current?.contentWindow?.postMessage({ type: "DELETE_ELEMENT" }, "*");
      },
    }));

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

    const editModeScript = editMode
      ? `
    <script>
      let selectedEl = null;

      // Listen for style/text/delete commands from parent
      window.addEventListener('message', function(e) {
        if (!selectedEl) return;
        if (e.data.type === 'APPLY_STYLE') {
          Object.entries(e.data.styles).forEach(function(pair) {
            selectedEl.style[pair[0]] = pair[1];
          });
        } else if (e.data.type === 'APPLY_TEXT') {
          // Only set text on leaf nodes
          if (selectedEl.children.length === 0) {
            selectedEl.textContent = e.data.text;
          } else {
            // Find first text node
            for (let i = 0; i < selectedEl.childNodes.length; i++) {
              if (selectedEl.childNodes[i].nodeType === 3) {
                selectedEl.childNodes[i].textContent = e.data.text;
                break;
              }
            }
          }
        } else if (e.data.type === 'DELETE_ELEMENT') {
          selectedEl.remove();
          selectedEl = null;
        }
      });

      // Hover
      document.addEventListener('mouseover', function(e) {
        if (e.target.id === 'root' || e.target.id === 'error') return;
        e.target.style.outline = '2px solid #ff6a00';
        e.target.style.outlineOffset = '2px';
        e.target.style.cursor = 'pointer';
      }, true);
      document.addEventListener('mouseout', function(e) {
        if (e.target === draggedElement && isDragging) return;
        if (e.target !== selectedEl) {
          e.target.style.outline = '';
          e.target.style.outlineOffset = '';
          e.target.style.cursor = '';
        }
      }, true);

      // Drag state
      let isDragging = false;
      let draggedElement = null;
      let startX = 0, startY = 0, currentX = 0, currentY = 0;
      let dragThreshold = 5;

      document.addEventListener('mousedown', function(e) {
        const el = e.target;
        if (el.id === 'root' || el.id === 'error') return;
        draggedElement = el;
        startX = e.clientX; startY = e.clientY;
        currentX = startX; currentY = startY;
      }, true);

      document.addEventListener('mousemove', function(e) {
        if (!draggedElement) return;
        const totalDeltaX = e.clientX - startX;
        const totalDeltaY = e.clientY - startY;
        if (!isDragging && (Math.abs(totalDeltaX) > dragThreshold || Math.abs(totalDeltaY) > dragThreshold)) {
          isDragging = true;
          draggedElement.style.outline = '2px dashed #00d4ff';
          draggedElement.style.outlineOffset = '2px';
          draggedElement.style.opacity = '0.7';
        }
        if (isDragging) {
          e.preventDefault(); e.stopPropagation();
          currentX = e.clientX; currentY = e.clientY;
          draggedElement.style.transform = 'translate(' + totalDeltaX + 'px, ' + totalDeltaY + 'px)';
        }
      }, true);

      document.addEventListener('mouseup', function(e) {
        if (!draggedElement) return;
        const el = draggedElement;
        const totalDeltaX = e.clientX - startX;
        const totalDeltaY = e.clientY - startY;

        if (isDragging) {
          e.preventDefault(); e.stopPropagation();
          const cs = window.getComputedStyle(el);
          if (cs.position === 'static') el.style.position = 'relative';
          el.style.left = ((parseFloat(cs.left) || 0) + totalDeltaX) + 'px';
          el.style.top = ((parseFloat(cs.top) || 0) + totalDeltaY) + 'px';
          el.style.transform = '';
          el.style.outline = ''; el.style.outlineOffset = '';
          el.style.opacity = ''; el.style.cursor = '';

          window.parent.postMessage({
            type: 'ELEMENT_DRAGGED', deltaX: Math.round(totalDeltaX), deltaY: Math.round(totalDeltaY),
            element: { tagName: el.tagName, className: el.className || '', textContent: (el.textContent || '').slice(0, 100) }
          }, '*');
        } else {
          e.preventDefault(); e.stopPropagation();
          // Deselect previous
          if (selectedEl && selectedEl !== el) {
            selectedEl.style.outline = '';
            selectedEl.style.outlineOffset = '';
          }
          selectedEl = el;
          el.style.outline = '2px solid #00d4ff';
          el.style.outlineOffset = '2px';

          const rect = el.getBoundingClientRect();
          const computed = getComputedStyle(el);
          window.parent.postMessage({
            type: 'ELEMENT_CLICKED', tagName: el.tagName, className: el.className || '',
            textContent: (el.textContent || '').slice(0, 100),
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            computedStyle: {
              backgroundColor: computed.backgroundColor, color: computed.color,
              fontSize: computed.fontSize, padding: computed.padding, borderRadius: computed.borderRadius,
            }
          }, '*');
        }
        isDragging = false; draggedElement = null;
        startX = 0; startY = 0; currentX = 0; currentY = 0;
      }, true);
    <\/script>`
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
);

function ensureDefaultExport(code: string): string {
  let cleaned = code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, "")
    .replace(/^export\s+default\s+/gm, "")
    .trim();
  if (!cleaned.includes("function App")) {
    const funcMatch = cleaned.match(/function\s+(\w+)\s*\(/);
    if (funcMatch && funcMatch[1] !== "App") {
      cleaned = cleaned.replace(funcMatch[0], "function App(");
    }
  }
  return cleaned;
}
