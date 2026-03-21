interface Props {
  code: string;
  description: string;
}

export function CodePanel({ code, description }: Props) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-neutral-500 font-mono">App.tsx</span>
          <span className="text-[10px] text-neutral-600">·</span>
          <span className="text-[10px] text-neutral-500">{description}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1 rounded hover:bg-neutral-800"
        >
          Copy code
        </button>
      </div>

      {/* Code display */}
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed font-mono text-neutral-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
