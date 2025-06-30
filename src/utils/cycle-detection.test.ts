import { test, describe } from 'node:test'
import { strict as assert } from 'node:assert'
import { causesCycle, isDescendant, type Layout } from './cycle-detection.ts'

describe('causesCycle', () => {
  test('returns false for root destination', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': []
    }
    assert.equal(causesCycle('B', 'root', layout), false)
  })

  test('returns true for trivial self-parent cycle', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': []
    }
    assert.equal(causesCycle('A', 'A-children', layout), true)
  })

  test('returns true for direct cycle', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': []
    }
    assert.equal(causesCycle('A', 'B-children', layout), true)
  })

  test('returns true for indirect cycle', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': ['C'],
      'C-children': []
    }
    assert.equal(causesCycle('A', 'C-children', layout), true)
  })

  test('returns false for valid move', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': ['C'],
      'C-children': [],
      'D-children': []
    }
    assert.equal(causesCycle('C', 'D-children', layout), false)
  })

  test('returns false for sibling move', () => {
    const layout: Layout = {
      'A-children': ['B', 'C'],
      'B-children': [],
      'C-children': []
    }
    assert.equal(causesCycle('B', 'C-children', layout), false)
  })

  test('handles complex hierarchy without cycle', () => {
    const layout: Layout = {
      'A-children': ['B', 'C'],
      'B-children': ['D'],
      'C-children': ['E'],
      'D-children': [],
      'E-children': [],
      'F-children': []
    }
    assert.equal(causesCycle('D', 'F-children', layout), false)
  })

  test('handles missing container gracefully', () => {
    const layout: Layout = {
      'A-children': ['B']
    }
    assert.equal(causesCycle('B', 'C-children', layout), false)
  })
})

describe('isDescendant', () => {
  test('returns true for direct child', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': []
    }
    assert.equal(isDescendant('B', 'A', layout, new Set()), true)
  })

  test('returns true for indirect descendant', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': ['C'],
      'C-children': []
    }
    assert.equal(isDescendant('C', 'A', layout, new Set()), true)
  })

  test('returns false for non-descendant', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'C-children': ['D']
    }
    assert.equal(isDescendant('D', 'A', layout, new Set()), false)
  })

  test('returns false for self', () => {
    const layout: Layout = {
      'A-children': ['B']
    }
    assert.equal(isDescendant('A', 'A', layout, new Set()), false)
  })

  test('handles missing children container', () => {
    const layout: Layout = {}
    assert.equal(isDescendant('B', 'A', layout, new Set()), false)
  })

  test('prevents infinite loops with seen set', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': ['A'] // circular reference
    }
    const seen = new Set(['A'])
    assert.equal(isDescendant('C', 'A', layout, seen), false)
  })

  test('handles deep hierarchy', () => {
    const layout: Layout = {
      'A-children': ['B'],
      'B-children': ['C'],
      'C-children': ['D'],
      'D-children': ['E'],
      'E-children': []
    }
    assert.equal(isDescendant('E', 'A', layout, new Set()), true)
  })

  test('handles multiple children branches', () => {
    const layout: Layout = {
      'A-children': ['B', 'C'],
      'B-children': ['D'],
      'C-children': ['E'],
      'D-children': [],
      'E-children': []
    }
    assert.equal(isDescendant('E', 'A', layout, new Set()), true)
    assert.equal(isDescendant('D', 'A', layout, new Set()), true)
    assert.equal(isDescendant('F', 'A', layout, new Set()), false)
  })
})
