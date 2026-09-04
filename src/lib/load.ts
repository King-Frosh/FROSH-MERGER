import * as XLSX from "xlsx";
import JSZip from "jszip";

/**
 * Load the spreadsheet/ZIP engines from the application's own bundle.
 *
 * The previous implementation downloaded these modules dynamically from
 * third-party CDNs at runtime. That is fragile in production because browser
 * module loading can be blocked by CSP, network/CDN failures, or module
 * resolution issues. Both packages are already declared in package.json, so
 * bundling them with Vite makes the app self-contained and works offline too.
 */

export async function getXLSX(): Promise<typeof XLSX> {
  return XLSX;
}

export async function getJSZip(): Promise<typeof JSZip> {
  return JSZip;
}
