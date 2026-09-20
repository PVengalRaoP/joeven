"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  type ProgressState,
} from "@/lib/progress";

type Ctx = ProgressState & {
  complete: (id: string) => void;
  uncomplete: (id: string) => void;
  setQuiz: (id: string, score: number) => void;
  setName: (name: string) => void;
  unlockPro: () => void;
  ready: boolean;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyProgress);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadProgress());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveProgress(state);
  }, [state, ready]);

  const complete = useCallback((id: string) => {
    setState((s) =>
      s.completed.includes(id) ? s : { ...s, completed: [...s.completed, id] },
    );
  }, []);

  const uncomplete = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      completed: s.completed.filter((x) => x !== id),
    }));
  }, []);

  const setQuiz = useCallback((id: string, score: number) => {
    setState((s) => ({ ...s, quiz: { ...s.quiz, [id]: score } }));
  }, []);

  const setName = useCallback((name: string) => {
    setState((s) => ({ ...s, name }));
  }, []);

  const unlockPro = useCallback(() => {
    setState((s) => ({ ...s, pro: true }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      complete,
      uncomplete,
      setQuiz,
      setName,
      unlockPro,
      ready,
    }),
    [state, complete, uncomplete, setQuiz, setName, unlockPro, ready],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
