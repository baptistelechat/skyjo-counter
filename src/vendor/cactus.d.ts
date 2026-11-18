export interface CactusModule {
  HEAPU8: Uint8Array
  _malloc(size: number): number
  _free(ptr: number): void
  _cactus_load(ptr: number, n: bigint): number
  _cactus_models(): number
  _cactus_last_error(): number
  _cactus_describe(
    rgb: number, width: number, height: number,
    options: number, language: number, keywords: number,
    out: number, outCapacity: number,
  ): number
  UTF8ToString(ptr: number): string
}

declare const createCactus: (opts?: { wasmBinary?: ArrayBuffer }) => Promise<CactusModule>
export default createCactus
