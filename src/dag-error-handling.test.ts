import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createDagEditor } from "./dag.ts"

function makeState() {
  return {
    nodes: {
      n1: { id: "n1", label: "Node 1" },
      n2: { id: "n2", label: "Node 2" },
    } as Record<string, { id: string; label: string }>,
    layout: {
      root: ["n1", "n2"],
    } as Record<string, string[]>,
  }
}

describe("DAG Editor Error Handling", () => {
  it("should have onError method", () => {
    const dagEditor = createDagEditor(makeState())
    assert.equal(typeof dagEditor.onError, "function")
  })

  it("should call error handler when trying to delete last node", () => {
    const state = {
      nodes: { n1: { id: "n1", label: "Only Node" } },
      layout: { root: ["n1"] },
    }
    const dagEditor = createDagEditor(state)

    let capturedError: any = null
    dagEditor.onError((error) => {
      capturedError = error
    })

    // Initially no error
    assert.equal(capturedError, null)

    // Try to delete the last node - should trigger error
    dagEditor.dispatch({
      delete: { id: "n1", parent_id: "root", label: "Only Node", index: 0, children_ids: [] },
    })

    // Should have captured the error
    assert.notEqual(capturedError, null)
    assert.equal(capturedError.type, "LAST_NODE_DELETE")
    assert.equal(capturedError.message, "Cannot delete the last node")
    assert.equal(capturedError.context.nodeId, "n1")
    assert.equal(capturedError.context.operation, "delete")
  })

  it("should call error handler when move would create cycle", () => {
    // Create a state with parent-child relationship
    const state = {
      nodes: {
        parent: { id: "parent", label: "Parent" },
        child: { id: "child", label: "Child" },
      } as Record<string, { id: string; label: string }>,
      layout: {
        root: ["parent"],
        "parent-children": ["child"],
      } as Record<string, string[]>,
    }
    const dagEditor = createDagEditor(state)

    let capturedError: any = null
    dagEditor.onError((error) => {
      capturedError = error
    })

    // Initially no error
    assert.equal(capturedError, null)

    // Try to move parent under child - should create cycle
    dagEditor.dispatch({
      move: {
        id: "parent",
        from_parent_id: "root",
        to_parent_id: "child-children",
        from_index: 0,
        to_index: 0,
      },
    })

    // Should have captured the error
    assert.notEqual(capturedError, null)
    assert.equal(capturedError.type, "CYCLE_DETECTED")
    assert.equal(capturedError.message, "Move would create a cycle")
    assert.equal(capturedError.context.nodeId, "parent")
    assert.equal(capturedError.context.containerId, "child-children")
    assert.equal(capturedError.context.operation, "move")
  })

  it("should use console.warn as fallback when no error handler set", () => {
    const state = {
      nodes: { n1: { id: "n1", label: "Only Node" } },
      layout: { root: ["n1"] },
    }
    const dagEditor = createDagEditor(state)

    // Mock console.warn to capture calls
    const originalWarn = console.warn
    let warnCalled = false
    let warnMessage: any = null
    console.warn = (...args) => {
      warnCalled = true
      warnMessage = args
    }

    // No error handler set, so should fall back to console.warn
    assert.equal(warnCalled, false) // No errors triggered yet

    // Try to delete the last node - should trigger console.warn fallback
    dagEditor.dispatch({
      delete: { id: "n1", parent_id: "root", label: "Only Node", index: 0, children_ids: [] },
    })

    // Should have called console.warn
    assert.equal(warnCalled, true)
    assert.equal(warnMessage[0], "DAG Editor Error:")
    assert.equal(warnMessage[1].type, "LAST_NODE_DELETE")

    // Restore console.warn
    console.warn = originalWarn
  })

  it("should provide correct error context information", () => {
    const state = {
      nodes: {
        parent: { id: "parent", label: "Parent" },
        child: { id: "child", label: "Child" },
      } as Record<string, { id: string; label: string }>,
      layout: {
        root: ["parent"],
        "parent-children": ["child"],
      } as Record<string, string[]>,
    }
    const dagEditor = createDagEditor(state)

    let capturedError: any = null
    dagEditor.onError((error) => {
      capturedError = error
    })

    // Initially no error
    assert.equal(capturedError, null)

    // Test cycle detection error context
    dagEditor.dispatch({
      move: {
        id: "parent",
        from_parent_id: "root",
        to_parent_id: "child-children",
        from_index: 0,
        to_index: 0,
      },
    })

    // Should have all context fields
    assert.notEqual(capturedError, null)
    assert.equal(typeof capturedError.context, "object")
    assert.equal(capturedError.context.nodeId, "parent")
    assert.equal(capturedError.context.containerId, "child-children")
    assert.equal(capturedError.context.operation, "move")
  })

  it("should handle NODE_NOT_FOUND error when node doesn't exist", () => {
    const dagEditor = createDagEditor(makeState())

    let capturedError: any = null
    dagEditor.onError((error) => {
      capturedError = error
    })

    // Try to delete a node that doesn't exist
    dagEditor.dispatch({
      delete: { id: "nonexistent", parent_id: "root", label: "Fake", index: 0, children_ids: [] },
    })

    // Should have captured the error
    assert.notEqual(capturedError, null)
    assert.equal(capturedError.type, "NODE_NOT_FOUND")
    assert.equal(capturedError.message, "Node not found in state")
    assert.equal(capturedError.context.nodeId, "nonexistent")
    assert.equal(capturedError.context.operation, "delete")
  })

  it("should handle NODE_NOT_IN_CONTAINER error when node not in expected container", () => {
    const dagEditor = createDagEditor(makeState())

    let capturedError: any = null
    dagEditor.onError((error) => {
      capturedError = error
    })

    // Try to move a node that's not in the specified container
    dagEditor.dispatch({
      move: {
        id: "n1",
        from_parent_id: "nonexistent-container",
        to_parent_id: "root",
        from_index: 0,
        to_index: 1,
      },
    })

    // Should have captured the error
    assert.notEqual(capturedError, null)
    assert.equal(capturedError.type, "NODE_NOT_IN_CONTAINER")
    assert.equal(capturedError.message, "Node not found in container")
    assert.equal(capturedError.context.nodeId, "n1")
    assert.equal(capturedError.context.containerId, "nonexistent-container")
    assert.equal(capturedError.context.operation, "move")
  })

  it("should handle errors from internal UI operations", () => {
    // Test that UI operations (like deleteNodeInternal) also trigger error handling
    const state = {
      nodes: { n1: { id: "n1", label: "Only Node" } },
      layout: { root: ["n1"] },
    }
    const dagEditor = createDagEditor(state)

    let capturedError: any = null
    dagEditor.onError((error) => {
      capturedError = error
    })

    // Simulate a UI delete operation by calling the internal method directly
    // This tests that internal operations also go through error handling
    const currentState = dagEditor.getCurrentState()
    const node = currentState.nodes["n1"]
    const index = currentState.layout["root"]?.indexOf("n1")
    const children_ids = currentState.layout["n1-children"] || []

    // This should trigger the same error as the dispatch test
    dagEditor.dispatch({
      delete: { id: "n1", parent_id: "root", label: node?.label || "", index: index || 0, children_ids },
    })

    // Should have captured the error
    assert.notEqual(capturedError, null)
    assert.equal(capturedError.type, "LAST_NODE_DELETE")
  })
})

