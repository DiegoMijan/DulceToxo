export interface State {
  isEdited?: boolean
  isDeleted?: boolean
  isNew?: boolean
}

export interface Recipe extends State {
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
  locales?: Record<
    "es" | "en" | "gl",
    {
      title: string
      description: string
      ingredients: Ingredient[]
      instructions: Step[]
    }
  >
}

export interface Ingredient extends State {
  id: string
  description: string
  order: number
}

export interface Step extends State, Ingredient {}
