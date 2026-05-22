import * as vscode from 'vscode';
import {
  GEO_PROVIDERS,
  parseProviderResponse,
  type GeoProvider,
  type GeoResult,
} from './geolocationCore';

const TIMEOUT_MS = 8000;

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

async function fetchFromProvider(
  provider: GeoProvider,
  signal: AbortSignal
): Promise<{ ok: true; geo: GeoResult } | { ok: false; status?: number; message: string }> {
  try {
    const response = await fetch(provider.url, {
      signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const retryable = RETRYABLE_STATUS.has(response.status);
      return {
        ok: false,
        status: response.status,
        message: retryable
          ? `HTTP ${response.status} (${provider.name})`
          : `HTTP ${response.status} (${provider.name})`,
      };
    }

    const data: unknown = await response.json();
    const parsed = parseProviderResponse(provider, data);
    if (!parsed) {
      return { ok: false, message: `Invalid response (${provider.name})` };
    }

    return { ok: true, geo: parsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `${message} (${provider.name})` };
  }
}

export async function detectLocationByIp(): Promise<void> {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Circadian UI: Detecting location…',
      cancellable: true,
    },
    async (_progress, token) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

      token.onCancellationRequested(() => controller.abort());

      const errors: string[] = [];

      try {
        for (const provider of GEO_PROVIDERS) {
          if (token.isCancellationRequested) {
            return;
          }

          const result = await fetchFromProvider(provider, controller.signal);

          if (result.ok) {
            const geo = result.geo;
            const config = vscode.workspace.getConfiguration('circadianUi');
            const target = vscode.workspace.workspaceFolders?.length
              ? vscode.ConfigurationTarget.Workspace
              : vscode.ConfigurationTarget.Global;

            await config.update('latitude', geo.lat, target);
            await config.update('longitude', geo.lon, target);

            const place = [geo.city, geo.country].filter(Boolean).join(', ');
            void vscode.window.showInformationMessage(
              `Circadian UI: Location set to ${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}` +
                (place ? ` (${place})` : '') +
                ` via ${geo.provider}`
            );
            return;
          }

          errors.push(result.message);

          if (result.status !== undefined && !RETRYABLE_STATUS.has(result.status)) {
            continue;
          }
        }

        const detail = errors.length ? errors.join('; ') : 'All providers failed';
        void vscode.window
          .showErrorMessage(
            `Circadian UI: Could not detect location (${detail}). Set latitude/longitude in settings.`,
            'Open Settings'
          )
          .then((choice) => {
            if (choice === 'Open Settings') {
              void vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'circadianUi.latitude'
              );
            }
          });
      } finally {
        clearTimeout(timeout);
      }
    }
  );
}
