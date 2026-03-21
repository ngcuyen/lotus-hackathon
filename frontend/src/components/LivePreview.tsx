import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

interface Props {
  code: string;
  editMode?: boolean;
  onElementSelected?: (element: any) => void;
  onElementDragged?: (element: any, deltaX: number, deltaY: number) => void;
}

export interface LivePreviewHandle {
  getSnapshot: () => Promise<string>;
}

// Static HTML shell — loaded once, never reloaded
const IFRAME_SHELL = `<!DOCTYPE html>
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
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error"></div>
  <script>
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    let _root = null;

    function renderCode(code) {
      const errEl = document.getElementById('error');
      errEl.style.display = 'none';
      try {
        const compiled = Babel.transform(code, { presets: ['react'] }).code;
        // Wrap in a function that returns the App component
        const wrapped = compiled + '\\nreturn typeof App !== "undefined" ? App : null;';
        const fn = new Function('React', 'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', wrapped);
        const Component = fn(React, useState, useEffect, useRef, useCallback, useMemo);
        if (Component) {
          if (!_root) _root = ReactDOM.createRoot(document.getElementById('root'));
          _root.render(React.createElement(Component));
        }
      } catch (e) {
        // During streaming, errors are expected — only show if not partial
        if (e.message && !e.message.includes('Unexpected')) {
          errEl.style.display = 'block';
          errEl.textContent = e.message;
        }
      }
    }

    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'UPDATE_CODE') {
        renderCode(e.data.code);
      } else if (e.data && e.data.type === 'GET_HTML') {
        var root = document.getElementById('root');
        window.parent.postMessage({ type: 'HTML_SNAPSHOT', html: root ? root.innerHTML : '' }, '*');
      } else if (e.data && e.data.type === 'ENABLE_EDIT_MODE') {
        enableEditMode();
      } else if (e.data && e.data.type === 'DISABLE_EDIT_MODE') {
        disableEditMode();
      }
    });

    // Edit mode
    let editModeActive = false;
    let isDragging = false;
    let draggedElement = null;
    let startX = 0, startY = 0, currentX = 0, currentY = 0;

    function onMouseOver(e) {
      if (e.target.id === 'root' || e.target.id === 'error') return;
      e.target.style.outline = '2px solid #ff6a00';
      e.target.style.outlineOffset = '2px';
      e.target.style.cursor = 'move';
    }
    function onMouseOut(e) {
      if (e.target === draggedElement && isDragging) return;
      e.target.style.outline = '';
      e.target.style.outlineOffset = '';
      e.target.style.cursor = '';
    }
    function onMouseDown(e) {
      e.stopPropagation();
      const el = e.target;
      if (el.id === 'root' || el.id === 'error') return;
      draggedElement = el;
      startX = e.clientX; startY = e.clientY;
      currentX = startX; currentY = startY;
    }
    function onMouseMove(e) {
      if (!draggedElement) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging = true;
        draggedElement.style.outline = '2px dashed #00d4ff';
        draggedElement.style.opacity = '0.7';
      }
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX; currentY = e.clientY;
        draggedElement.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      }
    }
    function onMouseUp(e) {
      if (!draggedElement) return;
      const el = draggedElement;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();

        // Apply final position with left/top (from drag_drop branch logic)
        var cs = window.getComputedStyle(el);
        if (cs.position === 'static') el.style.position = 'relative';
        var curLeft = parseFloat(cs.left) || 0;
        var curTop = parseFloat(cs.top) || 0;
        el.style.left = (curLeft + dx) + 'px';
        el.style.top = (curTop + dy) + 'px';
        el.style.transform = '';

        var rect = el.getBoundingClientRect();
        window.parent.postMessage({ type: 'ELEMENT_DRAGGED', deltaX: Math.round(dx), deltaY: Math.round(dy),
          element: { tagName: el.tagName, className: el.className || '', textContent: (el.textContent||'').slice(0,100),
            rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height } } }, '*');
        el.style.outline = ''; el.style.opacity = ''; el.style.cursor = '';
      } else {
        e.preventDefault();
        e.stopPropagation();
        var rect = el.getBoundingClientRect();
        var cs = getComputedStyle(el);
        window.parent.postMessage({ type: 'ELEMENT_CLICKED', tagName: el.tagName, className: el.className || '',
          textContent: (el.textContent||'').slice(0,100),
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          computedStyle: { backgroundColor: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize, padding: cs.padding, borderRadius: cs.borderRadius } }, '*');
      }
      isDragging = false; draggedElement = null;
    }

    function enableEditMode() {
      if (editModeActive) return;
      editModeActive = true;
      document.body.style.userSelect = 'none';
      document.addEventListener('mouseover', onMouseOver, true);
      document.addEventListener('mouseout', onMouseOut, true);
      document.addEventListener('mousedown', onMouseDown, true);
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('mouseup', onMouseUp, true);
    }
    function disableEditMode() {
      if (!editModeActive) return;
      editModeActive = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mouseover', onMouseOver, true);
      document.removeEventListener('mouseout', onMouseOut, true);
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('mouseup', onMouseUp, true);
    }

    // Signal ready
    window.parent.postMessage({ type: 'IFRAME_READY' }, '*');
  <\/script>
</body>
</html>`;

export const LivePreview = forwardRef<LivePreviewHandle, Props>(function LivePreview({ code, editMode = false, onElementSelected, onElementDragged }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const pendingCodeRef = useRef<string | null>(null);

  useImperativeHandle(ref, () => ({
    getSnapshot: () => {
      try {
        const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
        const root = doc?.getElementById('root');
        return Promise.resolve(root?.innerHTML || "");
      } catch {
        return Promise.resolve("");
      }
    },
  }));

  // Listen for iframe ready + element events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "IFRAME_READY") {
        readyRef.current = true;
        if (pendingCodeRef.current && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: "UPDATE_CODE", code: pendingCodeRef.current }, "*");
          pendingCodeRef.current = null;
        }
      } else if (event.data.type === "ELEMENT_CLICKED") {
        onElementSelected?.(event.data);
      } else if (event.data.type === "ELEMENT_DRAGGED") {
        onElementDragged?.(event.data.element, event.data.deltaX, event.data.deltaY);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onElementSelected, onElementDragged]);

  // Send code updates via postMessage — no iframe reload!
  useEffect(() => {
    if (!code) return;
    const cleaned = ensureDefaultExport(code);
    if (readyRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "UPDATE_CODE", code: cleaned }, "*");
    } else {
      pendingCodeRef.current = cleaned;
    }
  }, [code]);

  // Toggle edit mode
  useEffect(() => {
    if (!readyRef.current || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: editMode ? "ENABLE_EDIT_MODE" : "DISABLE_EDIT_MODE" },
      "*"
    );
  }, [editMode]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={IFRAME_SHELL}
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
      style={{ width: "100%", height: "100%", minHeight: 500, border: "none", background: "white" }}
    />
  );
});

function ensureDefaultExport(code: string): string {
  let cleaned = code
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .trim();

  if (!cleaned.includes('function App')) {
    const funcMatch = cleaned.match(/function\s+(\w+)\s*\(/);
    if (funcMatch && funcMatch[1] !== 'App') {
      cleaned = cleaned.replace(funcMatch[0], 'function App(');
    }
  }

  return cleaned;
}
