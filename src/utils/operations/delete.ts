import type { DeleteOperation } from './operation-types.ts'

export function applyDeleteOp(state: any, op: DeleteOperation) {
  const { id, parent_id, index, children_ids = [] } = op.delete
  // Remove node from parent's children array
  if (state.layout[parent_id]) {
    const pos = state.layout[parent_id].indexOf(id)
    if (pos !== -1) state.layout[parent_id].splice(pos, 1)
  }
  // Move children to deleted node's parent (insert at position of deleted node)
  if (children_ids.length > 0) {
    state.layout[parent_id] = [
      ...(state.layout[parent_id]?.slice(0, index) || []),
      ...children_ids,
      ...(state.layout[parent_id]?.slice(index) || [])
    ]
    // Remove children from deleted node's children list
    if (state.layout[id + '-children']) {
      state.layout[id + '-children'] = []
    }
  }
}

export function undoDeleteOp(state: any, op: DeleteOperation) {
  const { id, parent_id, index, label, children_ids } = op.delete
  // Restore node at its previous location in parent's children array
  if (!state.layout[parent_id]) state.layout[parent_id] = []
  state.layout[parent_id].splice(index, 0, id)
  // Restore children under deleted node
  if (children_ids.length > 0) {
    state.layout[id + '-children'] = [...children_ids]
    // Remove children from parent's children array (where they were moved during delete)
    state.layout[parent_id] = state.layout[parent_id].filter(
      (cid: string) => !children_ids.includes(cid) || cid === id
    )
  }
  // Node label is not changed here (node data is global, not per-parent)
}