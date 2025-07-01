import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { applyChangeLabelOp, undoChangeLabelOp } from './change-label.ts'
import type { ChangeLabelOperation } from './operation-types.ts'

function makeState() {
  return {
    nodes: {
      n1: { id: 'n1', title: 'Original' }
    },
    layout: {
      root: ['n1']
    }
  }
}

describe('applyChangeLabelOp and undoChangeLabelOp', () => {
  it('changes label and undoes change', () => {
    const state = makeState()
    const op: ChangeLabelOperation = {
      change_label: {
        id: 'n1',
        old_label: 'Original',
        new_label: 'Updated'
      }
    }
    applyChangeLabelOp(state, op)
    assert.equal(state.nodes.n1.title, 'Updated')
    undoChangeLabelOp(state, op)
    assert.equal(state.nodes.n1.title, 'Original')
  })

  it('does nothing if node does not exist', () => {
    const state = makeState()
    const op: ChangeLabelOperation = {
      change_label: {
        id: 'missing',
        old_label: 'x',
        new_label: 'y'
      }
    }
    applyChangeLabelOp(state, op)
    assert.deepEqual(state.nodes, { n1: { id: 'n1', title: 'Original' } })
    undoChangeLabelOp(state, op)
    assert.deepEqual(state.nodes, { n1: { id: 'n1', title: 'Original' } })
  })
})