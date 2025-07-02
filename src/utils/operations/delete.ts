import type { DeleteOperation } from "./operation-types.ts"
import type { State } from "../../dag.ts"

function nodeExistsInLayout(nodeId: string, layout: Record<string, string[]>): boolean {
  for (const containerId in layout) {
    if (layout[containerId] && layout[containerId].includes(nodeId)) {
      return true
    }
  }
  return false
}

export function applyDeleteOp(state: State, op: DeleteOperation) {
  const { id, parent_id, index, children_ids = [] } = op.delete

  // Remove node from parent's children array
  if (state.layout[parent_id]) {
    const pos = state.layout[parent_id].indexOf(id)
    if (pos !== -1) state.layout[parent_id].splice(pos, 1)
  }

  // Check if node exists elsewhere in the layout
  const hasOtherInstances = nodeExistsInLayout(id, state.layout)

  // Case 1: Node has other instances - just remove the edge, leave children alone
  if (hasOtherInstances) {
    // Do nothing else - children stay with the node
  }
  // Case 2: No other instances - move children up and clean up node
  else {
    // Move children to deleted node's parent (insert at position of deleted node)
    if (children_ids.length > 0) {
      state.layout[parent_id] = [
        ...(state.layout[parent_id]?.slice(0, index) || []),
        ...children_ids,
        ...(state.layout[parent_id]?.slice(index) || []),
      ]
      // Remove children from deleted node's children list
      if (state.layout[id + "-children"]) {
        state.layout[id + "-children"] = []
      }
    }

    // Remove node from state.nodes as it no longer exists anywhere
    if (state.nodes && state.nodes[id]) {
      delete state.nodes[id]
    }
  }
}

export function undoDeleteOp(state: State, op: DeleteOperation) {
  const { id, parent_id, index, label, children_ids } = op.delete

  // Check if node exists in state.nodes (Case 1) or not (Case 2)
  const nodeExists = state.nodes && state.nodes[id]

  // Always restore node to state.nodes if it doesn't exist (Case 2)
  if (!state.nodes) state.nodes = {}
  if (!nodeExists) {
    state.nodes[id] = { id, label }
  }

  // Case 2: If children were moved up (node didn't exist elsewhere), restore them
  if (!nodeExists && children_ids.length > 0) {
    // Restore children under deleted node
    state.layout[id + "-children"] = [...children_ids]

    // Remove children from parent's children array (where they were moved during delete)
    // Remove the specific instances that were added at the delete position
    const currentArray = state.layout[parent_id]
    const newArray = [...currentArray.slice(0, index), ...currentArray.slice(index + children_ids.length)]
    state.layout[parent_id] = newArray
  }

  // Always restore node at its previous location in parent's children array
  if (!state.layout[parent_id]) state.layout[parent_id] = []
  state.layout[parent_id].splice(index, 0, id)
}

