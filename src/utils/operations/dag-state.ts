import type { Operation } from "../undo-redo-stack.ts"
import { UndoRedoStack } from "../undo-redo-stack.ts"
import { applyAddOp, undoAddOp } from "./add.ts"
import { applyDeleteOp, undoDeleteOp } from "./delete.ts"
import { applyMoveOp, undoMoveOp } from "./move.ts"
import { applyChangeLabelOp, undoChangeLabelOp } from "./change-label.ts"

const OPERATION_HANDLERS = {
  add: { apply: applyAddOp, undo: undoAddOp },
  delete: { apply: applyDeleteOp, undo: undoDeleteOp },
  move: { apply: applyMoveOp, undo: undoMoveOp },
  change_label: { apply: applyChangeLabelOp, undo: undoChangeLabelOp },
}

export function createDag(initialState: any) {
  const stack = new UndoRedoStack()
  let state = initialState

  return {
    dispatch: (operation: Operation) => {
      const operationType = Object.keys(operation)[0] as keyof typeof OPERATION_HANDLERS
      const handler = OPERATION_HANDLERS[operationType]

      if (handler) {
        handler.apply(state, operation)
        stack.push(operation)
      }
    },

    undo: () => {
      const operation = stack.undo()
      if (operation) {
        const operationType = Object.keys(operation)[0] as keyof typeof OPERATION_HANDLERS
        const handler = OPERATION_HANDLERS[operationType]

        if (handler) {
          handler.undo(state, operation)
        }
      }
    },

    redo: () => {
      const operation = stack.redo()
      if (operation) {
        const operationType = Object.keys(operation)[0] as keyof typeof OPERATION_HANDLERS
        const handler = OPERATION_HANDLERS[operationType]

        if (handler) {
          handler.apply(state, operation)
        }
      }
    },

    getState: () => state,
    canUndo: () => stack.canUndo,
    canRedo: () => stack.canRedo,
    clear: () => stack.clear(),
  }
}

