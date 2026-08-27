import { Champ, MethodesCRUD } from '../editeur_classe';

function cara(attribut: string, i: number): string {
    switch (i) {
        case 1: // $granyte
            return `$${attribut}`;
        case 2: // Granyte (première lettre maj)
            return attribut.charAt(0).toUpperCase() + attribut.slice(1);
        case 3: // $this->granyte = $granyte;
            return `$this->${attribut} = ${cara(attribut, 1)};`;
        case 4: // getter
            return `public function get${cara(attribut, 2)}(){ return $this->${attribut} ;}`;
        case 5: // setter
            return `public function set${cara(attribut, 2)}($${attribut}){ ${cara(attribut, 3)} }`;
        case 6: // $this->granyte
            return `$this->${attribut}`;
        case 7: // $stmt->bindParam(':granyte', $this->granyte);
            return `$stmt->bindParam(':${attribut}', ${cara(attribut, 6)});`;
        case 8: // $this->granyte = $res['granyte'];
            return `${cara(attribut, 6)} = $res['${attribut}'];`;
        case 9: // $this->granyte = $res['granyte'];
            return `${cara(attribut, 6)} = $res['${attribut}'];`;
        default:
            return '';
    }
}

function carac(champs: Champ[], i: number): string {
    switch (i) {
        case 1: // Premier attribut du tableau
            return champs.filter(c => c.attribut)[0].attribut;
        case 2: // premier_attribut = :premier_attribut
            return `${carac(champs, 1)} = :${carac(champs, 1)}`;
        default:
            return '';
    }
}

