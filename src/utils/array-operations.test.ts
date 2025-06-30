import { test, describe } from "node:test"
import { strict as assert } from "node:assert"
import { moveItemWithinArray, moveItemBetweenArrays } from "./array-operations.ts"

describe("moveItemWithinArray", () => {
  test("moves item forward in array", () => {
    const arr = ["a", "b", "c", "d"]
    const result = moveItemWithinArray(arr, 1, 3)
    assert.deepEqual(result, ["a", "c", "d", "b"])
    assert.deepEqual(arr, ["a", "b", "c", "d"]) // original unchanged
  })

  test("moves item backward in array", () => {
    const arr = ["a", "b", "c", "d"]
    const result = moveItemWithinArray(arr, 3, 1)
    assert.deepEqual(result, ["a", "d", "b", "c"])
  })

  test("moves item to same position", () => {
    const arr = ["a", "b", "c"]
    const result = moveItemWithinArray(arr, 1, 1)
    assert.deepEqual(result, ["a", "b", "c"])
  })

  test("moves first item to end", () => {
    const arr = ["a", "b", "c"]
    const result = moveItemWithinArray(arr, 0, 2)
    assert.deepEqual(result, ["b", "c", "a"])
  })

  test("moves last item to beginning", () => {
    const arr = ["a", "b", "c"]
    const result = moveItemWithinArray(arr, 2, 0)
    assert.deepEqual(result, ["c", "a", "b"])
  })

  test("handles single item array", () => {
    const arr = ["a"]
    const result = moveItemWithinArray(arr, 0, 0)
    assert.deepEqual(result, ["a"])
  })

  test("handles empty array", () => {
    const arr: string[] = []
    const result = moveItemWithinArray(arr, 0, 0)
    assert.deepEqual(result, [])
  })
})

describe("moveItemBetweenArrays", () => {
  test("moves item from source to destination", () => {
    const source = ["a", "b", "c"]
    const dest = ["x", "y", "z"]
    const result = moveItemBetweenArrays(source, 1, dest, 2)

    assert.deepEqual(result.sourceArray, ["a", "c"])
    assert.deepEqual(result.destArray, ["x", "y", "b", "z"])
    assert.deepEqual(source, ["a", "b", "c"]) // original unchanged
    assert.deepEqual(dest, ["x", "y", "z"]) // original unchanged
  })

  test("moves item to beginning of destination", () => {
    const source = ["a", "b"]
    const dest = ["x", "y"]
    const result = moveItemBetweenArrays(source, 0, dest, 0)

    assert.deepEqual(result.sourceArray, ["b"])
    assert.deepEqual(result.destArray, ["a", "x", "y"])
  })

  test("moves item to end of destination", () => {
    const source = ["a", "b"]
    const dest = ["x", "y"]
    const result = moveItemBetweenArrays(source, 1, dest, 2)

    assert.deepEqual(result.sourceArray, ["a"])
    assert.deepEqual(result.destArray, ["x", "y", "b"])
  })

  test("moves from single item source", () => {
    const source = ["a"]
    const dest = ["x"]
    const result = moveItemBetweenArrays(source, 0, dest, 1)

    assert.deepEqual(result.sourceArray, [])
    assert.deepEqual(result.destArray, ["x", "a"])
  })

  test("moves to empty destination", () => {
    const source = ["a", "b"]
    const dest: string[] = []
    const result = moveItemBetweenArrays(source, 0, dest, 0)

    assert.deepEqual(result.sourceArray, ["b"])
    assert.deepEqual(result.destArray, ["a"])
  })

  test("handles different data types", () => {
    const source = [1, 2, 3]
    const dest = [10, 20]
    const result = moveItemBetweenArrays(source, 1, dest, 1)

    assert.deepEqual(result.sourceArray, [1, 3])
    assert.deepEqual(result.destArray, [10, 2, 20])
  })
})

