module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:flowtype/recommended",
    "plugin:react/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  plugins: ["react", "flowtype", "sort-imports-es6-autofix"],
  rules: {
    "no-undef": "off",
    "no-console": "off",
    "sort-imports-es6-autofix/sort-imports-es6": "error",
    "no-unused-vars": "warn"
  },
  settings: { react: { version: "detect" } }
};
