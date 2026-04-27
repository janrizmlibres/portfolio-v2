type ScrollSection = "about" | "work" | "projects" | "contact";
type ProjectSlug = "flowstack" | "pulsevr" | "mercado";

interface Events {
  scrollTo: { section: ScrollSection };
  highlightProject: { slug: ProjectSlug };
}

type Listener<K extends keyof Events> = (data: Events[K]) => void;

const listeners = new Map<keyof Events, Set<Listener<keyof Events>>>();

export function on<K extends keyof Events>(event: K, fn: Listener<K>) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  (listeners.get(event) as Set<Listener<K>>).add(fn);
  return () => listeners.get(event)?.delete(fn as Listener<keyof Events>);
}

export function emit<K extends keyof Events>(event: K, data: Events[K]) {
  listeners.get(event)?.forEach((fn) => (fn as Listener<K>)(data));
}
