import Sortable from "sortablejs"
import { generateNodeId } from "./utils/id-generators.ts"
import { causesCycle } from "./utils/cycle-detection.ts"
import { createReactiveState } from "./utils/reactive-state.ts"
import { createDag } from "./utils/operations/dag-state.ts"
import type { Operation } from "./utils/undo-redo-stack.ts"

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

// Error handling types
export type DagErrorType = "LAST_NODE_DELETE" | "CYCLE_DETECTED" | "NODE_NOT_FOUND" | "NODE_NOT_IN_CONTAINER"

export type DagError = {
  type: DagErrorType
  message: string
  context?: {
    nodeId?: string
    operation?: string
    containerId?: string
  }
}

export type ErrorHandler = (error: DagError) => void

function countNodeInstances(layout: Record<string, string[]>): number {
  const nodeIds = new Set<string>()
  for (const containerId in layout) {
    if (layout[containerId]) {
      layout[containerId].forEach((nodeId) => nodeIds.add(nodeId))
    }
  }
  return nodeIds.size
}

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

  // Store reference to the root container for drag state management
  let rootContainer: HTMLElement | null = null

  // Error handling
  let errorHandler: ErrorHandler | null = null

  function handleError(type: DagErrorType, message: string, context?: DagError["context"]) {
    const error: DagError = { type, message, context }
    if (errorHandler) {
      errorHandler(error)
    } else {
      console.warn("DAG Editor Error:", error)
    }
  }

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
    if (!movingId) return // Let the dispatch method handle the error

    // Use the public dispatch method which includes validation
    publicApi.dispatch({
      move: {
        id: movingId,
        from_parent_id: from.containerId,
        to_parent_id: to.containerId,
        from_index: from.index,
        to_index: to.index,
      },
    })
  }

  function deleteNodeInternal(nodeId: string, containerId: string) {
    const currentState = dag.getState()
    const node = currentState.nodes[nodeId]
    const index = currentState.layout[containerId]?.indexOf(nodeId)
    const children_ids = currentState.layout[nodeId + "-children"] || []

    // Use the public dispatch method which includes validation
    publicApi.dispatch({
      delete: { id: nodeId, parent_id: containerId, label: node?.label || "", index: index || 0, children_ids },
    })
  }

  function createInstanceInternal(nodeId: string, containerId: string) {
    const currentState = dag.getState()
    const currentLayout = currentState.layout[containerId] || []

    // Simply add the same node ID to the end of the parent's layout array
    const newIndex = currentLayout.length

    // Directly modify the layout to add the instance
    if (!currentState.layout[containerId]) {
      currentState.layout[containerId] = []
    }
    currentState.layout[containerId].push(nodeId)

    // Sync the state to update the UI
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
      li.className = "dag-node"
      li.dataset.nodeId = id
      li.innerHTML = [
        '<div class="head">',
        '<span class="node-label">',
        node?.label || "(untitled)",
        "</span>",
        '<span class="node-btns">',
        '<button class="node-btn-add" title="Add child">Add child</button>',
        `<button class="node-btn-instance" title="Add instance">Add instance</button>`,
        '<button class="node-btn-delete" title="Delete node">Delete node</button>',
        "</span>",
        "</div>",
      ].join("")

      ul.appendChild(li)

      const labelElement = li.querySelector(".node-label") as HTMLElement
      labelElement.ondblclick = () => {
        const newLabel = prompt("Rename node", node?.label || "")
        if (newLabel && newLabel !== node?.label) {
          dag.dispatch({
            change_label: { id, old_label: node?.label || "", new_label: newLabel },
          })
          syncState()
        }
      }

      const addButton = li.querySelector(".node-btn-add") as HTMLElement
      addButton.onclick = () => addChildInternal(id)

      const instanceButton = li.querySelector(".node-btn-instance") as HTMLElement
      instanceButton.onclick = () => createInstanceInternal(id, containerId)

      const deleteButton = li.querySelector(".node-btn-delete") as HTMLElement
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
      swapThreshold: 0.3, // Reduce from default 1
      emptyInsertThreshold: 10, // Increase from default 5px
      onChoose(e) {
        // Add dragging class to the root container
        if (rootContainer) rootContainer.classList.add("dag-chosen")
      },
      onEnd(e) {
        // Remove dragging class from the root container
        if (rootContainer) rootContainer.classList.remove("dag-chosen")

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

  // Define the public API object
  const publicApi = {
    // Core operations
    mount: (root: HTMLElement) => {
      // Store reference to root container for drag state management
      rootContainer = root
      subscribe(() => renderInternal(root))
    },
    dispatch: (operation: Operation) => {
      const currentState = dag.getState()

      // Validate operation before dispatching
      if ("delete" in operation) {
        const totalNodeInstances = countNodeInstances(currentState.layout)
        if (totalNodeInstances <= 1) {
          handleError("LAST_NODE_DELETE", "Cannot delete the last node", {
            nodeId: operation.delete.id,
            operation: "delete",
          })
          return
        }

        // Check if node exists
        if (!currentState.nodes[operation.delete.id]) {
          handleError("NODE_NOT_FOUND", "Node not found in state", {
            nodeId: operation.delete.id,
            operation: "delete",
          })
          return
        }

        // Check if node is in the specified container
        const container = currentState.layout[operation.delete.parent_id]
        if (!container || !container.includes(operation.delete.id)) {
          handleError("NODE_NOT_IN_CONTAINER", "Node not found in container", {
            nodeId: operation.delete.id,
            containerId: operation.delete.parent_id,
            operation: "delete",
          })
          return
        }
      }

      if ("move" in operation) {
        const { id, from_parent_id, to_parent_id } = operation.move

        // Check if node exists
        if (!currentState.nodes[id]) {
          handleError("NODE_NOT_FOUND", "Node not found in state", {
            nodeId: id,
            operation: "move",
          })
          return
        }

        // Check if node is in the from container
        const fromContainer = currentState.layout[from_parent_id]
        if (!fromContainer || !fromContainer.includes(id)) {
          handleError("NODE_NOT_IN_CONTAINER", "Node not found in container", {
            nodeId: id,
            containerId: from_parent_id,
            operation: "move",
          })
          return
        }

        if (causesCycle(id, to_parent_id, currentState.layout)) {
          handleError("CYCLE_DETECTED", "Move would create a cycle", {
            nodeId: id,
            containerId: to_parent_id,
            operation: "move",
          })
          syncState()
          return
        }
      }

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

    // Error handling
    onError: (handler: ErrorHandler) => {
      errorHandler = handler
    },

    // Operation history
    getHistory: () => dag.getHistory(),
  }

  return publicApi
}
