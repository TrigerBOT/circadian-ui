import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Circadian UI integration', () => {
  const config = () => vscode.workspace.getConfiguration('circadianUi');

  suiteSetup(async () => {
    await config().update('enabled', true, vscode.ConfigurationTarget.Workspace);
    await config().update('scheduleMode', 'fixed', vscode.ConfigurationTarget.Workspace);
    await config().update('dayStart', '00:00', vscode.ConfigurationTarget.Workspace);
    await config().update('nightStart', '12:00', vscode.ConfigurationTarget.Workspace);
    await config().update('dayTheme', 'Default Light Modern', vscode.ConfigurationTarget.Workspace);
    await config().update('nightTheme', 'Default Dark Modern', vscode.ConfigurationTarget.Workspace);
  });

  test('extension activates', async () => {
    const ext = vscode.extensions.getExtension('TrigerBOT.circadian-ui');
    assert.ok(ext, 'Circadian UI extension should be present');
    await ext.activate();
    assert.ok(ext.isActive);
  });

  test('applyNow applies a configured day or night theme', async () => {
    await vscode.commands.executeCommand('circadianUi.applyNow');
    const theme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    const day = config().get('dayTheme');
    const night = config().get('nightTheme');
    assert.ok(
      theme === day || theme === night,
      `Expected "${day}" or "${night}", got "${theme}"`
    );
  });

  test('toggle disables enabled setting', async () => {
    await vscode.commands.executeCommand('circadianUi.toggle');
    assert.strictEqual(config().get('enabled'), false);
    await config().update('enabled', true, vscode.ConfigurationTarget.Workspace);
  });
});
