import type { MoveOperation } from './operation-types.ts'

export function applyMoveOp(state: any, op: MoveOperation) {
  const { id, from_parent_id, to_parent_id, from_index, to_index } = op.move
  let removed = false
  if (state.layout[from_parent_id]) {
    const pos = state.layout[from_parent_id].indexOf(id)
    if (pos !== -1) {
      state.layout[from_parent_id].splice(pos, 1)
      removed = true
    }
  }
  if (removed) {
    if (!state.layout[to_parent_id]) state.layout[to_parent_id] = []
    state.layout[to_parent_id].splice(to_index, 0, id)
  }
}

export function undoMoveOp(state: any, op: MoveOperation) {
  const { id, from_parent_id, to_parent_id, from_index, to_index } = op.move
  let removed = false
  if (state.layout[to_parent_id]) {
    const pos = state.layout[to_parent_id].indexOf(id)
    if (pos !== -1) {
      state.layout[to_parent_id].splice(pos, 1)
      removed = true
    }
  }
  if (removed) {
    if (!state.layout[from_parent_id]) state.layout[from_parent_id] = []
    state.layout[from_parent_id].splice(from_index, 0, id)
  }
}