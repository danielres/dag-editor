import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { applyDeleteOp, undoDeleteOp } from "./delete.ts"
import type { DeleteOperation } from "./operation-types.ts"

function makeState() {
  return {
    nodes: {
      n1: { id: "n1", title: "Parent" },
      c1: { id: "c1", title: "Child1" },
      c2: { id: "c2", title: "Child2" },
      n2: { id: "n2", title: "Unrelated" },
    } as Record<string, { id: string; title: string }>,
    layout: {
      root: ["n1", "n2"],
      "n1-children": ["c1", "c2"],
      "n2-children": [],
    } as Record<string, string[]>,
  }
}

describe("applyDeleteOp and undoDeleteOp", () => {
  it("deletes node and moves children to parent", () => {
    const state = makeState()
    const op: DeleteOperation = {
      delete: {
        id: "n1",
        parent_id: "root",
        label: "Parent",
        index: 0,
        children_ids: ["c1", "c2"],
      },
    }
    applyDeleteOp(state, op)
    assert.deepEqual(state.layout.root, ["c1", "c2", "n2"])
    assert.deepEqual(state.layout["n1-children"], [])
    undoDeleteOp(state, op)
    assert.deepEqual(state.layout.root, ["n1", "n2"])
    assert.deepEqual(state.layout["n1-children"], ["c1", "c2"])
  })

  it("deletes node with no children", () => {
    const state = makeState()
    state.nodes.n3 = { id: "n3", title: "Leaf" }
    state.layout.root.push("n3")
    const op: DeleteOperation = {
      delete: {
        id: "n3",
        parent_id: "root",
        label: "Leaf",
        index: 2,
        children_ids: [],
      },
    }
    applyDeleteOp(state, op)
    assert.deepEqual(state.layout.root, ["n1", "n2"])
    undoDeleteOp(state, op)
    assert.deepEqual(state.layout.root, ["n1", "n2", "n3"])
  })

  it("restores children only for this parent", () => {
    const state = makeState()
    state.layout.root = ["n1"]
    state.layout["n1-children"] = ["c1"]
    state.layout["c1-children"] = []
    // c1 also appears under n2
    state.layout["n2-children"] = ["c1"]
    const op: DeleteOperation = {
      delete: {
        id: "n1",
        parent_id: "root",
        label: "Parent",
        index: 0,
        children_ids: ["c1"],
      },
    }
    applyDeleteOp(state, op)
    assert.deepEqual(state.layout.root, ["c1"])
    assert.deepEqual(state.layout["n1-children"], [])
    // c1 is still present under n2
    assert.deepEqual(state.layout["n2-children"], ["c1"])
    undoDeleteOp(state, op)
    assert.deepEqual(state.layout.root, ["n1"])
    assert.deepEqual(state.layout["n1-children"], ["c1"])
  })
})

