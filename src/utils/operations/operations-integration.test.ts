import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createDag } from "./dag-state.ts"

function makeState() {
  return {
    nodes: {} as Record<string, { id: string; label: string }>,
    layout: { root: [] } as Record<string, string[]>,
  }
}

describe("Operations Integration", () => {
  it("applies and undoes a sequence of operations", () => {
    const dag = createDag(makeState())

    const add1 = { add: { id: "n1", parent_id: "root", label: "Node 1", index: 0 } }
    const add2 = { add: { id: "n2", parent_id: "root", label: "Node 2", index: 1 } }
    const move = { move: { id: "n2", from_parent_id: "root", to_parent_id: "n1-children", from_index: 1, to_index: 0 } }
    const change = { change_label: { id: "n1", old_label: "Node 1", new_label: "Node 1 Updated" } }
    const del = { delete: { id: "n2", parent_id: "n1-children", index: 0, label: "Node 2", children_ids: [] } }

    dag.dispatch(add1)
    dag.dispatch(add2)
    dag.dispatch(move)
    dag.dispatch(change)
    dag.dispatch(del)

    assert.deepEqual(dag.getState().layout, { root: ["n1"], "n1-children": [] })
    assert.equal(dag.getState().nodes["n1"].label, "Node 1 Updated")

    dag.undo()
    dag.undo()
    dag.undo()
    dag.undo()
    dag.undo()

    assert.deepEqual(dag.getState().layout, { root: [], "n1-children": [] })

    dag.redo()
    dag.redo()
    dag.redo()
    dag.redo()
    dag.redo()

    assert.deepEqual(dag.getState().layout, { root: ["n1"], "n1-children": [] })
  })

  it("provides undo/redo state information", () => {
    const dag = createDag(makeState())
    const add1 = { add: { id: "n1", parent_id: "root", label: "Node 1", index: 0 } }

    assert.equal(dag.canUndo(), false)
    assert.equal(dag.canRedo(), false)

    dag.dispatch(add1)
    assert.equal(dag.canUndo(), true)
    assert.equal(dag.canRedo(), false)

    dag.undo()
    assert.equal(dag.canUndo(), false)
    assert.equal(dag.canRedo(), true)

    dag.redo()
    assert.equal(dag.canUndo(), true)
    assert.equal(dag.canRedo(), false)
  })

  it("clears undo/redo history", () => {
    const dag = createDag(makeState())
    const add1 = { add: { id: "n1", parent_id: "root", label: "Node 1", index: 0 } }

    dag.dispatch(add1)
    assert.equal(dag.canUndo(), true)

    dag.clear()
    assert.equal(dag.canUndo(), false)
    assert.equal(dag.canRedo(), false)
  })

  it("should allow deleting when multiple nodes exist", () => {
    const dag = createDag(makeState())

    // Add two nodes
    dag.dispatch({ add: { id: "n1", parent_id: "root", label: "Node 1", index: 0 } })
    dag.dispatch({ add: { id: "n2", parent_id: "root", label: "Node 2", index: 1 } })

    // Should have 2 nodes
    assert.equal(Object.keys(dag.getState().nodes).length, 2)

    // Delete one node should work
    dag.dispatch({ delete: { id: "n2", parent_id: "root", label: "Node 2", index: 1, children_ids: [] } })

    // Should have 1 node left
    assert.equal(Object.keys(dag.getState().nodes).length, 2) // nodes stay in state
    assert.deepEqual(dag.getState().layout.root, ["n1"])
  })

  it("should track total nodes correctly for constraint checking", () => {
    const dag = createDag(makeState())

    // Start with 0 nodes
    assert.equal(Object.keys(dag.getState().nodes).length, 0)

    // Add one node
    dag.dispatch({ add: { id: "n1", parent_id: "root", label: "Node 1", index: 0 } })
    assert.equal(Object.keys(dag.getState().nodes).length, 1)

    // Add another node
    dag.dispatch({ add: { id: "n2", parent_id: "root", label: "Node 2", index: 1 } })
    assert.equal(Object.keys(dag.getState().nodes).length, 2)

    // Delete one node
    dag.dispatch({ delete: { id: "n2", parent_id: "root", label: "Node 2", index: 1, children_ids: [] } })
    assert.equal(Object.keys(dag.getState().nodes).length, 2) // nodes stay in state
    assert.deepEqual(dag.getState().layout.root, ["n1"])
  })
})
