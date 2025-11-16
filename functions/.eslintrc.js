module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "no-console": "warn",
    "prefer-arrow-callback": "error",
    quotes: ["error", "double", { allowTemplateLiterals: true }],
    "max-len": ["error", { code: 120 }],
    indent: ["error", 2],
    "object-curly-spacing": ["error", "always"],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
