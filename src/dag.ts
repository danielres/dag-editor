import Sortable from "sortablejs"
import { generateNodeId } from "./utils/id-generators.ts"
import { causesCycle } from "./utils/cycle-detection.ts"
import { createReactiveState } from "./utils/reactive-state.ts"
import { createDag } from "./utils/operations/dag-state.ts"
import type { Operation } from "./utils/undo-redo-stack.ts"
import { DeleteOperation } from "./utils/operations/operation-types.ts"

// DAG Editor with drag-and-drop and cycle prevention
export interface Node {
  id: string
  label: string
}

export interface State {
  nodes: Record<string, Node>
  layout: Record<string, string[]>
}

export type { Operation }

interface MoveParams {
  from: { containerId: string; index: number }
  to: { containerId: string; index: number }
}

export function createDagEditor(initialState: { nodes: Record<string, Node>; layout: Record<string, string[]> }) {
  // Validation: throw on invalid state (keep simple)
  if (!initialState.nodes || !initialState.layout) {
    throw new Error("Invalid state: must have nodes and layout")
  }

  // Create DAG state management
  const dag = createDag(initialState)

  // Create reactive state as view of DAG state
  const { state, subscribe } = createReactiveState<State>(dag.getState())

  // Sync function
  function syncState() {
    const dagState = dag.getState()
    state.nodes = { ...dagState.nodes }
    state.layout = { ...dagState.layout }
  }

  // Internal functions that need state and dispatch
  function addChildInternal(parentId: string) {
    const label = prompt('Label of new child for "' + state.nodes[parentId].label + '"')
    if (!label) return

    const id = generateNodeId()
    const parentContainerId = parentId + "-children"
    const index = dag.getState().layout[parentContainerId]?.length || 0

    dag.dispatch({
      add: { id, parent_id: parentContainerId, label, index },
    })

    syncState()
  }

  function moveNodeInternal({ from, to }: MoveParams) {
    if (from.containerId === to.containerId && from.index === to.index) return

    const movingId = dag.getState().layout[from.containerId]?.[from.index]
    if (!movingId) {
      // Node not found, force re-render to restore correct visual state
      syncState()
      return
    }

    if (causesCycle(movingId, to.containerId, dag.getState().layout)) {
      alert("Move would create a cycle.")
      // Force re-render to restore correct visual state
      syncState()
      return
    }

    dag.dispatch({
      move: {
        id: movingId,
        from_parent_id: from.containerId,
        to_parent_id: to.containerId,
        from_index: from.index,
        to_index: to.index,
      },
    })

    syncState()
  }

  function deleteNodeInternal(nodeId: string, containerId: string) {
    const totalNodes = Object.keys(dag.getState().nodes).length

    if (totalNodes <= 1) {
      alert("Cannot delete the last node")
      return
    }

    const currentState = dag.getState()
    const node = currentState.nodes[nodeId]
    if (!node) {
      // Node not found, force re-render to restore correct visual state
      syncState()
      return
    }

    const index = currentState.layout[containerId]?.indexOf(nodeId)
    if (index === undefined || index === -1) {
      // Node not found in this container, force re-render to restore correct visual state
      syncState()
      return
    }

    const children_ids = currentState.layout[nodeId + "-children"] || []
    const operation: DeleteOperation = {
      delete: { id: nodeId, parent_id: containerId, label: node.label, index, children_ids },
    }

    dag.dispatch(operation)

    syncState()
  }

  function walkInternal(containerId: string, parent: HTMLElement) {
    const ul = document.createElement("ul")
    ul.dataset.containerId = containerId
    parent.appendChild(ul)
    makeSortableInternal(ul)

    const nodeIds = state.layout[containerId] || []
    nodeIds.forEach((id) => {
      const node = state.nodes[id]
      const li = document.createElement("li")
      li.dataset.nodeId = id
      li.innerHTML = [
        '<span class="label">',
        node?.label || "(untitled)",
        "</span>",
        '<button class="add-btn" title="add child">+</button>',
        '<button class="delete-btn" title="delete node">-</button>',
      ].join("")

      ul.appendChild(li)

      const labelElement = li.querySelector(".label") as HTMLElement
      labelElement.ondblclick = () => {
        const newLabel = prompt("Rename node", node?.label || "")
        if (newLabel && newLabel !== node?.label) {
          dag.dispatch({
            change_label: { id, old_label: node?.label || "", new_label: newLabel },
          })
          syncState()
        }
      }

      const addButton = li.querySelector(".add-btn") as HTMLElement
      addButton.onclick = () => addChildInternal(id)

      const deleteButton = li.querySelector(".delete-btn") as HTMLElement
      deleteButton.onclick = () => deleteNodeInternal(id, containerId)

      walkInternal(id + "-children", li) // recurse
    })
  }

  function makeSortableInternal(ul: HTMLUListElement & { __sortable?: any }) {
    if (ul.__sortable) return
    ul.__sortable = new Sortable(ul, {
      group: "dag",
      animation: 150,
      fallbackOnBody: true,
      onEnd(e) {
        const fromContainerId = ul.dataset.containerId
        const toContainerId = (e.to as HTMLElement).dataset.containerId
        if (fromContainerId && toContainerId && e.oldIndex !== undefined && e.newIndex !== undefined) {
          moveNodeInternal({
            from: { containerId: fromContainerId, index: e.oldIndex },
            to: { containerId: toContainerId, index: e.newIndex },
          })
        }
      },
    })
  }

  function renderInternal(root: HTMLElement) {
    root.innerHTML = ""
    walkInternal("root", root)
  }

  return {
    // Core operations
    mount: (root: HTMLElement) => {
      subscribe(() => renderInternal(root))
    },
    dispatch: (operation: Operation) => {
      dag.dispatch(operation)
      syncState()
    },
    undo: () => {
      dag.undo()
      syncState()
    },
    redo: () => {
      dag.redo()
      syncState()
    },
    canUndo: () => dag.canUndo(),
    canRedo: () => dag.canRedo(),

    // State access
    getCurrentState: () => dag.getState(),
    subscribe: (callback: () => void) => subscribe(callback),

    // Operation history
    getHistory: () => dag.getHistory(),
  }
}
