import { baseConfig } from '@rheo/config/eslint.js';

/** Mirrors `scripts/check-import-boundaries.mjs` (Contracts must stay React-free). */
export default [
  ...baseConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'Contracts must stay React-free (import-boundaries).' },
            { name: 'react-dom', message: 'Contracts must stay React-free (import-boundaries).' },
            {
              name: 'react-native',
              message: 'Contracts must stay React-free (import-boundaries).',
            },
          ],
        },
      ],
    },
  },
];
