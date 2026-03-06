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

/** Tears down the current WebContainer instance so the next call to
 *  getWebContainer() will boot a fresh one.  Call this before retrying
 *  after an UNKNOWN write error (errno -4094) or a progress timeout. */
export function invalidateWebContainer(): void {
  wc = null;
}
