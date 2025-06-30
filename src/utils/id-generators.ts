// ID generation and manipulation utilities

// Generates a random node ID with prefix "N"
export function generateNodeId(): string {
  return "N" + Math.random().toString(36).slice(2, 9)
}

// Extracts parent ID from children container ID
export function getParentIdFromContainerId(containerId: string): string {
  return containerId.replace(/-children$/, "")
}

// Creates children container ID for a parent node
export function getChildrenContainerId(parentId: string): string {
  return parentId + "-children"
}

