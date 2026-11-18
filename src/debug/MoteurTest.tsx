import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { versBlob } from "@/lib/image";
import { getWorker, scanner } from "@/lib/moteur";
import {
  analyser as analyserGrille,
  type Analyse,
  type Mirage,
} from "@/lib/skyjo";
import ChoixPhoto from "./ChoixPhoto";
import EnregistrerFixture from "./EnregistrerFixture";
import GrilleLue from "./GrilleLue";
import type { WorkerResponse } from "@/worker/cactus.worker";

// Fixtures dont la photo est présente sur ce poste (listées par le serveur de dev, cf. vite.config.ts).
interface Fixture {
  nom: string;
  ext: string;
  ref: "mirage" | "wasm";
  attendu: number | null;
}

// ponytail: page de test du moteur (E1, ouverte avec ?debug), à garder pour recalibrer en E4.

interface MirageBrut {
  objects: { name: string; bbox: number[] }[];
  text: { string: string; bbox: number[] }[];
}

const comparer = (obtenu: MirageBrut, attendu: MirageBrut) => {
  const textes = (m: MirageBrut) =>
    m.text
      .map((t) => t.string)
      .sort()
      .join("|");
  const memeNombre = obtenu.objects.length === attendu.objects.length;
  return {
    objets: `${obtenu.objects.length} / ${attendu.objects.length}`,
    textes: `${obtenu.text.length} / ${attendu.text.length}`,
    textesIdentiques: textes(obtenu) === textes(attendu),
    ecartBboxMax: memeNombre
      ? Math.max(
          0,
          ...obtenu.objects.flatMap((o, i) =>
            o.bbox.map((v, k) => Math.abs(v - attendu.objects[i].bbox[k])),
          ),
        )
      : null,
  };
};

const MoteurTest = (): React.JSX.Element => {
  const [etat, setEtat] = useState("Chargement du moteur…");
  const [sortie, setSortie] = useState("");
  const [vue, setVue] = useState<{
    analyse: Analyse;
    photo: string;
    attendu?: number;
  } | null>(null);
  const [occupe, setOccupe] = useState(true);
  const [aEnregistrer, setAEnregistrer] = useState<React.ComponentProps<
    typeof EnregistrerFixture
  > | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);

  const chargerFixtures = () => {
    if (import.meta.env.DEV)
      fetch("/__fixtures")
        .then((r) => r.json() as Promise<Fixture[]>)
        .then(setFixtures)
        .catch(() => setFixtures([]));
  };
  useEffect(chargerFixtures, []);

  useEffect(() => {
    getWorker().onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === "ready")
        setEtat(`Moteur prêt en ${Math.round(e.data.ms)} ms`);
      if (e.data.type === "error") setEtat(`Erreur : ${e.data.message}`);
      setOccupe(false);
    };
  }, []);

  const analyser = async (
    photo: Blob,
    reference?: MirageBrut,
    attendu?: number,
  ) => {
    setOccupe(true);
    setEtat("Analyse…");
    try {
      const { analyse, mirage, image, tournee, recadrage, relues, ms } =
        await scanner(photo);
      const { rgba, width, height } = image;
      const python = reference
        ? analyserGrille(reference as unknown as Mirage, rgba, width, height)
            .score.total
        : null;
      setEtat(
        [
          `Analyse ${width}×${height} en ${Math.round(ms)} ms`,
          tournee && "cartes couchées : photo tournée de 90° et relancée",
          recadrage && "grille petite : recadrée et relancée",
          relues > 0 && `${relues} carte(s) relue(s) sur un recadrage`,
          python !== null && !tournee && !recadrage && `score avec le JSON de référence : ${python}`,
        ]
          .filter(Boolean)
          .join(" · "),
      );
      const affichee = tournee || recadrage ? await versBlob(image) : photo;
      setAEnregistrer(
        photo instanceof File
          ? { photo, wasm: mirage, tournee, recadrage, image: [image.width, image.height], scoreLu: analyse.score.total }
          : null,
      );
      setVue((v) => {
        if (v) URL.revokeObjectURL(v.photo);
        return { analyse, photo: URL.createObjectURL(affichee), attendu };
      });
      const resultat = reference
        ? { comparaison: comparer(mirage as MirageBrut, reference), mirage }
        : mirage;
      setSortie(JSON.stringify(resultat, null, 2));
    } catch (err) {
      setEtat(`Erreur : ${String(err)}`);
    } finally {
      setOccupe(false);
    }
  };

  const fixture = async ({ nom, ext, ref, attendu }: Fixture) => {
    const [image, reference] = await Promise.all([
      fetch(`/tests/fixtures/${nom}.${ext}`).then((r) => r.blob()),
      fetch(`/tests/fixtures/${nom}.${ref}.json`).then(
        (r) => r.json() as Promise<MirageBrut>,
      ),
    ]);
    await analyser(image, reference, attendu ?? undefined);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Skyjo Scan — test du moteur</h1>
      <p aria-live="polite">{etat}</p>
      <ChoixPhoto disabled={occupe} onPhoto={(p) => analyser(p)} />
      <div className="flex flex-wrap items-center gap-2">
        {fixtures.map((f) => (
          <Button key={f.nom} disabled={occupe} onClick={() => fixture(f)}>
            {f.nom}
          </Button>
        ))}
      </div>
      {import.meta.env.DEV && aEnregistrer && (
        <EnregistrerFixture
          key={aEnregistrer.photo.name}
          {...aEnregistrer}
          onEnregistree={chargerFixtures}
        />
      )}
      {vue && <GrilleLue {...vue} />}
      {sortie && (
        <details>
          <summary className="cursor-pointer text-sm">JSON Mirage brut</summary>
          <pre className="max-h-[70vh] overflow-auto rounded bg-muted p-3 text-xs">
            {sortie}
          </pre>
        </details>
      )}
    </main>
  );
};

export default MoteurTest;
