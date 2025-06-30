import Sortable from 'sortablejs';

/* ================================================================
   Sortable DAG with duplicate nodes & robust cycle-guard
   (JS pane for CodePen – add SortableJS CDN as external script)
   ---------------------------------------------------------------
   External script URL → https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js
================================================================ */

/* 1 ─ Reactive state with batched rendering ───────────────────── */
function createReactiveState(initial) {
  const listeners = new Set()
  let queued = false

  const schedule = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      listeners.forEach((fn) => fn())
    })
  }

  const wrap = (obj) =>
    new Proxy(obj, {
      get(t, p, r) {
        const v = Reflect.get(t, p, r)
        return v && typeof v === "object" ? wrap(v) : v
      },
      set(t, p, v, r) {
        if (Reflect.get(t, p, r) !== v) {
          const ok = Reflect.set(t, p, v, r)
          schedule()
          return ok
        }
        return true
      },
      deleteProperty(t, p) {
        const ok = Reflect.deleteProperty(t, p)
        schedule()
        return ok
      },
    })

  return {
    state: wrap(initial),
    subscribe(cb) {
      listeners.add(cb)
      cb()
      return () => listeners.delete(cb)
    },
  }
}

/* 2 ─ Store helpers ───────────────────────────────────────────── */
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

/* --- cycle detection (checks full subtree) -------------------- */
function causesCycle(movedId, destContainerId) {
  if (destContainerId === "root") return false
  const destParentId = destContainerId.replace(/-children$/, "")

  if (destParentId === movedId) return true // trivial self-parent

  return isDescendant(destParentId, movedId, new Set())
}

function isDescendant(targetId, currentId, seen) {
  if (seen.has(currentId)) return false // defensive
  seen.add(currentId)

  const children = state.layout[currentId + "-children"] || []
  for (let childId of children) {
    if (childId === targetId) return true
    if (isDescendant(targetId, childId, seen)) return true
  }
  return false
}

/* --- immutable array move with cycle guard -------------------- */
function movePointer({ from, to }) {
  if (from.containerId === to.containerId && from.index === to.index) return

  const movingId = state.layout[from.containerId][from.index]
  if (causesCycle(movingId, to.containerId)) {
    alert("Move would create a cycle.")
    return
  }

  const srcArr = state.layout[from.containerId].slice() // copy
  const [id] = srcArr.splice(from.index, 1) // remove

  const dstArr =
    from.containerId === to.containerId
      ? srcArr // same array
      : state.layout[to.containerId].slice() // copy dest

  dstArr.splice(to.index, 0, id) // insert

  state.layout[from.containerId] = srcArr // 1st proxy write
  if (from.containerId !== to.containerId) {
    state.layout[to.containerId] = dstArr // 2nd proxy write
  }
}

function addChild(parentId) {
  const title = prompt('Title of new child for "' + state.nodes[parentId].title + '"')
  if (!title) return

  const id = "N" + Math.random().toString(36).slice(2, 9)
  upsertNode({ id, title })
  ensureChildren(parentId)
  state.layout[parentId + "-children"] = state.layout[parentId + "-children"].concat(id) // immutable push
}

/* 3 ─ View (full re-render, still fast for demo) ─────────────── */
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

    li.querySelector(".title").ondblclick = () => {
      const t = prompt("Rename node", node.title)
      if (t) upsertNode({ id, title: t })
    }

    li.querySelector(".add-btn").onclick = () => addChild(id)

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
      movePointer({
        from: { containerId: ul.dataset.containerId, index: e.oldIndex },
        to: { containerId: e.to.dataset.containerId, index: e.newIndex },
      })
    },
  })
}

/* 4 ─ Seed data (Alpha duplicated, shared children) ──────────── */
upsertNode({ id: "A", title: "Alpha" })
upsertNode({ id: "B", title: "Beta" })
upsertNode({ id: "A1", title: "Alpha-child-1" })
upsertNode({ id: "A2", title: "Alpha-child-2" })

state.layout.root.push("A", "B") // root: A, B
state.layout["B-children"] = ["A"] // Beta contains Alpha (duplicate)
state.layout["A-children"] = ["A1", "A2"] // shared children

/* 5 ─ Boot ───────────────────────────────────────────────────── */
mount(document.getElementById("app"))
