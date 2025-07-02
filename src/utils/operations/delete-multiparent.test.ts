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
    } as Record<string, { id: string; label: string }>,
    layout: {
      root: ["alpha", "beta"],
      "alpha-children": ["gamma"],
      "beta-children": ["alpha"], // alpha appears under both root and beta
    } as Record<string, string[]>,
  }
}

describe("Multi-parent delete operations", () => {
  it("should not remove node from state.nodes when other instances exist", () => {
    const state = makeMultiParentState()

    // Delete alpha from root (but it still exists under beta)
    const op: DeleteOperation = {
      delete: { id: "alpha", parent_id: "root", label: "Alpha", index: 0, children_ids: ["gamma"] },
    }

    applyDeleteOp(state, op)

    // Alpha should be removed from root layout, children should NOT be moved to root
    assert.deepEqual(state.layout.root, ["beta"])

    // Alpha should still exist in state.nodes (because it appears under beta)
    assert.equal(state.nodes.alpha.label, "Alpha")

    // Alpha's children should remain intact
    assert.deepEqual(state.layout["alpha-children"], ["gamma"])

    // Alpha should still exist under beta
    assert.deepEqual(state.layout["beta-children"], ["alpha"])
  })

  it("should remove node from state.nodes when no other instances exist", () => {
    const state = makeMultiParentState()

    // Delete beta (which only appears in root)
    const op: DeleteOperation = {
      delete: { id: "beta", parent_id: "root", label: "Beta", index: 1, children_ids: ["alpha"] },
    }

    applyDeleteOp(state, op)

    // Beta should be removed from root layout, its children moved to root
    assert.deepEqual(state.layout.root, ["alpha", "alpha"])

    // Beta should be removed from state.nodes (no other instances)
    assert.equal(state.nodes.beta, undefined)
  })

  it("should properly undo multi-parent delete", () => {
    const state = makeMultiParentState()
    const originalState = JSON.parse(JSON.stringify(state))

    // Delete alpha from root
    const op: DeleteOperation = {
      delete: { id: "alpha", parent_id: "root", label: "Alpha", index: 0, children_ids: ["gamma"] },
    }

    applyDeleteOp(state, op)
    undoDeleteOp(state, op)

    // State should be restored to original
    assert.deepEqual(state, originalState)
  })

  it("should properly undo single-instance delete", () => {
    const state = makeMultiParentState()
    const originalState = JSON.parse(JSON.stringify(state))

    // Delete beta (single instance)
    const op: DeleteOperation = {
      delete: { id: "beta", parent_id: "root", label: "Beta", index: 1, children_ids: ["alpha"] },
    }

    applyDeleteOp(state, op)
    undoDeleteOp(state, op)

    // State should be restored to original
    assert.deepEqual(state, originalState)
  })
})

