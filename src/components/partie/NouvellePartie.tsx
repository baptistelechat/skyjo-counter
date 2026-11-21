import { useState } from "react";
import { Play, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOUEURS_MAX, JOUEURS_MIN, nomsValides } from "@/lib/partie";

interface Props {
  onCreer: (noms: string[]) => void;
}

// Création d'une partie : 2 à 8 joueurs, noms obligatoires et distincts.
const NouvellePartie = ({ onCreer }: Props): React.JSX.Element => {
  const [noms, setNoms] = useState(["", ""]);
  const valides = nomsValides(noms);
  const doublon =
    new Set(valides.map((n) => n.toLowerCase())).size !== valides.length;
  const pret =
    valides.length >= JOUEURS_MIN && valides.length === noms.length && !doublon;

  const changer = (i: number, nom: string) =>
    setNoms(noms.map((n, j) => (j === i ? nom : n)));

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-6 p-6">
      <header className="space-y-1 text-center">
        <h1 className="font-heading text-4xl text-primary">Skyjo Scan</h1>
        <p className="text-muted-foreground">
          Les scores de toute la partie, manche après manche. Une photo de la
          grille suffit pour saisir une manche.
        </p>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (pret) onCreer(valides);
        }}
      >
        <h2 className="text-lg font-semibold">Nouvelle partie</h2>
        {noms.map((nom, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor={`joueur-${i}`}>Joueur {i + 1}</Label>
              <Input
                id={`joueur-${i}`}
                value={nom}
                autoComplete="off"
                maxLength={20}
                placeholder="Prénom"
                onChange={(e) => changer(i, e.target.value)}
              />
            </div>
            {noms.length > JOUEURS_MIN && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Retirer le joueur ${i + 1}`}
                onClick={() => setNoms(noms.filter((_, j) => j !== i))}
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        {noms.length < JOUEURS_MAX && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setNoms([...noms, ""])}
          >
            <Plus aria-hidden="true" />
            Ajouter un joueur
          </Button>
        )}
        {doublon && (
          <p role="alert" className="text-sm text-destructive">
            Deux joueurs ont le même nom.
          </p>
        )}
        <Button type="submit" size="xl" disabled={!pret}>
          <Play aria-hidden="true" />
          Commencer la partie
        </Button>
      </form>
    </main>
  );
};

export default NouvellePartie;
