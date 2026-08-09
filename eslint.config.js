import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'src/qr/vendor/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        SVGSVGElement: 'readonly',
        ImageData: 'readonly',
        ClipboardItem: 'readonly',
        Buffer: 'readonly',
        self: 'readonly',
        MessageEvent: 'readonly',
        File: 'readonly',
        Event: 'readonly',
        ArrayBuffer: 'readonly',
        Uint8ClampedArray: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        Worker: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  /* Guardrail: Prohibit direct import of Nayuki vendored code outside the qr adapter */
  {
    files: [
      'src/app/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
      'src/features/**/*.{ts,tsx}',
      'src/render/**/*.{ts,tsx}',
      'src/verify/**/*.{ts,tsx}',
      'src/export/**/*.{ts,tsx}',
      'src/payloads/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/qr/vendor/**', '**/qr/vendor/*'],
              message:
                'ARCHITECTURE VIOLATION: Nayuki vendored implementation must only be imported by the designated PureQR adapter inside src/qr/.',
            },
            {
              group: ['**/workers/**', '**/workers/*'],
              message:
                'ARCHITECTURE VIOLATION: Main thread UI and renderer code must not import worker internals directly.',
            },
          ],
        },
      ],
    },
  },
  prettierConfig,
];
