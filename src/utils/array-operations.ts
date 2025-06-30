// Immutable array operations

// Moves an item within the same array
export function moveItemWithinArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = array.slice() // copy
  const [item] = newArray.splice(fromIndex, 1) // remove
  newArray.splice(toIndex, 0, item) // insert
  return newArray
}

// Moves an item between different arrays
export function moveItemBetweenArrays<T>(
  sourceArray: T[],
  sourceIndex: number,
  destArray: T[],
  destIndex: number
): { sourceArray: T[]; destArray: T[] } {
  const newSourceArray = sourceArray.slice() // copy
  const [item] = newSourceArray.splice(sourceIndex, 1) // remove

  const newDestArray = destArray.slice() // copy
  newDestArray.splice(destIndex, 0, item) // insert

  return {
    sourceArray: newSourceArray,
    destArray: newDestArray,
  }
}

