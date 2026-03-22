type EventMap = Record<string, (...args: any[]) => void>;

export class EventEmitter<T extends EventMap> {
  private map = new Map<keyof T, Set<T[keyof T]>>();

  on<K extends keyof T>(event: K, listener: T[K]): () => void {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(listener);
    return () => this.map.get(event)?.delete(listener);
  }

  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): void {
    this.map.get(event)?.forEach((l) => l(...args));
  }
}
