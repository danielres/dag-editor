import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { UndoRedoStack } from './undo-redo-stack.ts'
import type { AddOperation, DeleteOperation, MoveOperation, ChangeLabelOperation } from './operation-types.ts'

describe('UndoRedoStack', () => {
  const addOp: AddOperation = { add: { id: '1', parent_id: 'p', label: 'alpha', index: 0 } }
  const deleteOp: DeleteOperation = { delete: { id: '2', parent_id: 'p', label: 'beta', index: 1, children_ids: [] } }
  const moveOp: MoveOperation = { move: { id: '3', from_parent_id: 'a', to_parent_id: 'b', from_index: 1, to_index: 2 } }
  const labelOp: ChangeLabelOperation = { change_label: { id: '4', old_label: 'foo', new_label: 'bar' } }

  it('initializes with empty stacks', () => {
    const stack = new UndoRedoStack()
    assert.equal(stack.canUndo, false)
    assert.equal(stack.canRedo, false)
  })

  it('pushes operations to undoStack and clears redoStack', () => {
    const stack = new UndoRedoStack()
    stack.push(addOp)
    assert.equal(stack.canUndo, true)
    assert.equal(stack.canRedo, false)
    stack.push(deleteOp)
    assert.equal(stack.undoStack.length, 2)
    assert.equal(stack.redoStack.length, 0)
  })

  it('undo/redo cycle works as expected', () => {
    const stack = new UndoRedoStack()
    stack.push(addOp)
    stack.push(deleteOp)
    let op = stack.undo()
    assert.deepEqual(op, deleteOp)
    assert.equal(stack.canUndo, true)
    assert.equal(stack.canRedo, true)
    op = stack.undo()
    assert.deepEqual(op, addOp)
    assert.equal(stack.canUndo, false)
    assert.equal(stack.canRedo, true)
    op = stack.redo()
    assert.deepEqual(op, addOp)
    assert.equal(stack.canUndo, true)
    assert.equal(stack.canRedo, true)
  })

  it('clears redoStack on new push after undo', () => {
    const stack = new UndoRedoStack()
    stack.push(addOp)
    stack.push(deleteOp)
    stack.undo()
    stack.push(moveOp)
    assert.equal(stack.canUndo, true)
    assert.equal(stack.canRedo, false)
  })

  it('supports multiple undo/redo cycles', () => {
    const stack = new UndoRedoStack()
    stack.push(addOp)
    stack.push(deleteOp)
    stack.push(moveOp)
    stack.undo()
    stack.redo()
    stack.push(labelOp)
    assert.equal(stack.canUndo, true)
    assert.equal(stack.canRedo, false)
  })

  it('can be cleared', () => {
    const stack = new UndoRedoStack()
    stack.push(addOp)
    stack.push(deleteOp)
    stack.clear()
    assert.equal(stack.canUndo, false)
    assert.equal(stack.canRedo, false)
  })
})