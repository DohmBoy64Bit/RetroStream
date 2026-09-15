export default [
  {
    ignores: ["dist/**"],
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "no-undef": "off",
    },
  },
];
