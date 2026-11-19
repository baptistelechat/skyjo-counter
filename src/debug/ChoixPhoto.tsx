import { Camera, ImagePlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ConsignesPhoto from "./ConsignesPhoto";

interface Props {
  disabled: boolean;
  onPhoto: (photo: File) => void;
}

// Deux grands boutons tactiles : appareil photo natif (capture, meilleur traitement des couleurs) ou galerie.
// Un <label> enveloppe l'<input type="file"> masqué : le tap ouvre le sélecteur natif.
// Pas de viseur maison : la capture par le navigateur (ImageCapture) sort des photos délavées, et la
// distance est compensée par le recadrage automatique sur la grille (cf. scanner()).
const ChoixPhoto = ({ disabled, onPhoto }: Props): React.JSX.Element => {
  const choisir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const photo = e.target.files?.[0];
    e.target.value = ""; // permet de rechoisir la même photo
    if (photo) onPhoto(photo);
  };

  const bouton = (variante: "default" | "outline") =>
    cn(
      buttonVariants({ variant: variante, size: "xl" }),
      "cursor-pointer has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
    );

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
    <ConsignesPhoto />
    <div className="grid w-full grid-cols-2 gap-3">
      <label className={bouton("default")}>
        <Camera aria-hidden="true" />
        Photo
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={disabled}
          onChange={choisir}
        />
      </label>
      <label className={bouton("outline")}>
        <ImagePlus aria-hidden="true" />
        Galerie
        <input type="file" accept="image/*" className="sr-only" disabled={disabled} onChange={choisir} />
      </label>
    </div>
    <p className="text-xs text-muted-foreground">
      Préfère « Photo » : l'appareil natif garde les vraies couleurs, dont dépend la lecture.
    </p>
    </div>
  );
};

export default ChoixPhoto;
