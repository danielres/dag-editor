// Cycle detection for DAG structures
export type Layout = Record<string, string[]>

// Checks if moving a node would create a cycle
export function causesCycle(movedId: string, destContainerId: string, layout: Layout): boolean {
  if (destContainerId === "root") return false

  const destParentId = destContainerId.replace(/-children$/, "")

  if (destParentId === movedId) return true // trivial self-parent

  return isDescendant(destParentId, movedId, layout, new Set())
}

// Recursively checks if targetId is a descendant of currentId
export function isDescendant(targetId: string, currentId: string, layout: Layout, seen: Set<string>): boolean {
  if (seen.has(currentId)) return false // defensive
  seen.add(currentId)

  const children = layout[currentId + "-children"] || []
  for (let childId of children) {
    if (childId === targetId) return true
    if (isDescendant(targetId, childId, layout, seen)) return true
  }
  return false
}

