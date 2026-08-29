/**
 * Mutation testing config. See https://stryker-mutator.io/docs/stryker-js/configuration/
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  // The plugin is not auto-detected under pnpm, so name it explicitly.
  plugins: ['@stryker-mutator/tap-runner'],
  packageManager: 'pnpm',

  // node:test writes TAP, so the tap runner can read the results. `--import tsx`
  // lets the runner execute the TypeScript sources without a build step.
  testRunner: 'tap',
  tap: {
    testFiles: ['test/**/*.test.ts'],
    nodeArgs: ['--import', 'tsx', '--test-reporter=tap'],
  },

  // index.ts only re-exports, there is nothing to mutate in it.
  mutate: ['src/**/*.ts', '!src/index.ts'],

  // Run only the test files that cover the mutant.
  coverageAnalysis: 'perTest',
  // Mutants in module-level code cannot be covered per test file.
  ignoreStatic: true,

  // Stryker rewrites the tsconfig of the sandbox with the TypeScript JS API,
  // which typescript@7 no longer ships. Point the option at a file that does not
  // exist, so Stryker skips the rewrite. The real tsconfig.json is still copied
  // to the sandbox, and tsx needs it there to resolve the `#afpp/src/*` imports.
  tsconfigFile: 'tsconfig.stryker-skip-rewrite.json',

  // Keep the sandbox small: only the sources, the tests and their fixtures.
  ignorePatterns: [
    '.agent',
    '.agents',
    '.husky',
    '.vscode',
    '.zed',
    'benchmark',
    'coverage',
    'dist',
    'docs',
    'examples',
    'reports',
  ],

  timeoutMS: 30000,
  timeoutFactor: 3,
  tempDirName: '.stryker-tmp',

  reporters: ['html', 'clear-text', 'progress', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  thresholds: { break: null, high: 80, low: 60 },
};
