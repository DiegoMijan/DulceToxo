export interface Recipe {
  id: string
  title: string
  description: string
  ingredients: Ingredient[]
  instructions: Step[]
  difficulty: 1 | 2 | 3 | 4 | 5
  prepTime: number
  cookTime: number
  createdAt: Date
  updatedAt: Date
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
