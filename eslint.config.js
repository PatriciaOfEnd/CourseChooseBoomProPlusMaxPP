/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
    {
        files: ["grab.user.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                // Browser
                window: "readonly",
                location: "readonly",
                document: "readonly",
                localStorage: "readonly",
                sessionStorage: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                AudioContext: "readonly",
                webkitAudioContext: "readonly",
                // Page globals
                axios: "readonly",
                grablessonsVue: "readonly",
                confirm: "readonly",
                // URL constructor
                URLSearchParams: "readonly",
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_$" }],
            "no-undef": "error",
            "no-constant-condition": ["error", { checkLoops: false }],
            "no-empty": ["error", { allowEmptyCatch: true }],
            "no-extra-semi": "warn",
            "prefer-const": "warn",
            "no-var": "warn",
        },
    },
];

module.exports = config;
