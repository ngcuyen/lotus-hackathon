import { Box } from "lucide-react";
import { LivePreview } from "./LivePreview";
import { VisualEditor } from "./VisualEditor";

interface PreviewPanelProps {
  result: any;
  editMode: boolean;
  selectedElement: any;
  onElementSelected: (element: any) => void;
  onElementDragged: (element: any, position: { x: number; y: number }) => void;
  onModify: (modifications: any) => void;
  onCloseEditor: () => void;
}

export function PreviewPanel({
  result,
  editMode,
  selectedElement,
  onElementSelected,
  onElementDragged,
  onModify,
  onCloseEditor,
}: PreviewPanelProps) {
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{
        backgroundColor: "var(--scifi-bg)",
      }}
    >
      {/* Preview Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
          backgroundImage: "linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4" style={{ color: "var(--scifi-cyan)" }} />
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--scifi-cyan)", fontFamily: "'Courier New', monospace" }}
          >
            LIVE PREVIEW
          </span>
        </div>
        {result && (
          <div
            className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              color: "var(--scifi-green)",
              border: "1px solid var(--scifi-green)",
              clipPath: "polygon(2px 0, calc(100% - 2px) 0, 100% 2px, 100% calc(100% - 2px), calc(100% - 2px) 100%, 2px 100%, 0 calc(100% - 2px), 0 2px)",
              fontFamily: "'Courier New', monospace",
            }}
          >
            READY
          </div>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 relative overflow-hidden">
        {result ? (
          <>
            <LivePreview
              code={result.component}
              editMode={editMode}
              onElementSelected={onElementSelected}
              onElementDragged={onElementDragged}
            />
            {editMode && selectedElement && (
              <VisualEditor
                selectedElement={selectedElement}
                onModify={onModify}
                onClose={onCloseEditor}
              />
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Box className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--scifi-cyan)", opacity: 0.2 }} />
              <p className="text-xs mb-2" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                NO PREVIEW AVAILABLE
              </p>
              <p className="text-[10px]" style={{ color: "var(--scifi-text-dim)", fontFamily: "'Courier New', monospace" }}>
                Capture or upload a sketch to see your app
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
