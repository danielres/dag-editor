export type AddOperation = {
  add: {
    id: string
    parent_id: string
    label: string
    index: number
  }
}

export type DeleteOperation = {
  delete: {
    id: string
    parent_id: string
    label: string
    index: number
    children_ids: string[]
  }
}

export type MoveOperation = {
  move: {
    id: string
    from_parent_id: string
    to_parent_id: string
    from_index: number
    to_index: number
  }
}

export type ChangeLabelOperation = {
  change_label: {
    id: string
    old_label: string
    new_label: string
  }
}