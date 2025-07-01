import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { applyAddOp, undoAddOp } from "./add.ts"
import { applyMoveOp, undoMoveOp } from "./move.ts"
import { applyChangeLabelOp, undoChangeLabelOp } from "./change-label.ts"
import { applyDeleteOp, undoDeleteOp } from "./delete.ts"
import { UndoRedoStack } from "../undo-redo-stack.ts"

function makeState() {
  return {
    nodes: {} as Record<string, { id: string; label: string }>,
    layout: { root: [] } as Record<string, string[]>,
  }
}

describe("Operations Integration", () => {
  it("applies and undoes a sequence of operations", () => {
    const stack = new UndoRedoStack()
    const state = makeState()

    const add1 = { add: { id: "n1", parent_id: "root", label: "Node 1", index: 0 } }
    const add2 = { add: { id: "n2", parent_id: "root", label: "Node 2", index: 1 } }
    const move = { move: { id: "n2", from_parent_id: "root", to_parent_id: "n1-children", from_index: 1, to_index: 0 } }
    const change = { change_label: { id: "n1", old_label: "Node 1", new_label: "Node 1 Updated" } }
    const del = { delete: { id: "n2", parent_id: "n1-children", index: 0, label: "Node 2", children_ids: [] } }

    stack.push(add1)
    applyAddOp(state, add1)

    stack.push(add2)
    applyAddOp(state, add2)

    stack.push(move)
    applyMoveOp(state, move)

    stack.push(change)
    applyChangeLabelOp(state, change)

    stack.push(del)
    applyDeleteOp(state, del)

    assert.deepEqual(state.layout, { root: ["n1"], "n1-children": [] })
    assert.equal(state.nodes["n1"].label, "Node 1 Updated")

    undoChangeLabelOp(state, change)
    undoDeleteOp(state, del)
    undoMoveOp(state, move)
    undoAddOp(state, add2)
    undoAddOp(state, add1)

    assert.deepEqual(state.layout, { root: [], "n1-children": [] })

    applyAddOp(state, add1)
    applyAddOp(state, add2)
    applyMoveOp(state, move)
    applyChangeLabelOp(state, change)
    applyDeleteOp(state, del)

    assert.deepEqual(state.layout, { root: ["n1"], "n1-children": [] })
  })
})
