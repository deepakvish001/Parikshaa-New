import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "parikshaa:visualize-code-files:v1";

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  code: string;
}

const EXT: Record<string, string> = {
  python: "py",
  javascript: "js",
  typescript: "ts",
  java: "java",
  c: "c",
  "c++": "cpp",
  "c#": "cs",
  go: "go",
  rust: "rs",
  kotlin: "kt",
  swift: "swift",
  php: "php",
  ruby: "rb",
  scala: "scala",
  dart: "dart",
  r: "R",
  sql: "sql",
};

export const fileExtension = (language: string) => EXT[language] ?? "txt";

const newId = () =>
  `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

interface Persisted {
  files: CodeFile[];
  activeId: string;
}

const read = (): Persisted | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Persisted;
    if (!Array.isArray(parsed?.files) || parsed.files.length === 0) return null;
    const files = parsed.files.filter(
      (f) => f && typeof f.id === "string" && typeof f.code === "string",
    );
    if (!files.length) return null;
    return {
      files,
      activeId: files.some((f) => f.id === parsed.activeId) ? parsed.activeId : files[0].id,
    };
  } catch {
    return null;
  }
};

/**
 * Multi-file workspace for the code visualizer.
 * Files are persisted locally so tabs survive reloads.
 */
export const useCodeFiles = (initialCode: string, initialLanguage = "python") => {
  const [state, setState] = useState<Persisted>(() => {
    const stored = read();
    if (stored) return stored;
    const first: CodeFile = {
      id: newId(),
      name: `main.${fileExtension(initialLanguage)}`,
      language: initialLanguage,
      code: initialCode,
    };
    return { files: [first], activeId: first.id };
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const active = useMemo(
    () => state.files.find((f) => f.id === state.activeId) ?? state.files[0],
    [state],
  );

  const patchActive = useCallback((patch: Partial<CodeFile>) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.id === prev.activeId ? { ...f, ...patch } : f)),
    }));
  }, []);

  const setCode = useCallback((code: string) => patchActive({ code }), [patchActive]);

  const setLanguage = useCallback(
    (language: string) => {
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => {
          if (f.id !== prev.activeId) return f;
          const base = f.name.replace(/\.[^.]+$/, "");
          return { ...f, language, name: `${base}.${fileExtension(language)}` };
        }),
      }));
    },
    [],
  );

  const select = useCallback((id: string) => {
    setState((prev) =>
      prev.files.some((f) => f.id === id) ? { ...prev, activeId: id } : prev,
    );
  }, []);

  const addFile = useCallback((seed?: Partial<CodeFile>) => {
    const id = newId();
    setState((prev) => {
      const language = seed?.language ?? prev.files.find((f) => f.id === prev.activeId)?.language ?? "python";
      const used = new Set(prev.files.map((f) => f.name));
      let name = seed?.name ?? `file${prev.files.length + 1}.${fileExtension(language)}`;
      let n = prev.files.length + 1;
      while (used.has(name)) {
        n += 1;
        name = `file${n}.${fileExtension(language)}`;
      }
      const file: CodeFile = { id, name, language, code: seed?.code ?? "" };
      return { files: [...prev.files, file], activeId: id };
    });
    return id;
  }, []);

  const closeFile = useCallback((id: string) => {
    setState((prev) => {
      if (prev.files.length <= 1) return prev;
      const idx = prev.files.findIndex((f) => f.id === id);
      if (idx < 0) return prev;
      const files = prev.files.filter((f) => f.id !== id);
      const activeId =
        prev.activeId === id ? files[Math.max(0, idx - 1)].id : prev.activeId;
      return { files, activeId };
    });
  }, []);

  const renameFile = useCallback((id: string, name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      files: prev.files.map((f) => (f.id === id ? { ...f, name: clean } : f)),
    }));
  }, []);

  return {
    files: state.files,
    activeId: state.activeId,
    active,
    setCode,
    setLanguage,
    select,
    addFile,
    closeFile,
    renameFile,
  };
};
