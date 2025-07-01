import type { ChangeLabelOperation } from './operation-types.ts'

export function applyChangeLabelOp(state: any, op: ChangeLabelOperation) {
  const { id, new_label } = op.change_label
  if (state.nodes[id]) {
    state.nodes[id].title = new_label
  }
}

export function undoChangeLabelOp(state: any, op: ChangeLabelOperation) {
  const { id, old_label } = op.change_label
  if (state.nodes[id]) {
    state.nodes[id].title = old_label
  }
}