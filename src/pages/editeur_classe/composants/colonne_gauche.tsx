import React, { useEffect, useRef } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Champ, MethodesCRUD } from '../editeur_classe';

interface PropsElementTriable {
  champ: Champ; index: number;
  onChange: (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSupprimer: (index: number) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

interface PropsColonneGauche {
  langage: string; setLangage: (v: string) => void;
  classe: string; setClasse: (v: string) => void;
  champs: Champ[]; setChamps: React.Dispatch<React.SetStateAction<Champ[]>>;
  methodesCRUD: MethodesCRUD; setMethodesCRUD: React.Dispatch<React.SetStateAction<MethodesCRUD>>;
}

const ElementTriable: React.FC<PropsElementTriable> = ({ champ, index, onChange, onSupprimer, inputRef }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: champ.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2">
      <input ref={inputRef ?? undefined} type="text" name="attribut" placeholder={`Attribut ${index + 1}`} value={champ.attribut} onChange={(e) => onChange(index, e)} className="input input-bordered input-sm flex-1" />
      <select name="type" value={champ.type} onChange={(e) => onChange(index, e)} className="select select-bordered select-sm">
        <option value="">...</option>
        <option value="int">int</option>
        <option value="string">string</option>
        <option value="float">float</option>
        <option value="bool">bool</option>
      </select>
      <button type="button" onClick={() => onSupprimer(index)} className="btn btn-xs btn-error">✕</button>
      <button type="button" {...attributes} {...listeners} className="btn btn-xs cursor-grab active:cursor-grabbing" >⠿</button>
    </div>
  );
};

const ColonneGauche: React.FC<PropsColonneGauche> = ({ langage, setLangage, classe, setClasse, champs, setChamps, methodesCRUD, setMethodesCRUD, }) => {
  const toutCoche = Object.values(methodesCRUD).every(Boolean);
  const capteurs = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const dernierInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const toutCocheActuel = Object.values(methodesCRUD).every(Boolean);
    if (toutCocheActuel !== toutCoche) {
      setMethodesCRUD((prev) => ({ ...prev, ...methodesCRUD }));
    }
  }, [methodesCRUD]);

  // Tout cocher / décocher
  const gererToutCRUD = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const coche = e.target.checked;
    setMethodesCRUD({
      Create: coche, Read: coche, Update: coche, Delete: coche, FindAll: coche,
    });
  };

  // Cocher une méthode individuelle
  const gererMethode = (cle: keyof MethodesCRUD): void => {
    setMethodesCRUD((prev) => ({ ...prev, [cle]: !prev[cle] }));
  };

  // Modifier un champ
  const gererChangementChamp = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setChamps((prev) => {
      const copie = [...prev];
      copie[index] = { ...copie[index], [name]: value };
      return copie;
    });
  };
  // raccourci clavier "+"
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === '+') { event.preventDefault();
        ajouterChamp();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  // Ajouter un champ
  const ajouterChamp = (): void => {
    setChamps((prev) => [ ...prev,
      { id: Date.now().toString(), attribut: '', type: '' }
    ]);

    setTimeout(() => {
      dernierInputRef.current?.focus();
    }, 0);
  };

  // Supprimer un champ
  const supprimerChamp = (index: number): void => {
    setChamps((prev) => prev.filter((_, i) => i !== index));
  };

  // Fin du drag
  const surFinDrag = ({ active, over }: DragEndEvent): void => {
    if (!over || active.id === over.id) return;
    setChamps((items) => {
      const ancienIndex = items.findIndex((i) => i.id === active.id);
      const nouvelIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, ancienIndex, nouvelIndex);
    });
  };

  return (
    <div className="basis-1/3 bg-gray-400 p-3 overflow-y-auto space-y-4">

      {/* Langage */}
      <div className="flex justify-between">
        <div>
          <label className="mr-2">Langage :</label>
          <select value={langage} onChange={(e) => setLangage(e.target.value)} className="select select-bordered select-sm">
            <option value="">...</option>
            <option value="option_php">PHP</option>
            <option value="option_cSharp">C#</option>
          </select>
        </div>
      </div>

      {/* Méthodes CRUD */}
      <div>
        <label className="flex items-center gap-2 font-medium">
          <input type="checkbox" checked={toutCoche} onChange={gererToutCRUD} className="checkbox checkbox-sm" />Méthodes CRUD</label>
        <div className="ml-4 flex flex-col mt-1">
          {(Object.keys(methodesCRUD) as (keyof MethodesCRUD)[]).map((cle) => (
            <label key={cle} className="flex items-center gap-2">
              <input type="checkbox" checked={methodesCRUD[cle]} onChange={() => gererMethode(cle)} className="checkbox checkbox-sm" />
              {cle}
            </label>
          ))}
        </div>
      </div>

      {/* Nom de classe */}
      <div>
        <label className="flex items-center gap-2">
          Classe :
          <input type="text" value={classe} onChange={(e) => setClasse(e.target.value)} className="input input-bordered input-sm" placeholder="Nom de la classe" />
        </label>
      </div>

      {/* Attributs */}
      <div className="flex items-center justify-between">
        <label className="font-medium">Attributs</label>
        <div className='relative'>
          <div>
            <button type="button" onClick={ajouterChamp} className="btn btn-xs btn-primary"> Ajouter </button>

          </div>
          <span className='text-gray-800 text-[13px]'>Raccourci clavier +</span>
        </div>
      </div>

      {/* Liste drag & drop */}
      <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={surFinDrag}>
        <SortableContext items={champs.map((c) => c.id)}>
          {champs.map((champ, index) => (
            <ElementTriable key={champ.id} champ={champ} index={index} onChange={gererChangementChamp} onSupprimer={supprimerChamp}
              inputRef={index === champs.length - 1 ? dernierInputRef : undefined} />
          ))}
        </SortableContext>
      </DndContext>


    </div>
  );
};

export default ColonneGauche;