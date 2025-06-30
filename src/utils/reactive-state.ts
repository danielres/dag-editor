// Reactive state management with batched rendering

export interface ReactiveState<T> {
  state: T
  subscribe(callback: () => void): () => void
}

// Creates reactive state with automatic change detection and batched updates
export function createReactiveState<T extends Record<string, any>>(initial: T): ReactiveState<T> {
  const listeners = new Set<() => void>()
  let queued = false

  const schedule = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      listeners.forEach((fn) => fn())
    })
  }

  const wrap = (obj: any): any =>
    new Proxy(obj, {
      get(t, p, r) {
        const v = Reflect.get(t, p, r)
        return v && typeof v === "object" ? wrap(v) : v
      },
      set(t, p, v, r) {
        if (Reflect.get(t, p, r) !== v) {
          const ok = Reflect.set(t, p, v, r)
          schedule()
          return ok
        }
        return true
      },
      deleteProperty(t, p) {
        const ok = Reflect.deleteProperty(t, p)
        schedule()
        return ok
      },
    })

  return {
    state: wrap(initial),
    subscribe(cb) {
      listeners.add(cb)
      cb()
      return () => listeners.delete(cb)
    },
  }
}