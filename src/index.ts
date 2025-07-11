import { createDagEditor } from "./dag.js"

const initialState = {
  nodes: {
    A: { id: "A", label: "Alpha" },
    B: { id: "B", label: "Beta" },
    A1: { id: "A1", label: "Alpha-child-1" },
    A2: { id: "A2", label: "Alpha-child-2" },
  },
  layout: {
    root: ["A", "B"],
    "B-children": ["A"], // Beta contains Alpha (duplicate)
    "A-children": ["A1", "A2"],
  },
}

const dagEditor = createDagEditor(initialState)

const dagEditorEl = document.getElementById("dag-editor")
const undoBtnEl = document.getElementById("dag-undo-btn") as HTMLButtonElement
const redoBtnEl = document.getElementById("dag-redo-btn") as HTMLButtonElement
const saveBtnEl = document.getElementById("dag-save-btn") as HTMLButtonElement
const errorsEl = document.getElementById("dag-errors") as HTMLButtonElement
const debugEl = document.getElementById("dag-debug") as HTMLButtonElement

dagEditor.onError((error) => {
  if (errorsEl) errorsEl.textContent = `Error: ${error.message}`
  setTimeout(() => (errorsEl.textContent = ""), 3000)
})

if (dagEditorEl) dagEditor.mount(dagEditorEl)

if (undoBtnEl && redoBtnEl) {
  undoBtnEl.onclick = () => dagEditor.undo()
  redoBtnEl.onclick = () => dagEditor.redo()

  dagEditor.subscribe(() => {
    undoBtnEl.disabled = !dagEditor.canUndo()
    redoBtnEl.disabled = !dagEditor.canRedo()

    if (debugEl) debugEl.textContent = JSON.stringify(dagEditor.getCurrentState(), null, 2)
  })

  // Set initial button states
  undoBtnEl.disabled = !dagEditor.canUndo()
  redoBtnEl.disabled = !dagEditor.canRedo()
}

if (saveBtnEl) {
  saveBtnEl.onclick = () => {
    const state = dagEditor.getCurrentState()

    // (Save to backend)
    console.log("Current state:", JSON.stringify(state, null, 2))
  }
}
