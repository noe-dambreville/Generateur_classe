import React, { useEffect } from 'react';
import { Champ, MethodesCRUD } from '../editeur_classe';
import generationCSharp from '../utils/cSharp_generateur';
import generationPHP from '../utils/php_generateur';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

interface PropsColonneDroite {
    langage: string; classe: string; champs: Champ[]; methodesCRUD: MethodesCRUD; resultat: string;
    setResultat: (v: string) => void;
}

const Contenu: React.FC<PropsColonneDroite> = ({ langage, classe, champs, methodesCRUD, resultat, setResultat }) => {

    // Génération avec un timer de 500ms
    useEffect(() => {
        const minuterie = setTimeout(() => {
            let lignes = '';
            switch (langage) {
                case 'option_php':
                    lignes = generationPHP(classe, champs, methodesCRUD);
                    break;
                case 'option_cSharp':
                    lignes = generationCSharp(classe, champs, methodesCRUD);
                    break;
                default:
                    lignes = '// Sélectionner le langage de programmation';
            }
            setResultat(lignes);
        }, 500);

        return () => clearTimeout(minuterie); // Rénitialise le timer lorsqu'il y a une action
    }, [langage, classe, champs, methodesCRUD]);

    const copierResultat = (): void => {
        navigator.clipboard.writeText(resultat);
    };
    useEffect(() => { // coloration syntaxique
        const couleur = document.getElementById('code-box');
        if (couleur) { Prism.highlightElement(couleur); }
    }, [resultat]);  

    return (
        <div className="basis-2/3 flex flex-col bg-[#2d2d2d]">
            <div className="h-screen relative">
                 <pre id="code-box" className="language-javascript h-full" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}> 
                    {resultat} 
                </pre>
                <button className="bg-gray-300 p-1 absolute top-2 right-2 btn btn-sm btn-ghost" onClick={copierResultat}> Copier </button>
            </div>
        </div>
    );
};

export default Contenu;