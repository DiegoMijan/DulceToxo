const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/

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
    name: v.pipe(v.string(), v.minLength(1, t("auth.register.error.nameRequired"))),
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
