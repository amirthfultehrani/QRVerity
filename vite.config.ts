/// <reference types="vitest" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Robust base path computation for GitHub Pages subpath deployment or local execution
const getBasePath = (): string => {
  if (process.env.VITE_BASE_PATH) {
    return process.env.VITE_BASE_PATH;
  }
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    return repoName ? `/${repoName}/` : '/';
  }
  return '/';
};

export default defineConfig({
  plugins: [preact()],
  base: getBasePath(),
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
  },
});
