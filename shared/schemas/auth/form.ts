const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

// El DatePicker de PrimeVue da un Date cuando se elige del calendario, pero deja lo
// que hayas tecleado (string, o null si está vacío) cuando no se pudo parsear. Sin
// esto valibot solo veía v.string() y rompía con "Expected string but received Date",
// o dejaba pasar cualquier texto (p.ej. "x3434") porque técnicamente sí es un string.
const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date) return value
  if (typeof value === "string" && value.trim() !== "") return new Date(value)
  return null
}

export const createLoginPasswordSchema = (t: (key: string) => string) =>
  v.object({
    email: v.pipe(
      v.string(),
      v.minLength(1, t("auth.register.error.emailRequired")),
      v.email(t("auth.register.error.invalidEmail")),
    ),
    password: v.pipe(
      v.string(),
      v.minLength(1, t("auth.register.error.passwordRequired")),
      v.regex(passwordRegex, t("auth.register.error.passwordRequirements")),
    ),
  })

export const createRegisterPasswordSchema = (
  t: (key: string) => string,
  validatePassword: (check: string) => boolean,
) =>
  v.object({
    firstName: v.pipe(v.string(), v.minLength(1, t("auth.register.error.firstNameRequired"))),
    lastName: v.pipe(v.string(), v.minLength(1, t("auth.register.error.lastNameRequired"))),
    dateOfBirth: v.pipe(
      v.unknown(),
      v.transform(toDateOrNull),
      v.check((date) => date !== null, t("auth.register.error.dateOfBirthRequired")),
      v.check(
        (date) => date === null || !isNaN(date.getTime()),
        t("auth.register.error.dateOfBirthInvalid"),
      ),
    ),
    email: v.pipe(
      v.string(),
      v.minLength(1, t("auth.register.error.emailRequired")),
      v.email(t("auth.register.error.invalidEmail")),
    ),
    password: v.pipe(
      v.string(),
      v.minLength(1, t("auth.register.error.passwordRequired")),
      v.regex(passwordRegex, t("auth.register.error.passwordRequirements")),
    ),
    confirmPassword: v.pipe(
      v.string(),
      v.minLength(1, t("auth.register.error.confirmPasswordRequired")),
      v.regex(passwordRegex, t("auth.register.error.passwordRequirements")),
      v.check((check) => validatePassword(check), t("auth.register.error.passwordsDontMatch")),
    ),
  })
