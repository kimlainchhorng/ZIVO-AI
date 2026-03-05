import { WebContainer } from '@webcontainer/api';

let wc: WebContainer | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (
    typeof window !== 'undefined' &&
    window.crossOriginIsolated !== true
  ) {
    throw new Error(
      'WebContainer requires crossOriginIsolated — ensure COOP/COEP headers are set.'
    );
  }
  if (!wc) wc = await WebContainer.boot();
  return wc;
}
