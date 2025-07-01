import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { applyMoveOp, undoMoveOp } from "./move.ts"
import type { MoveOperation } from "./operation-types.ts"

function makeState() {
  return {
    nodes: {
      n1: { id: "n1", label: "Node 1" },
      n2: { id: "n2", label: "Node 2" },
    } as Record<string, { id: string; label: string }>,
    layout: {
      root: ["n1"],
      "n1-children": ["n2"],
      "n2-children": [],
    } as Record<string, string[] | undefined>,
  }
}

describe("applyMoveOp and undoMoveOp", () => {
  it("moves node from one parent to another at specified indexes", () => {
    const state = makeState()
    // Move n2 from n1-children[0] to root[1]
    const op: MoveOperation = {
      move: {
        id: "n2",
        from_parent_id: "n1-children",
        to_parent_id: "root",
        from_index: 0,
        to_index: 1,
      },
    }
    applyMoveOp(state, op)
    assert.deepEqual(state.layout["n1-children"], [])
    assert.deepEqual(state.layout.root, ["n1", "n2"])
    undoMoveOp(state, op)
    assert.deepEqual(state.layout["n1-children"], ["n2"])
    assert.deepEqual(state.layout.root, ["n1"])
  })

  it("creates to_parent layout array if missing", () => {
    const state = makeState()
    state.layout["other"] = undefined
    // Move n1 to new parent "other"
    const op: MoveOperation = {
      move: {
        id: "n1",
        from_parent_id: "root",
        to_parent_id: "other",
        from_index: 0,
        to_index: 0,
      },
    }
    applyMoveOp(state, op)
    assert.deepEqual(state.layout.root, [])
    assert.deepEqual(state.layout.other, ["n1"])
    undoMoveOp(state, op)
    assert.deepEqual(state.layout.root, ["n1"])
    assert.deepEqual(state.layout.other, [])
  })

  it("does nothing if node not found in from_parent", () => {
    const state = makeState()
    // Move n2 from wrong index/parent
    const op: MoveOperation = {
      move: {
        id: "n2",
        from_parent_id: "root",
        to_parent_id: "n1-children",
        from_index: 0,
        to_index: 0,
      },
    }
    applyMoveOp(state, op)
    // n2 stays under n1-children, nothing moves
    assert.deepEqual(state.layout["n1-children"], ["n2"])
    assert.deepEqual(state.layout.root, ["n1"])
  })
})

