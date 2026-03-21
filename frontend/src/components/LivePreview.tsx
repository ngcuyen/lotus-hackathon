import { useRef } from "react";
import { SandpackProvider, SandpackPreview, SandpackConsole } from "@codesandbox/sandpack-react";

interface Props {
  code: string;
}

export function LivePreview({ code }: Props) {
  // Sanitize imports FIRST (remove unknown packages), then ensure default export
  const wrappedCode = ensureDefaultExport(sanitizeImports(code));

  console.log("[LivePreview] rendering with code:", wrappedCode.substring(0, 150));

  // FIX #2: Use a counter key (not full code string) to avoid memory issues
  // while still forcing Sandpack to remount when code changes.
  const keyRef = useRef(0);
  const prevCodeRef = useRef("");
  if (prevCodeRef.current !== wrappedCode) {
    prevCodeRef.current = wrappedCode;
    keyRef.current += 1;
  }

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 500, display: "flex", flexDirection: "column" }}>
      <SandpackProvider
        // FIX #3: Use react-ts template (not react) because GPT-4o/Claude
        // almost always generates TypeScript syntax. Using "react" + .js
        // causes parse errors on TypeScript annotations.
        template="react-ts"
        key={keyRef.current}
        customSetup={{
          // FIX #1: Pre-install packages GPT-4o commonly imports.
          // Without this, Sandpack throws "Module not found" and shows
          // an error overlay instead of the generated UI.
          dependencies: {
            "lucide-react": "^0.400.0",
            "framer-motion": "^11.0.0",
            "clsx": "^2.1.0",
          },
        }}
        files={{
          // DEBUG: hardcode a bright red component to test if Sandpack renders
          "/App.tsx": `export default function App() {
  return (
    <div style={{padding: 40, background: '#ef4444', color: 'white', fontSize: 24, minHeight: '100vh'}}>
      <h1>✅ Sandpack is working!</h1>
      <p>Generated code: ${code?.length} chars</p>
    </div>
  );
}`,
          // Inject Tailwind CDN + fonts via the public HTML template
          "/public/index.html": `<!DOCTYPE html>
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
          // FIX #4: Disable TypeScript strict mode so AI-generated code
          // (missing type annotations, implicit any, etc.) doesn't cause
          // TS errors that block the preview from rendering.
          "/tsconfig.json": JSON.stringify({
            include: ["./**/*"],
            compilerOptions: {
              strict: false,
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              skipLibCheck: true,
              lib: ["dom", "dom.iterable", "es2017"],
              jsx: "react-jsx",
            },
          }),
        }}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          ],
        }}
        theme="light"
      >
        <SandpackPreview
          showOpenInCodeSandbox={false}
          showRefreshButton={true}
          style={{ flex: 1, minHeight: 400 }}
        />
        <SandpackConsole style={{ height: 80 }} />
      </SandpackProvider>
    </div>
  );
}

/**
 * FIX #1 (companion): Strip imports of packages NOT in our customSetup.
 * Safety net for when the AI ignores the "no external imports" rule.
 *
 * Kept packages: react, lucide-react, framer-motion, clsx
 * Stripped: @shadcn/ui, @radix-ui, tailwind-merge, react-icons, etc.
 */
function sanitizeImports(code: string): string {
  const ALLOWED_PACKAGES = new Set([
    "react",
    "lucide-react",
    "framer-motion",
    "clsx",
  ]);

  return code
    .split("\n")
    .map((line) => {
      // Match: import X from 'pkg' / import { X } from "pkg" / import type ...
      const importMatch = line.match(/^import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
      if (!importMatch) return line;
      const pkg = importMatch[1];
      // Always allow relative/absolute imports
      if (pkg.startsWith(".") || pkg.startsWith("/")) return line;
      // Allow whitelisted packages
      if (ALLOWED_PACKAGES.has(pkg)) return line;
      // Strip unknown package, leave a comment so it's visible in CodePanel
      return `// [auto-removed import: "${pkg}" — not available in preview]`;
    })
    .join("\n");
}

/**
 * Ensures the generated code has a proper default export.
 * The AI sometimes outputs function App() without export default.
 *
 * FIX #3 (edge case): Check for literal "export default" to avoid matching
 * the string inside a JSON blob that was accidentally passed as code.
 */
function ensureDefaultExport(code: string): string {
  // Check for actual export default declaration (not inside a string/comment)
  // Simple heuristic: if code starts with { it's probably JSON, not JSX
  const looksLikeJson = code.trimStart().startsWith("{") && !code.includes("return (") && !code.includes("return(");
  if (!looksLikeJson && code.includes("export default")) return code;

  // Has a named function declaration
  const funcMatch = code.match(/^function\s+(\w+)\s*\(/m);
  if (funcMatch) return `${code}\n\nexport default ${funcMatch[1]};`;

  // Has a const/let arrow function component
  const constMatch = code.match(/^(?:const|let)\s+(\w+)\s*=\s*(?:\(|function|\()/m);
  if (constMatch) return `${code}\n\nexport default ${constMatch[1]};`;

  // Fallback: wrap everything in a default export
  return `export default function App() {\n  return (\n${code}\n  );\n}`;
}
