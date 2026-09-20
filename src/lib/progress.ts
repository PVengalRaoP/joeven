export type ProgressState = {
  completed: string[];
  quiz: Record<string, number>;
  pro: boolean;
  name: string;
};

const KEY = "joeven-progress-v1";

export const emptyProgress = (): ProgressState => ({
  completed: [],
  quiz: {},
  pro: false,
  name: "",
});

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ProgressState;
    return {
      completed: parsed.completed ?? [],
      quiz: parsed.quiz ?? {},
      pro: Boolean(parsed.pro),
      name: parsed.name ?? "",
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function lessonId(track: string, slug: string) {
  return `${track}/${slug}`;
}
