export interface AppCategory {
  id: string
  SK?: string
  name: string
  color: string
  created_at: string
}

export interface CreateCategoryDto {
  name: string
  color?: string
}
