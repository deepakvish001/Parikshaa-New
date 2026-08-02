import Editor, { OnMount, type Monaco } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
type IStandaloneCodeEditor = Parameters<OnMount>[0];

interface MonacoEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: string;
  readOnly?: boolean;
  height?: string | number;
  fontSize?: number;
  diagnostics?: MonacoDiagnostic[];
}

export interface MonacoDiagnostic {
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  message: string;
  severity?: "error" | "warning";
}

export interface MonacoEditorHandle {
  format: () => Promise<void>;
  focus: () => void;
  getValue: () => string;
  relayout: () => void;
}

export const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  (
    {
      value,
      onChange,
      language,
      readOnly = false,
      height = "100%",
      fontSize = 13,
      diagnostics = [],
    },
    ref,
  ) => {
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<IStandaloneCodeEditor | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const monacoRef = useRef<Monaco | null>(null);

    const applyDiagnostics = useCallback((ed: IStandaloneCodeEditor, monaco: Monaco, next: MonacoDiagnostic[]) => {
      const model = ed.getModel();
      if (!model) return;
      monaco.editor.setModelMarkers(
        model,
        "parikshaa-code-diagnostics",
        next.map((diagnostic) => {
          const line = Math.max(1, Math.min(diagnostic.line, model.getLineCount()));
          const maxColumn = model.getLineMaxColumn(line);
          const column = Math.max(1, Math.min(diagnostic.column ?? 1, maxColumn));
          return {
            startLineNumber: line,
            startColumn: column,
            endLineNumber: Math.max(line, Math.min(diagnostic.endLine ?? line, model.getLineCount())),
            endColumn: Math.max(column + 1, Math.min(diagnostic.endColumn ?? maxColumn, maxColumn)),
            message: diagnostic.message,
            severity:
              diagnostic.severity === "warning"
                ? monaco.MarkerSeverity.Warning
                : monaco.MarkerSeverity.Error,
          };
        }),
      );
    }, []);

    const relayout = useCallback(() => {
      const ed = editorRef.current;
      const el = containerRef.current;
      if (!ed || !el) return;
      // Force monaco to use 0x0 first so it picks up the parent's actual size,
      // then snap to the real container box. This avoids the editor pinning a
      // stale width that starves adjacent grid columns.
      ed.layout({ width: 0, height: 0 });
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        ed.layout({ width: rect.width, height: rect.height });
      });
    }, []);

    const handleMount: OnMount = useCallback((ed, monaco) => {
      editorRef.current = ed;
      monacoRef.current = monaco;
      ed.updateOptions({
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        lineNumbers: "on",
        roundedSelection: true,
        padding: { top: 12, bottom: 12 },
      });
      applyDiagnostics(ed, monaco, diagnostics);
      // Initial layout once mounted into the live grid
      requestAnimationFrame(() => relayout());
    }, [applyDiagnostics, diagnostics, relayout]);

    useEffect(() => {
      const ed = editorRef.current;
      const monaco = monacoRef.current;
      if (!ed || !monaco) return;
      applyDiagnostics(ed, monaco, diagnostics);
      const firstError = diagnostics.find((diagnostic) => diagnostic.severity !== "warning");
      if (firstError) {
        ed.revealLineInCenter(firstError.line);
      }
    }, [applyDiagnostics, diagnostics]);

    // ResizeObserver on the wrapper — covers the case where the parent grid
    // template changes (e.g. peer join → BattleRoom mounts → siblings appear).
    useEffect(() => {
      const el = containerRef.current;
      if (!el || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(() => relayout());
      ro.observe(el);
      const onWin = () => relayout();
      window.addEventListener("resize", onWin);
      return () => { ro.disconnect(); window.removeEventListener("resize", onWin); };
    }, [relayout]);

    useImperativeHandle(ref, () => ({
      format: async () => {
        const ed = editorRef.current;
        if (!ed) return;
        const action = ed.getAction("editor.action.formatDocument");
        if (action) await action.run();
      },
      focus: () => editorRef.current?.focus(),
      getValue: () => editorRef.current?.getValue() ?? "",
      relayout,
    }));

    return (
      <div ref={containerRef} className="w-full h-full min-w-0" data-testid="monaco-wrapper">
        <Editor
          height={height}
          width="100%"
          value={value}
          onChange={(v) => onChange(v ?? "")}
          language={language}
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
          onMount={handleMount}
          options={{
            readOnly,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            fontSize,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              
            </div>
          }
        />
      </div>
    );
  },
);

MonacoEditor.displayName = "MonacoEditor";
