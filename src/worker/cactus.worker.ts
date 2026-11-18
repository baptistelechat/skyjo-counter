import createCactus, { type CactusModule } from "../vendor/cactus.js";
import { parseMirage } from "../lib/json";

export type WorkerRequest = { rgb: Uint8Array; width: number; height: number };
export type WorkerResponse =
  | { type: "ready"; ms: number }
  | { type: "result"; mirage: unknown; ms: number }
  | { type: "error"; message: string };

const WASM_URL = "/cactus/cactus.wasm";
const MODEL_URL = "/models/mirage.cact";
const OUT_CAP = 16 * 1024 * 1024; // même taille que le buffer Python
const CACTUS_VISION = 4;

let M: CactusModule;
let outPtr = 0;

const post = (msg: WorkerResponse) => self.postMessage(msg);
const lastError = () => M.UTF8ToString(M._cactus_last_error());

function writeString(s: string) {
  const bytes = new TextEncoder().encode(`${s}\0`);
  const ptr = M._malloc(bytes.length);
  M.HEAPU8.set(bytes, ptr);
  return ptr;
}

// Un 404 (fichier absent du déploiement) donnerait sinon une erreur WASM incompréhensible.
const telecharger = async (url: string): Promise<ArrayBuffer> => {
  const r = await fetch(url);
  if (!r.ok)
    throw new Error(`Téléchargement de ${url} impossible (HTTP ${r.status})`);
  return r.arrayBuffer();
};

async function init() {
  const t0 = performance.now();
  // cactus.js ignore locateFile (il cherche le .wasm à côté du worker) : on lui passe le binaire.
  const wasmBinary = await telecharger(WASM_URL);
  M = await createCactus({ wasmBinary });
  const cact = new Uint8Array(await telecharger(MODEL_URL));
  const modelPtr = M._malloc(cact.length);
  M.HEAPU8.set(cact, modelPtr);
  const code = M._cactus_load(modelPtr, BigInt(cact.length)); // n est un unsigned long long
  // Le moteur copie le modèle (le binding Python libère ses octets juste après cactus_load).
  M._free(modelPtr);
  if (code < 0) throw new Error(lastError());
  if (!(M._cactus_models() & CACTUS_VISION))
    throw new Error("Pas un modèle Mirage");
  outPtr = M._malloc(OUT_CAP);
  post({ type: "ready", ms: performance.now() - t0 });
}

function describe({ rgb, width, height }: WorkerRequest) {
  const t0 = performance.now();
  const rgbPtr = M._malloc(rgb.length);
  M.HEAPU8.set(rgb, rgbPtr);
  const optionsPtr = writeString("{}");
  const code = M._cactus_describe(
    rgbPtr,
    width,
    height,
    optionsPtr,
    0,
    0,
    outPtr,
    OUT_CAP,
  );
  M._free(rgbPtr);
  M._free(optionsPtr);
  if (code < 0) throw new Error(lastError());
  return {
    mirage: parseMirage(M.UTF8ToString(outPtr)),
    ms: performance.now() - t0,
  };
}

const ready = init().catch((e: unknown) => {
  post({ type: "error", message: String(e) });
  throw e;
});

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  try {
    await ready;
    post({ type: "result", ...describe(e.data) });
  } catch (err) {
    post({ type: "error", message: String(err) });
  }
};
