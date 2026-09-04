/**
 * Lazily load heavy third-party libraries (xlsx, jszip) from a CDN at runtime.
 * This keeps the deployable bundle small and the build fast, while preserving
 * full functionality in the browser. Loading is cached and fails over to a
 * secondary CDN automatically.
 */

type AnyModule = Record<string, unknown> & { default?: unknown };

const cache = new Map<string, Promise<any>>();

async function importRemote(url: string): Promise<AnyModule> {
  // @vite-ignore is required so Vite doesn't try to statically resolve the URL.
  return import(/* @vite-ignore */ url);
}

async function load(urls: string[]): Promise<AnyModule> {
  const key = urls.join("|");
  const hit = cache.get(key);
  if (hit) return hit as Promise<AnyModule>;

  const promise = (async () => {
    let lastErr: unknown;
    for (const url of urls) {
      try {
        return await importRemote(url);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error("Failed to load module from CDN");
  })();

  cache.set(key, promise);
  return promise as Promise<AnyModule>;
}

const unwrap = (m: AnyModule): unknown => m.default ?? m;

export async function getXLSX(): Promise<any> {
  const m = await load([
    "https://esm.sh/xlsx@0.18.5",
    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm",
  ]);
  return unwrap(m);
}

export async function getJSZip(): Promise<any> {
  const m = await load([
    "https://esm.sh/jszip@3.10.1",
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm",
  ]);
  return unwrap(m);
}
