module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "ignorePatterns": [
        // we probably want to change it to a function component,
        // the error was:
        // Parsing error: Unexpected token =
        "components/unlock/unlock.js"
    ],
    "rules": {
        "react/prop-types": "off",
        "react/jsx-key": "off",
        "react/react-in-jsx-scope": "off",
        "react/jsx-no-target-blank": "off",
        "react/no-unescaped-entities": "off",
        "no-undef": "off",
        "no-dupe-else-if": "off",
        "no-unreachable": "off",
        "react/jsx-no-undef": "off"
    }
};
