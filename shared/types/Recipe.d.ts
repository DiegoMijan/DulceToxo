export interface Recipe {
  id: Nullable<string>
  title: string
  description: string
  ingredients: Ingredient[]
  instructions: Step[]
  difficulty: 1 | 2 | 3 | 4 | 5
  prepTime: number
  cookTime: number
  createdAt: Nullable<Date>
  updatedAt: Nullable<Date>
  category: string
}

export interface Ingredient {
  id: string
  description: string
  order: number
}

export interface Step {
  id: string
  description: string
  order: number
}
