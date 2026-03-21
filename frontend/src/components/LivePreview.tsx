interface Props {
  code: string;
}

export function LivePreview({ code }: Props) {
  const wrappedCode = ensureDefaultExport(code);

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
</body>
</html>`;

  return (
    <iframe
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
