import type {
  AddOperation,
  DeleteOperation,
  MoveOperation,
  ChangeLabelOperation,
} from "./operations/operation-types.ts"

export type Operation = AddOperation | DeleteOperation | MoveOperation | ChangeLabelOperation

export class UndoRedoStack {
  undoStack: Operation[] = []
  redoStack: Operation[] = []

  constructor() {
    this.undoStack = []
    this.redoStack = []
  }

  push(op: Operation) {
    this.undoStack.push(op)
    this.redoStack = []
  }

  undo(): Operation | undefined {
    if (this.undoStack.length === 0) return undefined
    const op = this.undoStack.pop()!
    this.redoStack.push(op)
    return op
  }

  redo(): Operation | undefined {
    if (this.redoStack.length === 0) return undefined
    const op = this.redoStack.pop()!
    this.undoStack.push(op)
    return op
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  getHistory(): Operation[] {
    return [...this.undoStack] // Return copy of undo stack
  }
}
