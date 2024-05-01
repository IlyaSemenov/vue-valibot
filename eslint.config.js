import config from "@antfu/eslint-config"

export default config(
  {
    stylistic: {
      quotes: "double",
    },
    rules: {
      // Always use { } after if/for.
      "curly": ["error", "all"],
      "import/order": ["error", {
        // At least one new line between each group will be enforced, and new lines inside a group will be forbidden.
        "newlines-between": "always",
        "alphabetize": {
          order: "asc",
          orderImportKind: "asc",
        },
      }],
      "test/consistent-test-it": "off",
      "no-console": "warn",
      // One true brace style.
      "style/brace-style": ["error", "1tbs"],
    },
  },
)
