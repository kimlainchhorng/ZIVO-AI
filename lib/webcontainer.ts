import { WebContainer } from '@webcontainer/api';

let wc: WebContainer | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (!wc) wc = await WebContainer.boot();
  return wc;
}
