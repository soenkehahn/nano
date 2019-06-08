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
  plugins: ["react", "flowtype"],
  rules: {
    "no-undef": "off"
  },
  settings: { react: { version: "detect" } }
};
