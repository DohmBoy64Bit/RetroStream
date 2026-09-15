module.exports = {
  rules: {
    // === Syntax & structure (catches unclosed blocks, empty rules, etc.) ===
    "block-no-empty": true,
    "at-rule-no-unknown": null,
    "no-invalid-double-slash-comments": true,
    "string-no-newline": true,

    // === Property validation ===
    "property-no-unknown": true,
    "declaration-block-no-duplicate-properties": true,
    "declaration-block-no-shorthand-property-overrides": true,
    "shorthand-property-no-redundant-values": true,
    "color-named": "never",
    "color-hex-length": "long",
    "font-weight-notation": "numeric",
    "length-zero-no-unit": true,
    "unit-no-unknown": [true, { ignoreUnits: ["rems"] }],

    // === Selectors ===
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
    "selector-pseudo-element-no-unknown": [true, { ignorePseudoElements: ["v-deep", "slotted"] }],
    "selector-type-no-unknown": null
  }
};
