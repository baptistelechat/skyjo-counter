import createCactus, { type CactusModule } from "../vendor/cactus.js";
import { parseMirage } from "../lib/json";

// options : JSON passé à cactus_describe (sections/champs à produire).
export type WorkerRequest = { rgb: Uint8Array; width: number; height: number; options?: string };
export type WorkerResponse =
  | { type: "progress"; recu: number; total: number } // téléchargement du modèle (total 0 : inconnu)
  | { type: "ready"; ms: number }
  | { type: "result"; mirage: unknown; ms: number }
  | { type: "error"; message: string };

const WASM_URL = "/cactus/cactus.wasm";
const MODEL_URL = "/models/mirage.cact";
const OUT_CAP = 16 * 1024 * 1024; // même taille que le buffer Python
const CACTUS_VISION = 4;
// Seuls objects (bbox) et text (string, bbox, score) sont lus par l'app : ~1 s de moins par passe que "{}".
const OPTIONS_DEFAUT = JSON.stringify({ sections: ["objects", "text"], fields: ["bbox", "score"] });

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
// suivre : envoie la progression à la page (modèle de ~21 Mo, long au premier lancement).
const telecharger = async (url: string, suivre = false): Promise<Uint8Array> => {
  const r = await fetch(url);
  if (!r.ok)
    throw new Error(`Téléchargement de ${url} impossible (HTTP ${r.status})`);
  if (!suivre || !r.body) return new Uint8Array(await r.arrayBuffer());
  const total = Number(r.headers.get("content-length")) || 0;
  const morceaux: Uint8Array[] = [];
  let recu = 0;
  const lecteur = r.body.getReader();
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    morceaux.push(value);
    recu += value.length;
    post({ type: "progress", recu, total });
  }
  const tout = new Uint8Array(recu);
  let i = 0;
  for (const m of morceaux) {
    tout.set(m, i);
    i += m.length;
  }
  return tout;
};

async function init() {
  const t0 = performance.now();
  // cactus.js ignore locateFile (il cherche le .wasm à côté du worker) : on lui passe le binaire.
  const wasmBinary = (await telecharger(WASM_URL)).buffer as ArrayBuffer;
  M = await createCactus({ wasmBinary });
  const cact = await telecharger(MODEL_URL, true);
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

function describe({ rgb, width, height, options = OPTIONS_DEFAUT }: WorkerRequest) {
  const t0 = performance.now();
  const rgbPtr = M._malloc(rgb.length);
  M.HEAPU8.set(rgb, rgbPtr);
  const optionsPtr = writeString(options);
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
