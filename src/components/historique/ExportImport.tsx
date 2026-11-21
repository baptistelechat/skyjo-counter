import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exporter, lireExport, type Historique } from "@/lib/historique";

interface Props {
  historique: Historique;
  onImporter: (h: Historique) => number;
}

// Sauvegarde manuelle (pas de synchro serveur) : fichier JSON à garder ou à transférer.
const ExportImport = ({ historique, onImporter }: Props): React.JSX.Element => {
  const fichier = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(
    null,
  );

  const exporterFichier = () => {
    const url = URL.createObjectURL(
      new Blob([exporter(historique)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `skyjo-scan-historique-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importerFichier = async (f: File | undefined) => {
    if (!f) return;
    try {
      const n = onImporter(lireExport(await f.text()));
      setMessage({
        ok: true,
        texte: n
          ? `${n} partie${n > 1 ? "s" : ""} importée${n > 1 ? "s" : ""}.`
          : "Toutes ces parties sont déjà dans l'historique.",
      });
    } catch (e) {
      setMessage({
        ok: false,
        texte: e instanceof Error ? e.message : "Import impossible.",
      });
    } finally {
      if (fichier.current) fichier.current.value = "";
    }
  };

  return (
    <section aria-labelledby="titre-sauvegarde" className="flex flex-col gap-2">
      <h2 id="titre-sauvegarde" className="text-sm font-semibold">
        Sauvegarde
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={exporterFichier}
          disabled={!historique.parties.length}
        >
          <Download aria-hidden="true" />
          Exporter
        </Button>
        <Button variant="outline" onClick={() => fichier.current?.click()}>
          <Upload aria-hidden="true" />
          Importer
        </Button>
      </div>
      <input
        ref={fichier}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Fichier d'historique à importer"
        onChange={(e) => void importerFichier(e.target.files?.[0])}
      />
      <p
        aria-live="polite"
        className={`text-sm ${message?.ok === false ? "text-destructive" : "text-muted-foreground"}`}
      >
        {message?.texte}
      </p>
    </section>
  );
};

export default ExportImport;
