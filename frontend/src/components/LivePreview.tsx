import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

interface Props {
  code: string;
}

/**
 * LivePreview renders generated React + Tailwind code in a sandboxed iframe
 * using Sandpack. The code is injected as App.tsx.
 */
export function LivePreview({ code }: Props) {
  // Wrap the generated code so it always has a default export
  const wrappedCode = ensureDefaultExport(code);

  return (
    <div className="h-full">
      <SandpackProvider
        template="react-ts"
        files={{
          "/App.tsx": {
            code: wrappedCode,
            active: true,
          },
          // Inject Tailwind via CDN in the HTML
          "/public/index.html": {
            code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
            hidden: true,
          },
        }}
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
        }}
        theme="light"
      >
        <div className="h-full [&_.sp-preview-container]:!h-full [&_.sp-preview-iframe]:!h-full">
          <SandpackPreview
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%" }}
          />
        </div>
      </SandpackProvider>
    </div>
  );
}

/**
 * Ensures the generated code has a proper default export.
 * Claude sometimes outputs `function App()` without `export default`.
 */
function ensureDefaultExport(code: string): string {
  // Already has default export
  if (code.includes("export default")) return code;

  // Has a named function — add export default at the end
  const funcMatch = code.match(/function\s+(\w+)\s*\(/);
  if (funcMatch) {
    return `${code}\n\nexport default ${funcMatch[1]};`;
  }

  // Has a const arrow component
  const constMatch = code.match(/(?:const|let)\s+(\w+)\s*=\s*(?:\(|function)/);
  if (constMatch) {
    return `${code}\n\nexport default ${constMatch[1]};`;
  }

  // Fallback: wrap everything in a default export
  return `export default function App() {\n  return (\n${code}\n  );\n}`;
}
