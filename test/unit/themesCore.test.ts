import { describe, it, expect } from 'vitest';
import {
  collectThemesFromExtensions,
  filterAvailablePresets,
  findThemeByLabel,
  DAY_PRESETS,
} from '../../src/themesCore';

describe('themesCore', () => {
  const mockExtensions = [
    {
      id: 'vscode.theme-defaults',
      packageJSON: {
        contributes: {
          themes: [
            { label: 'Default Light Modern', uiTheme: 'vs' },
            { label: 'Default Dark Modern', uiTheme: 'vs-dark' },
          ],
        },
      },
    },
    {
      id: 'publisher.my-theme',
      packageJSON: {
        publisher: 'publisher',
        contributes: {
          themes: [
            { label: 'My Custom Dark', uiTheme: 'vs-dark' },
            { label: 'Default Dark Modern', uiTheme: 'vs-dark' },
          ],
        },
      },
    },
  ];

  it('collects themes from extensions', () => {
    const themes = collectThemesFromExtensions(mockExtensions);
    expect(themes.length).toBeGreaterThanOrEqual(3);
    expect(themes.some((t) => t.label === 'Default Light Modern')).toBe(true);
  });

  it('disambiguates duplicate labels', () => {
    const themes = collectThemesFromExtensions(mockExtensions);
    const dupes = themes.filter((t) => t.label.includes('Default Dark Modern'));
    expect(dupes.length).toBe(2);
    expect(dupes.some((t) => t.label.includes('('))).toBe(true);
  });

  it('filters presets to installed only', () => {
    const installed = collectThemesFromExtensions(mockExtensions);
    const presets = filterAvailablePresets(DAY_PRESETS, installed);
    expect(presets.some((p) => p.label === 'Default Light Modern')).toBe(true);
    expect(presets.some((p) => p.label === 'Solarized Light')).toBe(false);
  });

  it('finds theme by label', () => {
    const installed = collectThemesFromExtensions(mockExtensions);
    expect(findThemeByLabel(installed, 'My Custom Dark')).toBeDefined();
    expect(findThemeByLabel(installed, 'Nonexistent')).toBeUndefined();
  });
});
