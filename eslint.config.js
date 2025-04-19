import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import stylistic from '@stylistic/eslint-plugin'
import perfectionist from 'eslint-plugin-perfectionist'
import unusedImports from 'eslint-plugin-unused-imports'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    ignores: [
      ".next",
      "node_modules/*",
      "src/app/layout.tsx",
      "**/*.js",
      "**/*.jsx",
      "src/server/api/trpc.ts",
      "src/server/auth/config.ts",
      "src/trpc/react.tsx"
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    settings: {
      'perfectionist': {
        'type': 'line-length',
        'partitionByComment': true,
      },
    },
    plugins: {
      stylistic,
      perfectionist,
      unusedImports,
    },
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      'perfectionist/sort-imports': [
        'warn',
        {
          'type': 'line-length',
          'order': 'desc',
          'ignoreCase': true,
          'newlinesBetween': 'always',
        }
      ],
      'perfectionist/sort-interfaces': [
        'warn',
        {
          'type': 'line-length',
          'order': 'desc',
          'ignoreCase': true,
        }
      ],
      'perfectionist/sort-intersection-types': [
        'warn',
        {
          'type': 'line-length',
          'order': 'desc',
          'ignoreCase': true,
        }
      ],
      'perfectionist/sort-named-imports': [
        'warn',
        {
          'type': 'line-length',
          'order': 'desc',
          'ignoreAlias': false,
          'ignoreCase': true,
          'groupKind': 'mixed',
        }
      ],
      'unusedImports/no-unused-imports': 'warn',
      'unusedImports/no-unused-vars': [
        'warn',
        {
          'vars': 'all',
          'varsIgnorePattern': '^_',
          'args': 'after-used',
          'argsIgnorePattern': '^_',
        }
      ],
      'stylistic/semi': [
        'warn',
        'never'
      ],
      'react-hooks/exhaustive-deps': 'off',
      'arrow-body-style': [
        'error',
        'as-needed'
      ],
      'stylistic/quotes': [
        'error',
        'single'
      ],
      'stylistic/max-len': [
        'warn',
        {
          'code': 140,
          'ignoreUrls': true,
          'ignoreStrings': true,
          'ignoreTemplateLiterals': true,
          'ignoreRegExpLiterals': true,
          'ignoreComments': true,
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          'selector': 'FunctionExpression',
          'message': 'Function expressions are not allowed.',
        },
        {
          'selector': 'FunctionDeclaration',
          'message': 'Function declarations are not allowed.',
        }
      ],
      'stylistic/comma-dangle': [
        'warn',
        {
          'arrays': 'never',
          'functions': 'never',
          'objects': 'always',
          'imports': 'always',
          'exports': 'always',
        }
      ],
      'prefer-arrow-callback': 'error',
      'stylistic/implicit-arrow-linebreak': ['error', 'beside'],
      'stylistic/indent': ['error', 2],
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-noninteractive-element-interactions': 'off',
      'jsx-a11y/no-noninteractive-tabindex': 'off',
      'stylistic/jsx-quotes': ['error', 'prefer-single'],
      'stylistic/linebreak-style': 'off',
      'no-case-declarations': 'error',
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-plusplus': 'off',
      'no-unused-expressions': 'error',
      'stylistic/object-curly-newline': ['error', {
        'ObjectPattern': { 'multiline': true, 'minProperties': 4, },
        'ObjectExpression': { 'multiline': true, 'minProperties': 4, },
      }], // TODO: come back and take a look at making objects be in there own line
      'stylistic/operator-linebreak': ['error', 'before'],
      'tailwindcss/no-custom-classname': 'off',
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
