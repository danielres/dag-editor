import type { AddOperation } from './operation-types.ts'

export function applyAddOp(state: any, op: AddOperation) {
  const { id, parent_id, label, index } = op.add
  if (!state.nodes) state.nodes = {}
  state.nodes[id] = { id, title: label }
  if (!state.layout[parent_id]) state.layout[parent_id] = []
  state.layout[parent_id].splice(index, 0, id)
}

export function undoAddOp(state: any, op: AddOperation) {
  const { id, parent_id, index } = op.add
  if (state.layout[parent_id]) {
    const pos = state.layout[parent_id].indexOf(id)
    if (pos !== -1) state.layout[parent_id].splice(pos, 1)
  }
  // Optionally, delete the node if it has no other parents
  // Skipped: we allow multi-parent nodes, so node stays in state.nodes
}