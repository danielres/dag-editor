import { test, describe } from "node:test"
import { strict as assert } from "node:assert"
import { createReactiveState } from "./reactive-state.ts"

describe("createReactiveState", () => {
  test("creates reactive state with initial value", () => {
    const { state } = createReactiveState({ count: 0 })
    assert.equal(state.count, 0)
  })

  test("triggers subscription on state change", (t, done) => {
    const { state, subscribe } = createReactiveState({ count: 0 })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        // initial call + change
        assert.equal(state.count, 1)
        done()
      }
    })

    state.count = 1
  })

  test("calls subscription immediately on subscribe", () => {
    const { subscribe } = createReactiveState({ count: 0 })
    let called = false

    subscribe(() => {
      called = true
    })

    assert.equal(called, true)
  })

  test("batches multiple changes in same microtask", (t, done) => {
    const { state, subscribe } = createReactiveState({ a: 0, b: 0 })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        // initial + batched changes
        assert.equal(state.a, 1)
        assert.equal(state.b, 2)
        done()
      }
    })

    state.a = 1
    state.b = 2
  })

  test("handles nested object changes", (t, done) => {
    const { state, subscribe } = createReactiveState({
      user: { name: "John", age: 30 },
    })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        assert.equal(state.user.name, "Jane")
        done()
      }
    })

    state.user.name = "Jane"
  })

  test("handles array changes", (t, done) => {
    const { state, subscribe } = createReactiveState({
      items: ["a", "b"],
    })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        assert.equal(state.items.length, 3)
        assert.equal(state.items[2], "c")
        done()
      }
    })

    state.items.push("c")
  })

  test("handles property deletion", (t, done) => {
    const { state, subscribe } = createReactiveState({
      a: 1,
      b: 2,
    })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        assert.equal(state.a, undefined)
        assert.equal("a" in state, false)
        done()
      }
    })

    delete state.a
  })

  test("does not trigger on same value assignment", (t, done) => {
    const { state, subscribe } = createReactiveState({ count: 0 })
    let callCount = 0

    subscribe(() => {
      callCount++
    })

    state.count = 0 // same value

    setTimeout(() => {
      assert.equal(callCount, 1) // only initial call
      done()
    }, 10)
  })

  test("unsubscribe function works", () => {
    const { state, subscribe } = createReactiveState({ count: 0 })
    let callCount = 0

    const unsubscribe = subscribe(() => {
      callCount++
    })

    unsubscribe()
    state.count = 1

    assert.equal(callCount, 1) // only initial call
  })

  test("multiple subscribers work independently", (t, done) => {
    const { state, subscribe } = createReactiveState({ count: 0 })
    let calls1 = 0
    let calls2 = 0

    subscribe(() => {
      calls1++
    })
    subscribe(() => {
      calls2++
      if (calls2 === 2) {
        assert.equal(calls1, 2)
        assert.equal(calls2, 2)
        done()
      }
    })

    state.count = 1
  })

  test("handles complex nested structures", (t, done) => {
    const { state, subscribe } = createReactiveState({
      data: {
        users: [{ id: 1, profile: { name: "John" } }],
      },
    })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        assert.equal(state.data.users[0].profile.name, "Jane")
        done()
      }
    })

    state.data.users[0].profile.name = "Jane"
  })

  test("handles adding new nested objects", (t, done) => {
    const { state, subscribe } = createReactiveState({ data: {} })
    let callCount = 0

    subscribe(() => {
      callCount++
      if (callCount === 2) {
        // initial + batched changes
        assert.equal(state.data.user.name, "John")
        done()
      }
    })
    
    state.data.user = { name: "temp" }
    state.data.user.name = "John"
  })
})