// ─── Générateur PHP ───────────────────────────────────────────────────────────
export default function generationPHP(
    classe: string,
    champs: Champ[],
    operations: MethodesCRUD
): string {
    let l = `<?php \n\n`;

    // Classe
    l += `class ${cara(classe, 2)}{\n`;

    // Attributs
    l += `    private $pdo;\n`;
    champs.forEach(({ attribut }) => {
        if (attribut) l += `    private $${attribut};\n`;
    });
    l += `\n`;

    // Constructeur
    l += `    function __construct(PDO $pdo, ${champs
        .filter(c => c.attribut)
        .map(c => `$${c.attribut}`)
        .join(', ')}){ \n`;
    l += `        $this->pdo = $pdo;\n`;
    champs.forEach(({ attribut }) => {
        if (attribut) l += `        ${cara(attribut, 3)}\n`;
    });
    l += `    }\n\n`;

    // Getters
    champs.forEach(({ attribut }) => {
        if (attribut) l += `    ${cara(attribut, 4)}\n`;
    });
    l += ` \n`;

    // Setters
    champs.forEach(({ attribut }) => {
        if (attribut) l += `    ${cara(attribut, 5)}\n`;
    });
    l += `\n`;

    // ─── Méthodes CRUD ───────────────────────────────────────────────────────

    // Create
    if (operations.Create) {
        l += `    function getMax(){\n`;
        l += `        $stmt = $this->pdo->prepare("SELECT MAX(${carac(champs, 1)}) AS max FROM ${cara(classe, 2)}");\n`;
        l += `        $stmt->execute();\n`;
        l += `        $max = $stmt->fetch(PDO::FETCH_ASSOC);\n`;
        l += `        return $max["max"] + 1;\n`;
        l += `    }\n\n`;

        l += `    public function Create(){\n`;
        l += `        try {\n`;
        l += `            $req = "INSERT INTO ${cara(classe, 2)}(${champs
            .filter(c => c.attribut)
            .map(c => c.attribut)
            .join(', ')}) VALUES (${champs
                .filter(c => c.attribut)
                .map(c => `:${c.attribut}`)
                .join(', ')})";\n`;
        l += `            $stmt = $this->pdo->prepare($req);\n`;
        l += `            $stmt->bindValue(':${carac(champs, 1)}', $this->getMax());\n`;
        champs.filter(c => c.attribut).slice(1).forEach(({ attribut }) => {
            if (attribut) l += `            ${cara(attribut, 7)}\n`;
        });
        l += `            $stmt->execute();\n`;
        l += `            return true;\n`;
        l += `        } catch (PDOException $e){\n`;
        l += `            echo "Erreur lors de la création des données : " . $e->getMessage();\n`;
        l += `            return false;\n`;
        l += `        }\n`;
        l += `    }\n\n`;
    }

    // Read
    if (operations.Read) {
        l += `    public function Read($${carac(champs, 1)}){\n`;
        l += `        try {\n`;
        l += `            $req = "SELECT ${champs
            .filter(c => c.attribut)
            .map(c => c.attribut)
            .join(', ')} FROM ${cara(classe, 2)} WHERE ${carac(champs, 2)}";\n`;
        l += `            $stmt = $this->pdo->prepare($req);\n`;
        l += `            $stmt->bindParam(':${carac(champs, 1)}', $${carac(champs, 1)});\n`;
        l += `            $stmt->execute();\n`;
        l += `            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);\n`;
        l += `            if ($res){\n`;
        champs.forEach(({ attribut }) => {
            if (attribut) l += `                ${cara(attribut, 8)}\n`;
        });
        l += `                return true;\n`;
        l += `            }\n`;
        l += `            return false;\n`;
        l += `        } catch (PDOException $e){\n`;
        l += `            echo "Erreur lors de la récupération des données : " . $e->getMessage();\n`;
        l += `            return false;\n`;
        l += `        }\n`;
        l += `    }\n\n`;
    }

    // FindAll
    if (operations.FindAll) {
        l += `    public function findAll(){\n`;
        l += `        try {\n`;
        l += `            $req = "SELECT ${champs
            .filter(c => c.attribut)
            .map(c => c.attribut)
            .join(', ')} FROM ${cara(classe, 2)}";\n`;
        l += `            $stmt = $this->pdo->prepare($req);\n`;
        l += `            $stmt->execute();\n`;
        l += `            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);\n`;
        l += `            return $res;\n`;
        l += `        } catch (PDOException $e){\n`;
        l += `            echo "Erreur lors de la récupération des données : " . $e->getMessage();\n`;
        l += `        }\n`;
        l += `    }\n\n`;
    }

    // Update
    if (operations.Update) {
        l += `    public function Update($${carac(champs, 1)}){\n`;
        l += `        try {\n`;
        l += `            $req = "UPDATE ${cara(classe, 2)} SET ${champs
            .filter(c => c.attribut)
            .slice(1)
            .map(c => `${c.attribut} = :${c.attribut}`)
            .join(', ')} WHERE ${carac(champs, 2)}";\n`;
        l += `            $stmt = $this->pdo->prepare($req);\n`;
        l += `            $stmt->bindParam(':${carac(champs, 1)}', $${carac(champs, 1)});\n`;
        champs.filter(c => c.attribut).slice(1).forEach(({ attribut }) => {
            if (attribut) l += `            ${cara(attribut, 7)}\n`;
        });
        l += `            $stmt->execute();\n`;
        l += `        } catch (PDOException $e){\n`;
        l += `            echo "Erreur lors de la mise à jour des données : " . $e->getMessage();\n`;
        l += `        }\n`;
        l += `    }\n\n`;
    }

    // Delete
    if (operations.Delete) {
        l += `    public function Delete($${carac(champs, 1)}){\n`;
        l += `        try {\n`;
        l += `            $req = "DELETE FROM ${cara(classe, 2)} WHERE ${carac(champs, 2)}";\n`;
        l += `            $stmt = $this->pdo->prepare($req);\n`;
        l += `            $stmt->bindParam(':${carac(champs, 1)}', $${carac(champs, 1)});\n`;
        l += `            $stmt->execute();\n`;
        l += `        } catch (PDOException $e){\n`;
        l += `            echo "Erreur lors de la suppression des données : " . $e->getMessage();\n`;
        l += `        }\n`;
        l += `    }\n`;
        l += `}\n`;
    }

    return l;
}