// @ts-ignore
import Sortable from "sortablejs"
import { generateNodeId } from "./utils/id-generators.js"
import { causesCycle } from "./utils/cycle-detection.js"
import { createReactiveState } from "./utils/reactive-state.js"
import { createDag } from "./utils/operations/dag-state.js"

// DAG Editor with drag-and-drop and cycle prevention
interface Node {
  id: string
  label: string
}

interface State {
  nodes: Record<string, Node>
  layout: Record<string, string[]>
}

// Initialize DAG state management as single source of truth
const dag = createDag({
  nodes: {}, // canonical nodes  id -> {label…}
  layout: { root: [] }, // containerId -> [nodeIds]
})

// Create reactive state as a view of DAG state
const { state, subscribe } = createReactiveState<State>(dag.getState())

// Sync reactive state with DAG state after operations
function syncState() {
  const dagState = dag.getState()
  // Force reactive update by modifying properties individually
  state.nodes = { ...dagState.nodes }
  state.layout = { ...dagState.layout }
}

// Legacy functions kept for seed data initialization
function ensureChildren(id: string) {
  const key = id + "-children"
  if (!state.layout[key]) state.layout[key] = []
}

function upsertNode(node: Partial<Node> & { id: string }) {
  if (!state.nodes[node.id]) ensureChildren(node.id)
  state.nodes[node.id] = Object.assign({}, state.nodes[node.id] || {}, node) as Node
}
interface MoveParams {
  from: { containerId: string; index: number }
  to: { containerId: string; index: number }
}

function moveNode({ from, to }: MoveParams) {
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

function addChild(parentId: string) {
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
function mount(root: HTMLElement) {
  subscribe(() => render(root))
}

function render(root: HTMLElement) {
  root.innerHTML = ""
  renderControls(root)
  walk("root", root)
}

function renderControls(root: HTMLElement) {
  const controls = document.createElement("div")
  controls.className = "dag-controls"
  controls.innerHTML = `
    <button id="undo-btn" ${!dag.canUndo() ? "disabled" : ""}>↶ Undo</button>
    <button id="redo-btn" ${!dag.canRedo() ? "disabled" : ""}>↷ Redo</button>
  `

  const undoBtn = controls.querySelector("#undo-btn") as HTMLButtonElement
  const redoBtn = controls.querySelector("#redo-btn") as HTMLButtonElement

  undoBtn.onclick = () => {
    dag.undo()
    syncState()
  }

  redoBtn.onclick = () => {
    dag.redo()
    syncState()
  }

  root.appendChild(controls)
}

function walk(containerId: string, parent: HTMLElement) {
  const ul = document.createElement("ul")
  ul.dataset.containerId = containerId
  parent.appendChild(ul)
  makeSortable(ul)

  const nodeIds = state.layout[containerId] || []
  nodeIds.forEach((id) => {
    const node = state.nodes[id]
    const li = document.createElement("li")
    li.dataset.nodeId = id
    li.innerHTML =
      '<span class="title">' +
      (node?.label || "(untitled)") +
      "</span>" +
      '<span class="add-btn" title="add child">➕</span>'
    ul.appendChild(li)

    const titleElement = li.querySelector(".title") as HTMLElement
    titleElement.ondblclick = () => {
      const newLabel = prompt("Rename node", node?.label || "")
      if (newLabel && newLabel !== node?.label) {
        dag.dispatch({
          change_label: { id, old_label: node?.label || "", new_label: newLabel },
        })
        syncState()
      }
    }

    const addButton = li.querySelector(".add-btn") as HTMLElement
    addButton.onclick = () => addChild(id)

    walk(id + "-children", li) // recurse
  })
}

function makeSortable(ul: HTMLUListElement & { __sortable?: any }) {
  if (ul.__sortable) return
  ul.__sortable = new Sortable(ul, {
    group: "dag",
    animation: 150,
    fallbackOnBody: true,
    ghostClass: "sortable-ghost",
    onEnd(e) {
      const fromContainerId = ul.dataset.containerId
      const toContainerId = (e.to as HTMLElement).dataset.containerId
      if (fromContainerId && toContainerId && e.oldIndex !== undefined && e.newIndex !== undefined) {
        const moveResult = moveNode({
          from: { containerId: fromContainerId, index: e.oldIndex },
          to: { containerId: toContainerId, index: e.newIndex },
        })

        // If move was rejected, revert the visual change
        if (moveResult === false) {
          // Force complete re-render to restore correct state
          setTimeout(() => {
            const appElement = document.getElementById("app")
            if (appElement) render(appElement)
          }, 0)
        }
      }
    },
  })
}

// Seed data - keep as direct initialization (reflects real usage)
upsertNode({ id: "A", label: "Alpha" })
upsertNode({ id: "B", label: "Beta" })
upsertNode({ id: "A1", label: "Alpha-child-1" })
upsertNode({ id: "A2", label: "Alpha-child-2" })

state.layout.root.push("A", "B")
state.layout["B-children"] = ["A"] // Beta contains Alpha (duplicate)
state.layout["A-children"] = ["A1", "A2"]

// Sync the initial seed data to DAG state
Object.assign(dag.getState(), state)
const appElement = document.getElementById("app")
if (appElement) {
  mount(appElement)
}
