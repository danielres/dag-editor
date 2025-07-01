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

const appElement = document.getElementById("app")
if (appElement) {
  dagEditor.mount(appElement)
}

