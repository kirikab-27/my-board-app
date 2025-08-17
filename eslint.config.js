const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  ...compat.extends("next/core-web-vitals", "plugin:@typescript-eslint/recommended", "prettier"),
  {
    plugins: {
      "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off"
    },
    languageOptions: {
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true
        }
      }
    }
  },
  {
    ignores: [
      ".next/**/*",
      ".next/",
      "backup/**/*",
      "backup/",
      "node_modules/**/*",
      "node_modules/",
      ".vercel/**/*",
      ".vercel/",
      "build/**/*",
      "build/",
      "dist/**/*",
      "dist/",
      "scripts/**/*",
      "scripts/",
      "jest.config.js",
      "eslint.config.js",
      "next.config.js",
      "tailwind.config.js"
    ]
  }
];