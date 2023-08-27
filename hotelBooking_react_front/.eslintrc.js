module.exports = {
    "parser": '@typescript-eslint/parser',
    "parserOptions": {
        "project": 'tsconfig.json',
        "sourceType": 'module',
        "ecmaVersion": "latest"
    },
    "plugins": ['@typescript-eslint/eslint-plugin'],
    "env": {
        "browser": true,
        "es2021": true
    },
    "ignorePatterns": ['.eslintrc.js', 'tailwind.config.js'],
    "extends": [
        "standard-with-typescript",
        "plugin:react/recommended"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "plugins": [
        "react"
    ],
    "rules": {
        "react/react-in-jsx-scope": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "react/display-name": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/strict-boolean-expressions": "off",
        "@typescript-eslint/no-floating-promises": "off",
    }
}
