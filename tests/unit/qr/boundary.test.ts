import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Architecture Boundary: Nayuki Vendor Import Restrictions', () => {
  function getAllSourceFiles(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'vendor') {
          files.push(...getAllSourceFiles(fullPath));
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it('ensures ONLY src/qr/encoder.ts imports from src/qr/vendor/', () => {
    const srcDir = path.resolve(process.cwd(), 'src');
    const allFiles = getAllSourceFiles(srcDir);
    const allowedAdapterPath = path.resolve(srcDir, 'qr/encoder.ts');

    const forbiddenImportsFound: string[] = [];

    for (const file of allFiles) {
      if (path.resolve(file) === allowedAdapterPath) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      if (
        content.includes('vendor/nayuki/qrcodegen') ||
        content.includes('qr/vendor') ||
        content.includes('qrcodegen')
      ) {
        forbiddenImportsFound.push(path.relative(srcDir, file));
      }
    }

    expect(forbiddenImportsFound).toEqual([]);
  });
});
