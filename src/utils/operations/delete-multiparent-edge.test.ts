import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { applyDeleteOp, undoDeleteOp } from "./delete.ts"
import type { DeleteOperation } from "./operation-types.ts"

function makeMultiParentState() {
  return {
    nodes: {
      alpha: { id: "alpha", label: "Alpha" },
      beta: { id: "beta", label: "Beta" },
      gamma: { id: "gamma", label: "Gamma" },
      delta: { id: "delta", label: "Delta" },
    } as Record<string, { id: string; label: string }>,
    layout: {
      root: ["alpha", "beta"],
      "alpha-children": ["gamma", "delta"],
      "beta-children": ["alpha"], // alpha appears under both root and beta
    } as Record<string, string[]>,
  }
}

describe("Multi-parent edge-based delete operations", () => {
  it("should only remove edge when other instances exist (Case 1)", () => {
    const state = makeMultiParentState()

    // Delete alpha from root (but it still exists under beta)
    const op: DeleteOperation = {
      delete: { id: "alpha", parent_id: "root", label: "Alpha", index: 0, children_ids: ["gamma", "delta"] },
    }

    applyDeleteOp(state, op)

    // Alpha should be removed from root layout
    assert.deepEqual(state.layout.root, ["beta"])

    // Alpha's children should NOT be moved to root
    assert.ok(!state.layout.root.includes("gamma"))
    assert.ok(!state.layout.root.includes("delta"))

    // Alpha should still exist in state.nodes
    assert.equal(state.nodes.alpha.label, "Alpha")

    // Alpha's children should remain intact
    assert.deepEqual(state.layout["alpha-children"], ["gamma", "delta"])

    // Alpha should still exist under beta
    assert.deepEqual(state.layout["beta-children"], ["alpha"])
  })

  it("should move children up when no other instances exist (Case 2)", () => {
    const state = makeMultiParentState()

    // Delete beta (which only appears in root)
    const op: DeleteOperation = {
      delete: { id: "beta", parent_id: "root", label: "Beta", index: 1, children_ids: ["alpha"] },
    }

    applyDeleteOp(state, op)

    // Beta should be removed from root layout
    assert.ok(!state.layout.root.includes("beta"))

    // Beta's children should be moved to root
    assert.deepEqual(state.layout.root, ["alpha", "alpha"])

    // Beta should be removed from state.nodes
    assert.equal(state.nodes.beta, undefined)

    // Beta's children container should be empty
    assert.deepEqual(state.layout["beta-children"] || [], [])
  })

  it("should properly undo Case 1 delete (edge removal only)", () => {
    const state = makeMultiParentState()
    const originalState = JSON.parse(JSON.stringify(state))

    // Delete alpha from root (Case 1)
    const op: DeleteOperation = {
      delete: { id: "alpha", parent_id: "root", label: "Alpha", index: 0, children_ids: ["gamma", "delta"] },
    }

    applyDeleteOp(state, op)
    undoDeleteOp(state, op)

    // State should be restored to original
    assert.deepEqual(state, originalState)
  })

  it("should properly undo Case 2 delete (children moved up)", () => {
    const state = makeMultiParentState()
    const originalState = JSON.parse(JSON.stringify(state))

    // Delete beta (Case 2)
    const op: DeleteOperation = {
      delete: { id: "beta", parent_id: "root", label: "Beta", index: 1, children_ids: ["alpha"] },
    }

    applyDeleteOp(state, op)
    undoDeleteOp(state, op)

    // State should be restored to original
    assert.deepEqual(state, originalState)
  })
})

