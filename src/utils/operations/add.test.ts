import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyAddOp, undoAddOp } from './add.ts'
import type { AddOperation } from './operation-types.ts'

function makeState() {
  return {
    nodes: {},
    layout: { root: [] }
  }
}

describe('applyAddOp and undoAddOp', () => {
  it('applies and undoes an add operation to root', () => {
    const state = makeState()
    const op: AddOperation = { add: { id: 'n1', parent_id: 'root', label: 'Node 1', index: 0 } }
    applyAddOp(state, op)
    assert.deepEqual(state.nodes, { n1: { id: 'n1', title: 'Node 1' } })
    assert.deepEqual(state.layout.root, ['n1'])
    undoAddOp(state, op)
    assert.deepEqual(state.layout.root, [])
    // node remains in state.nodes, as per multi-parent model
    assert.deepEqual(state.nodes, { n1: { id: 'n1', title: 'Node 1' } })
  })

  it('adds node at correct index among siblings', () => {
    const state = makeState()
    state.nodes['a'] = { id: 'a', title: 'A' }
    state.nodes['b'] = { id: 'b', title: 'B' }
    state.layout.root = ['a', 'b']
    const op: AddOperation = { add: { id: 'c', parent_id: 'root', label: 'C', index: 1 } }
    applyAddOp(state, op)
    assert.deepEqual(state.layout.root, ['a', 'c', 'b'])
    undoAddOp(state, op)
    assert.deepEqual(state.layout.root, ['a', 'b'])
  })

  it('creates parent layout array if missing', () => {
    const state = makeState()
    const op: AddOperation = { add: { id: 'x', parent_id: 'p1', label: 'X', index: 0 } }
    applyAddOp(state, op)
    assert.deepEqual(state.layout.p1, ['x'])
    undoAddOp(state, op)
    assert.deepEqual(state.layout.p1, [])
  })
})