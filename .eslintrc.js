/* eslint-disable max-len */
module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        project: './tsconfig.eslint.json',
    },
    plugins: ['@typescript-eslint', 'fp', 'prettier'],
    settings: {
        'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
        'import/resolver': { typescript: {} },
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    rules: {
        '@typescript-eslint/adjacent-overload-signatures': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/ban-types': 'error',
        '@typescript-eslint/ban-ts-comment': 'warn',
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/consistent-type-definitions': 'error',
        '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
        '@typescript-eslint/explicit-member-accessibility': [
            'error',
            { accessibility: 'explicit' },
        ],
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/member-delimiter-style': 'off',
        '@typescript-eslint/member-ordering': 'error',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-parameter-properties': 'off',
        '@typescript-eslint/no-require-imports': 'error',
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                ignoreRestSiblings: true,
            },
        ],
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-namespace-keyword': 'error',
        '@typescript-eslint/quotes': 'off',
        '@typescript-eslint/triple-slash-reference': 'error',
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/unified-signatures': 'error',
        'array-callback-return': 'error',
        camelcase: ['error', { allow: ['bicycle_rent', 'bike_rental'] }],
        'comma-dangle': ['error', 'always-multiline'],
        complexity: 'off',
        'default-case': 'off',
        'eol-last': 'error',
        eqeqeq: ['error', 'smart'],
        'fp/no-loops': 'error',
        'fp/no-mutating-methods': 'error',
        'guard-for-in': 'error',
        'id-blacklist': [
            'error',
            'any',
            'Number',
            'number',
            'String',
            'string',
            'Boolean',
            'boolean',
        ],
        'import/prefer-default-export': 'off',
        'no-case-declarations': 'error',
        'no-cond-assign': 'error',
        'no-console': 'warn',
        'no-empty': 'error',
        'no-lonely-if': 'error',
        'no-restricted-syntax': [
            'warn',
            {
                selector: 'ForInStatement',
                message:
                    'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
            },
            {
                selector: 'CallExpression[callee.name=I18n] > Literal',
                message: 'Use the T object instead of a string in I18n calls',
            },
        ],
        'no-shadow': ['error', { hoist: 'all' }],
        'no-unneeded-ternary': 'error',
        'no-unused-expressions': 'error',
        'no-use-before-define': 'off',
        'no-var': 'error',
        'no-warning-comments': ['warn', { terms: ['TODO'], location: 'anywhere' }],
        'object-shorthand': ['error', 'always'],
        'one-var': ['error', 'never'],
        'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
        'prefer-const': 'warn',
        'prefer-destructuring': 'off',
        'prefer-object-spread': 'error',
        'prefer-template': 'error',
        'prettier/prettier': 'error',
        'spaced-comment': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'off',
    },
}
