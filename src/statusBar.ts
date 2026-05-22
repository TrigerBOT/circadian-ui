import * as vscode from 'vscode';
import type { Transition } from './scheduler';
import { formatTransitionTime } from './scheduler';
import type { CircadianConfig } from './config';

export class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly onToggle: () => void,
    private readonly onSelectDay: () => void,
    private readonly onSelectNight: () => void
  ) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'circadianUi.toggle';
    this.item.tooltip = 'Circadian UI — click to toggle auto theme';
    this.disposables.push(this.item);
  }

  update(config: CircadianConfig, next: Transition | null, paused: boolean): void {
    if (!config.enabled) {
      this.item.text = '$(circle-slash) Circadian UI';
      this.item.tooltip = 'Circadian UI is off — click to enable';
      this.item.show();
      return;
    }

    if (paused) {
      this.item.text = '$(debug-pause) Circadian UI';
      this.item.tooltip = 'Auto theme paused (manual change) — run "Resume Auto Theme"';
      this.item.show();
      return;
    }

    const modeLabel = config.scheduleMode === 'solar' ? 'solar' : 'fixed';
    if (next) {
      const icon = next.phase === 'night' ? '$(moon)' : '$(sun)';
      const action = next.phase === 'night' ? 'night' : 'day';
      this.item.text = `${icon} Circadian · ${action} ${formatTransitionTime(next.at)}`;
      this.item.tooltip = `Circadian UI (${modeLabel}) — next: ${next.theme} at ${formatTransitionTime(next.at)}`;
    } else {
      this.item.text = '$(warning) Circadian UI';
      this.item.tooltip = `Circadian UI (${modeLabel}) — schedule unavailable; check settings`;
    }
    this.item.show();
  }

  dispose(): void {
    this.item.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
