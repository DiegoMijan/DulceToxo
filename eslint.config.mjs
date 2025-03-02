import unusedImports from 'eslint-plugin-unused-imports'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      'semi': ['error', 'never'],
      'no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: true }],
      'unused-imports/no-unused-imports': 'error',
      'vue/no-multiple-template-root': 'off',
      'max-len': ['error', { code: 100 }],
    },
    plugins: {
      'unused-imports': unusedImports,
    },
  },
)
