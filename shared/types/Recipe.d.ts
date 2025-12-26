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
  images?: Nullable<string[]>
  difficulty: 1 | 2 | 3 | 4 | 5
  prepTime: number
  cookTime: number
  createdAt: Nullable<Date>
  updatedAt: Nullable<Date>
  category: string
  locales?: Record<
    "es" | "en" | "gl",
    {
      id: string
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

export type RecipeLocaleForm = {
  id: {
    invalid: boolean
    error: {
      message: string | null
    }
    value: string
  }
  title: {
    invalid: boolean
    error: {
      message: string | null
    }
    value: string
  }
  ingredients: {
    invalid: boolean
    error: {
      message: string | null
    }
    value: Ingredient[]
  }
  instructions: {
    invalid: boolean
    error: {
      message: string | null
    }
    message: string
    value: Step[]
  }
}
