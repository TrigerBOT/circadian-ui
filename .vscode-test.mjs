import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'test/integration/**/*.test.mjs',
  version: 'stable',
  workspaceFolder: '.vscode-test-workspace',
  mocha: {
    timeout: 60_000,
  },
});
