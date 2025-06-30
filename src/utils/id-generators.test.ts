import { test, describe } from "node:test"
import { strict as assert } from "node:assert"
import { generateNodeId, getParentIdFromContainerId, getChildrenContainerId } from "./id-generators.ts"

describe("generateNodeId", () => {
  test("generates ID with N prefix", () => {
    const id = generateNodeId()
    assert.equal(id.startsWith("N"), true)
  })

  test("generates different IDs on multiple calls", () => {
    const id1 = generateNodeId()
    const id2 = generateNodeId()
    assert.notEqual(id1, id2)
  })

  test("generates ID with expected length", () => {
    const id = generateNodeId()
    assert.equal(id.length, 8) // 'N' + 7 random chars
  })

  test("generates alphanumeric characters after prefix", () => {
    const id = generateNodeId()
    const suffix = id.slice(1)
    assert.match(suffix, /^[a-z0-9]+$/)
  })

  test("generates multiple unique IDs", () => {
    const ids = new Set()
    for (let i = 0; i < 100; i++) {
      ids.add(generateNodeId())
    }
    assert.equal(ids.size, 100) // all should be unique
  })
})

describe("getParentIdFromContainerId", () => {
  test("extracts parent ID from children container", () => {
    const parentId = getParentIdFromContainerId("A-children")
    assert.equal(parentId, "A")
  })

  test("handles complex parent IDs", () => {
    const parentId = getParentIdFromContainerId("parent-node-123-children")
    assert.equal(parentId, "parent-node-123")
  })

  test("handles numeric parent IDs", () => {
    const parentId = getParentIdFromContainerId("123-children")
    assert.equal(parentId, "123")
  })

  test("handles parent ID with hyphens", () => {
    const parentId = getParentIdFromContainerId("my-parent-id-children")
    assert.equal(parentId, "my-parent-id")
  })

  test("handles single character parent ID", () => {
    const parentId = getParentIdFromContainerId("A-children")
    assert.equal(parentId, "A")
  })

  test("returns original string if no -children suffix", () => {
    const parentId = getParentIdFromContainerId("A-something-else")
    assert.equal(parentId, "A-something-else")
  })

  test("handles empty string", () => {
    const parentId = getParentIdFromContainerId("")
    assert.equal(parentId, "")
  })

  test("handles string that is just -children", () => {
    const parentId = getParentIdFromContainerId("-children")
    assert.equal(parentId, "")
  })
})

describe("getChildrenContainerId", () => {
  test("creates children container ID from parent ID", () => {
    const containerId = getChildrenContainerId("A")
    assert.equal(containerId, "A-children")
  })

  test("handles complex parent IDs", () => {
    const containerId = getChildrenContainerId("parent-node-123")
    assert.equal(containerId, "parent-node-123-children")
  })

  test("handles numeric parent IDs", () => {
    const containerId = getChildrenContainerId("123")
    assert.equal(containerId, "123-children")
  })

  test("handles parent ID with hyphens", () => {
    const containerId = getChildrenContainerId("my-parent-id")
    assert.equal(containerId, "my-parent-id-children")
  })

  test("handles empty parent ID", () => {
    const containerId = getChildrenContainerId("")
    assert.equal(containerId, "-children")
  })

  test("handles parent ID that already ends with -children", () => {
    const containerId = getChildrenContainerId("A-children")
    assert.equal(containerId, "A-children-children")
  })

  test("roundtrip conversion works correctly", () => {
    const originalId = "my-node-123"
    const containerId = getChildrenContainerId(originalId)
    const extractedId = getParentIdFromContainerId(containerId)
    assert.equal(extractedId, originalId)
  })
})

