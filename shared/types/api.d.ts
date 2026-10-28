export interface paths {
  "/auth/{all}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          all: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/categories": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Obtener todas las categorías
     * @description Devuelve todas las categorías con sus traducciones en español, inglés y gallego
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Lista de categorías con traducciones */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["Category"][]
          }
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/categories/{id}/recipes": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List recipes by category
     * @description Returns a lightweight list of recipes for a category with id, difficulty, times, timestamps, rating stats, is_favorite for the authenticated user, and slug and title per locale. rating_avg and rating_count are computed with a LEFT JOIN aggregate in the same query. Requires authentication.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Category ID */
          id: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description List of recipes */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["RecipeListItem"][]
          }
        }
        /** @description Category ID is required */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Category not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/favorites": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * List the current user favorite recipes
     * @description Returns the authenticated user favorites in the same shape as GET /categories/:id/recipes, plus category id/url_name per locale and favorited_at. Sorted by most recently favorited first.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Favorite recipes of the current user */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["FavoriteListItem"][]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/recipes/{id}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get recipe detail
     * @description Returns full recipe with locales, ingredients, steps, images and rating stats. my_rating is the authenticated user vote, or null when the user has not voted. is_favorite is true when the authenticated user has favorited the recipe. Requires authentication.
     */
    get: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Recipe detail */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["RecipeDetail"]
          }
        }
        /** @description Recipe ID is required */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    /**
     * Update a recipe
     * @description Updates an existing recipe. Requires admin authentication. All fields are optional - only provided fields are updated.
     */
    put: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": components["schemas"]["UpdateRecipeRequest"]
        }
      }
      responses: {
        /** @description Recipe updated successfully */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["UpdateRecipeResponse"]
          }
        }
        /** @description Recipe ID is required, or validation error. On validation failure, body `data` is the Valibot issues array from safeParse. */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Admin access required */
        403: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe or category not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Slug already exists for locale */
        409: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    post?: never
    /**
     * Delete a recipe
     * @description Deletes a recipe and all its related data (locales, ingredients, steps, images). Also deletes associated images from Cloudinary. Requires admin authentication.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Recipe deleted successfully */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["DeleteRecipeResponse"]
          }
        }
        /** @description Recipe ID is required */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Admin access required */
        403: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/recipes/{id}/favorite": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Mark a recipe as favorite
     * @description Adds the recipe to the authenticated user favorites. Idempotent: repeating the request does not create duplicates.
     */
    put: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Recipe is marked as favorite */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["FavoriteStatus"]
          }
        }
        /** @description Recipe ID is required */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    post?: never
    /**
     * Remove a recipe from favorites
     * @description Removes the recipe from the authenticated user favorites. Idempotent: a missing favorite is a no-op. Missing recipes return 404.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Recipe is not a favorite */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["FavoriteStatus"]
          }
        }
        /** @description Recipe ID is required */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/recipes/{id}/rating": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    /**
     * Create or update the current user rating for a recipe
     * @description Upserts the authenticated user vote (1-5) for the recipe. Returns the updated average, vote count and the user rating.
     */
    put: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": components["schemas"]["UpsertRecipeRatingRequest"]
        }
      }
      responses: {
        /** @description Updated recipe rating stats */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["RecipeRatingStats"]
          }
        }
        /** @description Recipe ID is required, or validation error. On validation failure, body `data` is the Valibot issues array from safeParse. */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    post?: never
    /**
     * Remove the current user rating for a recipe
     * @description Deletes the authenticated user vote for the recipe if it exists. Missing votes are a no-op. Returns the updated average, vote count and my_rating null.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Recipe ID */
          id: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Updated recipe rating stats after removing the vote */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["RecipeRatingStats"]
          }
        }
        /** @description Recipe ID is required */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Recipe not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/recipes/batch": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Get recipe details in batch
     * @description Returns full recipe details for up to 60 ids, in the same order as the request. Missing ids are omitted. Requires authentication.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": components["schemas"]["BatchRecipesRequest"]
        }
      }
      responses: {
        /** @description Recipe details for the ids that exist, in request order */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["RecipeDetail"][]
          }
        }
        /** @description Validation error (empty list, more than 60 ids, or duplicates). Body `data` is the Valibot issues array from safeParse. */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/recipes": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Create a new recipe
     * @description Creates a new recipe with locales, ingredients, steps and images. Requires admin authentication.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": components["schemas"]["CreateRecipeRequest"]
        }
      }
      responses: {
        /** @description Recipe created successfully */
        201: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["CreateRecipeResponse"]
          }
        }
        /** @description Validation error. Body `data` is the Valibot issues array from safeParse. */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Admin access required */
        403: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Category not found */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Slug already exists for locale */
        409: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/recipes/search": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Search recipes by title and ingredients
     * @description Searches authenticated-user-visible recipes in one locale. Matching is case-insensitive and accent-insensitive. Every remaining word (length >= 2) must appear in the title or in an ingredient description. Results are ranked by title matches first, then rating and title. Requires authentication.
     */
    get: {
      parameters: {
        query: {
          /** @description Search text, 2 to 100 characters after trim */
          q: string
          /** @description Locale used for title and ingredient matching */
          locale: "gl" | "es" | "en"
          /** @description Maximum number of results. Defaults to 20. */
          limit?: number
        }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Matching recipes, ranked for the current query */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["RecipeSearchItem"][]
          }
        }
        /** @description Validation error. Body `data` is the Valibot issues array from safeParse. */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/translate": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Translate recipe editor texts
     * @description Translates an array of texts from a source locale into one or two target locales. Empty strings are returned empty and are not sent to the provider. Requires admin authentication.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "application/json": components["schemas"]["TranslateRequest"]
        }
      }
      responses: {
        /** @description Translations keyed by target locale, same order as input texts */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["TranslateResponse"]
          }
        }
        /** @description Validation error. Body `data` is the Valibot issues array from safeParse. */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Admin access required */
        403: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Monthly translation quota exceeded */
        429: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Translation provider failed */
        502: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description AZURE_TRANSLATOR_KEY or AZURE_TRANSLATOR_REGION is not configured */
        503: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/uploads": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    /**
     * Upload an image to Cloudinary
     * @description Uploads an image file to Cloudinary in the recipes folder. Requires admin authentication. Accepts jpeg, png, webp up to 10MB.
     */
    post: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody: {
        content: {
          "multipart/form-data": {
            /**
             * Format: binary
             * @description Image file (jpeg, png, webp, max 10MB)
             */
            file: string
          }
        }
      }
      responses: {
        /** @description Image uploaded successfully */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["UploadResult"]
          }
        }
        /** @description No file uploaded, missing `file` field, invalid file type (allowed: image/jpeg, image/png, image/webp), or file larger than 10MB */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Admin access required */
        403: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Failed to upload image to Cloudinary */
        500: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/uploads/{publicId}": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    /**
     * Delete an image from Cloudinary
     * @description Deletes an image from Cloudinary by its public_id. Requires admin authentication. Only images in the Cloudinary folder can be deleted.
     */
    delete: {
      parameters: {
        query?: never
        header?: never
        path: {
          /** @description Cloudinary public_id (must start with the configured Cloudinary prefix, e.g. recipes/abc123) */
          publicId: string
        }
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description Image deleted successfully */
        200: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["DeleteUploadResponse"]
          }
        }
        /** @description Public ID is required, or public_id does not start with <cloud>/ */
        400: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Authentication required */
        401: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Admin access required */
        403: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
        /** @description Image not found or already deleted */
        404: {
          headers: {
            [name: string]: unknown
          }
          content: {
            "application/json": components["schemas"]["ErrorResponse"]
          }
        }
      }
    }
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/_openapi.json": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/_scalar": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  "/_swagger": {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown
          }
          content?: never
        }
      }
    }
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    ValibotIssuePathItem: {
      /** @enum {string} */
      type: "array" | "map" | "object" | "set" | "unknown"
      /** @enum {string} */
      origin: "key" | "value"
      /** @description Raw input at this path segment */
      input: unknown
      /** @description Object key, array index, or null for set items */
      key: unknown
      /** @description Value at this path segment. Omitted on missing-key issues. */
      value?: unknown
    }
    ValibotIssue: {
      /** @enum {string} */
      kind: "schema" | "validation" | "transformation"
      type: string
      /** @description Raw input that failed validation. Omitted when JSON.stringify drops undefined (e.g. missing object keys). */
      input?: unknown
      expected: string | null
      received: string
      message: string
      /** @description Present on some validation issues */
      requirement?: unknown
      path?: components["schemas"]["ValibotIssuePathItem"][]
      issues?: components["schemas"]["ValibotIssue"][]
      lang?: string
      abort?: boolean
    }
    ErrorResponse: {
      /** @enum {boolean} */
      error: true
      /** @description Request URL (href) */
      url: string
      statusCode: number
      statusMessage: string
      message: string
      /** @description Present only when createError is called with data. For recipe POST/PUT validation failures this is the Valibot issues array from safeParse. */
      data?: components["schemas"]["ValibotIssue"][]
      /** @description Included by the Nitro dev error handler; omitted in production. */
      stack?: string[]
    }
    CategoryLocale: {
      id: string
      name: string
      url_name: string
    }
    Category: {
      /** @example cat-123 */
      id: string
      /**
       * @description SQLite datetime text, e.g. '2025-01-05 12:00:00'
       * @example 2025-01-05 12:00:00
       */
      created_at: string
      /** @description Translations keyed by locale. A key is omitted when that translation is missing in the database. */
      locale: {
        es?: components["schemas"]["CategoryLocale"]
        en?: components["schemas"]["CategoryLocale"]
        gl?: components["schemas"]["CategoryLocale"]
      }
    }
    RecipeListLocale: {
      slug: string
      title: string
    }
    RecipeListItem: {
      id: string
      difficulty: number
      /** @description Preparation time in minutes */
      prep_time: number
      /** @description Cooking time in minutes */
      cook_time: number
      /** @description Unix timestamp in ms */
      created_at: number
      /** @description Unix timestamp in ms */
      updated_at: number
      /** @description Average rounded to one decimal. Null when there are no votes. */
      rating_avg: number | null
      rating_count: number
      /** @description True when the authenticated user has favorited this recipe. */
      is_favorite: boolean
      /** @description Title and slug keyed by locale. A key is omitted when that translation is missing in the database. */
      locale: {
        es?: components["schemas"]["RecipeListLocale"]
        en?: components["schemas"]["RecipeListLocale"]
        gl?: components["schemas"]["RecipeListLocale"]
      }
    }
    FavoriteListItem: {
      id: string
      difficulty: number
      /** @description Preparation time in minutes */
      prep_time: number
      /** @description Cooking time in minutes */
      cook_time: number
      /** @description Unix timestamp in ms */
      created_at: number
      /** @description Unix timestamp in ms */
      updated_at: number
      /** @description Average rounded to one decimal. Null when there are no votes. */
      rating_avg: number | null
      rating_count: number
      is_favorite: boolean
      /** @description Title and slug keyed by locale. A key is omitted when that translation is missing in the database. */
      locale: {
        es?: components["schemas"]["RecipeListLocale"]
        en?: components["schemas"]["RecipeListLocale"]
        gl?: components["schemas"]["RecipeListLocale"]
      }
      /** @description Unix timestamp in ms when the user marked the recipe as favorite */
      favorited_at: number
      category: {
        id: string
        /** @description Category url_name keyed by locale. A key is omitted when that translation is missing. */
        url_name: {
          es?: string
          en?: string
          gl?: string
        }
      }
    }
    DeleteRecipeResponse: {
      /** @enum {boolean} */
      deleted: true
      id: string
      cloudinary: components["schemas"]["CloudinaryResult"]
    }
    RecipeLocaleContent: {
      id: string
      slug: string
      title: string
      description: string
    }
    RecipeIngredientContent: {
      id: string
      order: number
      description: string
      is_heading: boolean
    }
    RecipeStepContent: {
      id: string
      order: number
      description: string
    }
    RecipeImageContent: {
      id: string
      public_id: string
      order: number
    }
    RecipeDetail: {
      id: string
      category_id: string
      difficulty: number
      /** @description Preparation time in minutes */
      prep_time: number
      /** @description Cooking time in minutes */
      cook_time: number
      author_id: string | null
      /** @description Unix timestamp in ms */
      created_at: number
      /** @description Unix timestamp in ms */
      updated_at: number
      /** @description Average rounded to one decimal. Null when there are no votes. */
      rating_avg: number | null
      rating_count: number
      /** @description Current user vote, or null when the user has not voted. */
      my_rating: number | null
      /** @description True when the authenticated user has favorited this recipe. */
      is_favorite: boolean
      /** @description Locale content keyed by language. A key is omitted when that translation is missing in the database. */
      locales: {
        es?: components["schemas"]["RecipeLocaleContent"]
        en?: components["schemas"]["RecipeLocaleContent"]
        gl?: components["schemas"]["RecipeLocaleContent"]
      }
      /** @description Ingredients grouped by locale. Keys are always present; missing locales are empty arrays. */
      ingredients: {
        es: components["schemas"]["RecipeIngredientContent"][]
        en: components["schemas"]["RecipeIngredientContent"][]
        gl: components["schemas"]["RecipeIngredientContent"][]
      }
      /** @description Steps grouped by locale. Keys are always present; missing locales are empty arrays. */
      steps: {
        es: components["schemas"]["RecipeStepContent"][]
        en: components["schemas"]["RecipeStepContent"][]
        gl: components["schemas"]["RecipeStepContent"][]
      }
      images: components["schemas"]["RecipeImageContent"][]
    }
    /** @description All fields are optional. Provided locales, ingredients, steps and images replace the existing rows for that collection. */
    UpdateRecipeRequest: {
      category_id?: string
      difficulty?: number
      prep_time?: number
      cook_time?: number
      /** @description Replaces all existing locales. Each locale can only appear once. Empty array deletes every locale. */
      locales?: components["schemas"]["RecipeLocaleInput"][]
      /** @description Replaces all existing ingredients. Empty array deletes every ingredient. */
      ingredients?: components["schemas"]["RecipeIngredientInput"][]
      /** @description Replaces all existing steps. Empty array deletes every step. */
      steps?: components["schemas"]["RecipeStepInput"][]
      /** @description Replaces all existing images. Public IDs removed from the recipe are deleted from Cloudinary. */
      images?: components["schemas"]["RecipeImageInput"][]
    }
    CloudinaryResult: {
      deleted: string[]
      failed: string[]
    }
    UpdateRecipeResponse: {
      id: string
      /** @enum {boolean} */
      updated: true
      cloudinary: components["schemas"]["CloudinaryResult"]
    }
    FavoriteStatus: {
      is_favorite: boolean
    }
    UpsertRecipeRatingRequest: {
      value: number
    }
    RecipeRatingStats: {
      /** @description Average rounded to one decimal. Null when there are no votes. */
      rating_avg: number | null
      rating_count: number
      /** @description Current user vote, or null when the user has not voted. */
      my_rating: number | null
    }
    BatchRecipesRequest: {
      ids: string[]
    }
    RecipeLocaleInput: {
      /** @enum {string} */
      locale: "es" | "en" | "gl"
      slug: string
      title: string
      description: string
    }
    RecipeIngredientInput: {
      /** @enum {string} */
      locale: "es" | "en" | "gl"
      order: number
      description: string
      /**
       * @description When true, this row is a section heading rather than an ingredient line
       * @default false
       */
      is_heading: boolean
    }
    RecipeStepInput: {
      /** @enum {string} */
      locale: "es" | "en" | "gl"
      order: number
      description: string
    }
    RecipeImageInput: {
      public_id: string
      order: number
    }
    CreateRecipeRequest: {
      category_id: string
      difficulty: number
      /** @description Minutes */
      prep_time: number
      /** @description Minutes */
      cook_time: number
      /** @description Each locale can only appear once in locales */
      locales: components["schemas"]["RecipeLocaleInput"][]
      /** @description Optional. Defaults to an empty array when omitted. */
      ingredients?: components["schemas"]["RecipeIngredientInput"][]
      /** @description Optional. Defaults to an empty array when omitted. */
      steps?: components["schemas"]["RecipeStepInput"][]
      /** @description Optional. Defaults to an empty array when omitted. */
      images?: components["schemas"]["RecipeImageInput"][]
    }
    CreateRecipeResponse: {
      id: string
    }
    RecipeSearchItem: {
      id: string
      difficulty: number
      /** @description Preparation time in minutes */
      prep_time: number
      /** @description Cooking time in minutes */
      cook_time: number
      /** @description Unix timestamp in ms */
      created_at: number
      /** @description Unix timestamp in ms */
      updated_at: number
      /** @description Average rounded to one decimal. Null when there are no votes. */
      rating_avg: number | null
      rating_count: number
      /** @description True when the authenticated user has favorited this recipe. */
      is_favorite: boolean
      /** @description Title and slug keyed by locale. A key is omitted when that translation is missing in the database. */
      locale: {
        es?: components["schemas"]["RecipeListLocale"]
        en?: components["schemas"]["RecipeListLocale"]
        gl?: components["schemas"]["RecipeListLocale"]
      }
      category: {
        id: string
        /** @description Category url_name keyed by locale. A key is omitted when that translation is missing. */
        url_name: {
          es?: string
          en?: string
          gl?: string
        }
      }
      /**
       * @description title if any search word matches the title; otherwise ingredients
       * @enum {string}
       */
      matched_in: "title" | "ingredients"
      /** @description First matching ingredient description when matched_in is ingredients; otherwise null. */
      matched_ingredient: string | null
    }
    TranslateRequest: {
      /** @enum {string} */
      source: "es" | "en" | "gl"
      /** @description Must not include source */
      targets: ("es" | "en" | "gl")[]
      /** @description Each item at most 5000 characters; total at most 30000 characters */
      texts: string[]
    }
    TranslateResponse: {
      /** @description One key per requested target. Each array matches the input texts order and length. */
      translations: {
        es?: string[]
        en?: string[]
        gl?: string[]
      }
    }
    UploadResult: {
      /** @description Cloudinary public ID */
      public_id: string
      width: number
      height: number
    }
    DeleteUploadResponse: {
      /** @enum {boolean} */
      deleted: true
      public_id: string
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export type operations = Record<string, never>
