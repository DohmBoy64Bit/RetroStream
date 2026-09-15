export default [
  {
    ignores: ["dist/**", ".next/**", "public/retrostream.css"],
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "no-undef": "off"
    }
  }
];
