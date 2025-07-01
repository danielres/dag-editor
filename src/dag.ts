// @ts-ignore
import Sortable from "sortablejs"
import { generateNodeId } from "./utils/id-generators.js"
import { moveItemWithinArray, moveItemBetweenArrays } from "./utils/array-operations.js"
import { causesCycle } from "./utils/cycle-detection.js"
import { createReactiveState } from "./utils/reactive-state.js"

// DAG Editor with drag-and-drop and cycle prevention
const { state, subscribe } = createReactiveState({
  nodes: {}, // canonical nodes  id -> {title…}
  layout: { root: [] }, // containerId -> [nodeIds]
})

function ensureChildren(id) {
  const key = id + "-children"
  if (!state.layout[key]) state.layout[key] = []
}

function upsertNode(node) {
  if (!state.nodes[node.id]) ensureChildren(node.id)
  state.nodes[node.id] = Object.assign({}, state.nodes[node.id] || {}, node)
}
function moveNode({ from, to }) {
  if (from.containerId === to.containerId && from.index === to.index) return

  const movingId = state.layout[from.containerId][from.index]
  if (causesCycle(movingId, to.containerId, state.layout)) {
    alert("Move would create a cycle.")
    return
  }

  if (from.containerId === to.containerId) {
    // Moving within same container
    state.layout[from.containerId] = moveItemWithinArray(state.layout[from.containerId], from.index, to.index)
  } else {
    // Moving between different containers
    const { sourceArray, destArray } = moveItemBetweenArrays(
      state.layout[from.containerId],
      from.index,
      state.layout[to.containerId],
      to.index
    )
    state.layout[from.containerId] = sourceArray
    state.layout[to.containerId] = destArray
  }
}

function addChild(parentId) {
  const title = prompt('Title of new child for "' + state.nodes[parentId].title + '"')
  if (!title) return

  const id = generateNodeId()
  upsertNode({ id, title })
  ensureChildren(parentId)
  state.layout[parentId + "-children"] = state.layout[parentId + "-children"].concat(id) // immutable push
}
function mount(root) {
  subscribe(() => render(root))
}

function render(root) {
  root.innerHTML = ""
  walk("root", root)
}

function walk(containerId, parent) {
  const ul = document.createElement("ul")
  ul.dataset.containerId = containerId
  parent.appendChild(ul)
  makeSortable(ul)
  ;(state.layout[containerId] || []).forEach((id) => {
    const node = state.nodes[id] || {}
    const li = document.createElement("li")
    li.dataset.nodeId = id
    li.innerHTML =
      '<span class="title">' +
      (node.title || "(untitled)") +
      "</span>" +
      '<span class="add-btn" title="add child">➕</span>'
    ul.appendChild(li)

    (li.querySelector(".title") as HTMLElement).ondblclick = () => {
      const t = prompt("Rename node", node.title)
      if (t) upsertNode({ id, title: t })
    }

    (li.querySelector(".add-btn") as HTMLElement).onclick = () => addChild(id)

    walk(id + "-children", li) // recurse
  })
}

function makeSortable(ul) {
  if (ul.__sortable) return
  ul.__sortable = new Sortable(ul, {
    group: "dag",
    animation: 150,
    fallbackOnBody: true,
    ghostClass: "sortable-ghost",
    onEnd(e) {
      moveNode({
        from: { containerId: ul.dataset.containerId, index: e.oldIndex },
        to: { containerId: e.to.dataset.containerId, index: e.newIndex },
      })
    },
  })
}

// Seed data
upsertNode({ id: "A", title: "Alpha" })
upsertNode({ id: "B", title: "Beta" })
upsertNode({ id: "A1", title: "Alpha-child-1" })
upsertNode({ id: "A2", title: "Alpha-child-2" })

state.layout.root.push("A", "B")
state.layout["B-children"] = ["A"] // Beta contains Alpha (duplicate)
state.layout["A-children"] = ["A1", "A2"]
mount(document.getElementById("app"))
