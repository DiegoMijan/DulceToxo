import typedRocks from "eslint-plugin-typed-rocks"
import unusedImports from "eslint-plugin-unused-imports"
import withNuxt from "./.nuxt/eslint.config.mjs"

export default withNuxt({
  rules: {
    // Reglas básicas de JavaScript (necesarias para que ESLint funcione)
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1 }],
    semi: "off", // BiomeJS maneja esto
    quotes: "off", // BiomeJS maneja esto
    indent: "off", // BiomeJS maneja esto
    "max-len": "off", // BiomeJS maneja esto
    "no-unused-vars": ["error", { vars: "all", args: "none", ignoreRestSiblings: true }],
    "unused-imports/no-unused-imports": "error",
    "max-depth": ["error", { max: 3 }],
    "typed-rocks/max-depth": ["warn", 3],

    // Reglas específicas para Vue templates
    "vue/html-indent": [
      "error",
      2,
      {
        attribute: 1,
        baseIndent: 1,
        closeBracket: 0,
        alignAttributesVertically: true,
        ignores: [],
      },
    ],
    "vue/html-quotes": ["error", "double"],
    "vue/html-self-closing": [
      "error",
      {
        html: {
          void: "never",
          normal: "always",
          component: "always",
        },
        svg: "always",
        math: "always",
      },
    ],
    "vue/max-attributes-per-line": [
      "error",
      {
        singleline: { max: 1 },
        multiline: { max: 1 },
      },
    ],
    "vue/multiline-html-element-content-newline": [
      "error",
      {
        ignoreWhenEmpty: true,
        ignores: ["pre", "textarea"],
        allowEmptyLines: false,
      },
    ],
    "vue/singleline-html-element-content-newline": [
      "error",
      {
        ignoreWhenNoAttributes: true,
        ignoreWhenEmpty: true,
        ignores: [
          "pre",
          "textarea",
          "a",
          "abbr",
          "audio",
          "b",
          "bdi",
          "bdo",
          "canvas",
          "cite",
          "code",
          "data",
          "del",
          "dfn",
          "em",
          "embed",
          "i",
          "iframe",
          "img",
          "input",
          "ins",
          "kbd",
          "label",
          "map",
          "mark",
          "math",
          "meter",
          "noscript",
          "object",
          "output",
          "picture",
          "progress",
          "q",
          "ruby",
          "s",
          "samp",
          "select",
          "slot",
          "small",
          "span",
          "strong",
          "sub",
          "sup",
          "svg",
          "template",
          "time",
          "u",
          "var",
          "video",
          "wbr",
        ],
      },
    ],
    "vue/html-closing-bracket-newline": [
      "error",
      {
        singleline: "never",
        multiline: "always",
      },
    ],
    "vue/html-closing-bracket-spacing": [
      "error",
      {
        startTag: "never",
        endTag: "never",
        selfClosingTag: "always",
      },
    ],
    "vue/block-tag-newline": [
      "error",
      {
        singleline: "always",
        multiline: "always",
        maxEmptyLines: 0,
      },
    ],
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "vue/html-comment-content-spacing": ["error", "always"],
    "vue/html-comment-indent": ["error", 2],
    "vue/no-spaces-around-equal-signs-in-attribute": ["error"],
    "vue/require-v-for-key": "error",
    "vue/v-for-delimiter-style": ["error", "in"],
    "vue/valid-v-for": "error",
    "vue/valid-v-if": "error",
    "vue/valid-v-else-if": "error",
    "vue/valid-v-else": "error",
    "vue/valid-v-show": "error",
    "vue/valid-v-model": "error",
    "vue/valid-v-slot": "error",
    "vue/valid-v-text": "error",
    "vue/valid-v-html": "error",
    "vue/valid-v-on": "error",
    "vue/valid-v-bind": "error",
    "vue/valid-v-cloak": "error",
    "vue/valid-v-memo": "error",
    "vue/valid-v-once": "error",
    "vue/valid-v-pre": "error",
    "vue/no-required-prop-with-default": "off",
  },
  plugins: {
    "unused-imports": unusedImports,
    "typed-rocks": typedRocks,
  },
})
