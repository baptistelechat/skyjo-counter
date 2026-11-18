import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  photo: File;
  wasm: unknown;
  tournee: boolean;
  recadrage: [number, number, number, number] | null;
  image: [number, number]; // dimensions de l'image analysée (après rotation / recadrage)
  scoreLu: number;
  onEnregistree?: () => void;
}

const enBase64 = (f: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });

// Dev uniquement : envoie la photo + le JSON WASM au serveur Vite, qui les écrit dans tests/fixtures.
const EnregistrerFixture = ({
  photo,
  wasm,
  tournee,
  recadrage,
  image,
  scoreLu,
  onEnregistree,
}: Props): React.JSX.Element => {
  const [attendu, setAttendu] = useState(String(scoreLu));
  const [message, setMessage] = useState("");

  const enregistrer = async () => {
    const valeur = Number.parseInt(attendu, 10);
    if (Number.isNaN(valeur))
      return setMessage("Saisis le score réel de la grille");
    const nom = `reel-${valeur < 0 ? `moins${-valeur}` : valeur}-${Date.now().toString(36)}`;
    setMessage("Envoi…");
    const reponse = await fetch("/__fixtures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom,
        ext: photo.type === "image/png" ? "png" : "jpg",
        photo: await enBase64(photo),
        wasm,
        meta: {
          attendu: valeur,
          scoreLu,
          tournee,
          recadrage,
          image,
          date: new Date().toISOString(),
        },
      }),
    });
    setMessage(
      reponse.ok
        ? `✅ Enregistrée : tests/fixtures/${await reponse.text()}`
        : `❌ ${await reponse.text()}`,
    );
    if (reponse.ok) onEnregistree?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded border p-3 text-sm">
      <label htmlFor="score-attendu">Score réel de la grille</label>
      <input
        id="score-attendu"
        type="number"
        inputMode="numeric"
        className="w-20 rounded border px-2 py-1"
        value={attendu}
        onChange={(e) => setAttendu(e.target.value)}
      />
      <Button onClick={enregistrer}>Enregistrer comme fixture</Button>
      <span aria-live="polite">{message}</span>
    </div>
  );
};

export default EnregistrerFixture;
