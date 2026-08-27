import React, { useState } from 'react';
import ColonneGauche from './composants/colonne_gauche';
import Contenu from './composants/contenu';

export interface Champ { id: string; attribut: string; type: string; }
export interface MethodesCRUD { Create: boolean; Read: boolean; Update: boolean; Delete: boolean; FindAll: boolean; }

const EditeurClasse: React.FC = () => {
  const [langage, setLangage] = useState<string>('');
  const [classe, setClasse] = useState<string>('');
  const [champs, setChamps] = useState<Champ[]>([{ id: Date.now().toString(), attribut: '', type: '' }]);
  const [methodesCRUD, setMethodesCRUD] = useState<MethodesCRUD>({ Create: false, Read: false, Update: false, Delete: false, FindAll: false });
  const [resultat, setResultat] = useState<string>('');

  return (
    <div className="h-screen flex flex-col">
      <h1 className="bg-gray-600 px-4 py-2 text-white font-semibold">Éditeur de classe</h1>
      <div className="flex flex-1 overflow-hidden">
        <ColonneGauche
          langage={langage} setLangage={setLangage}
          classe={classe} setClasse={setClasse}
          champs={champs} setChamps={setChamps}
          methodesCRUD={methodesCRUD} setMethodesCRUD={setMethodesCRUD}
        />
        <Contenu
          langage={langage} classe={classe}
          champs={champs} methodesCRUD={methodesCRUD}
          resultat={resultat} setResultat={setResultat}
        />
      </div>
    </div>
  );
};

export default EditeurClasse;