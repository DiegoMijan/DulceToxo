import withNuxt from ".nuxt/eslint.config.mjs"
import typedRocks from "eslint-plugin-typed-rocks"
import unusedImports from "eslint-plugin-unused-imports"

export default withNuxt({
  rules: {
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
    semi: "off",
    quotes: "double",
    indent: "off",
    "max-len": "off",
    "no-unused-vars": ["error", { vars: "all", args: "none", ignoreRestSiblings: true }],
    "unused-imports/no-unused-imports": "error",
    "vue/no-multiple-template-root": "off",
    "max-depth": ["error", { max: 3 }],
    "typed-rocks/max-depth": ["warn", 3],
  },
  plugins: {
    "unused-imports": unusedImports,
    "typed-rocks": typedRocks,
  },
})
