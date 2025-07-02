import type { Operation } from "../undo-redo-stack.ts"
import type { AddOperation, DeleteOperation, MoveOperation, ChangeLabelOperation } from "./operation-types.ts"
import { UndoRedoStack } from "../undo-redo-stack.ts"
import { applyAddOp, undoAddOp } from "./add.ts"
import { applyDeleteOp, undoDeleteOp } from "./delete.ts"
import { applyMoveOp, undoMoveOp } from "./move.ts"
import { applyChangeLabelOp, undoChangeLabelOp } from "./change-label.ts"

function applyOperation(state: any, operation: Operation) {
  if ('add' in operation) {
    applyAddOp(state, operation)
  } else if ('delete' in operation) {
    applyDeleteOp(state, operation)
  } else if ('move' in operation) {
    applyMoveOp(state, operation)
  } else if ('change_label' in operation) {
    applyChangeLabelOp(state, operation)
  }
}

function undoOperation(state: any, operation: Operation) {
  if ('add' in operation) {
    undoAddOp(state, operation)
  } else if ('delete' in operation) {
    undoDeleteOp(state, operation)
  } else if ('move' in operation) {
    undoMoveOp(state, operation)
  } else if ('change_label' in operation) {
    undoChangeLabelOp(state, operation)
  }
}

export function createDag(initialState: any) {
  const stack = new UndoRedoStack()
  let state = initialState

  return {
    dispatch: (operation: Operation) => {
      applyOperation(state, operation)
      stack.push(operation)
    },

    undo: () => {
      const operation = stack.undo()
      if (operation) {
        undoOperation(state, operation)
      }
    },

    redo: () => {
      const operation = stack.redo()
      if (operation) {
        applyOperation(state, operation)
      }
    },

    getState: () => state,
    canUndo: () => stack.canUndo,
    canRedo: () => stack.canRedo,
    clear: () => stack.clear(),
    getHistory: () => stack.getHistory(),
  }
}
