import { Champ, MethodesCRUD } from '../editeur_classe';

function maj(mot: string): string {
    return mot.charAt(0).toUpperCase() + mot.slice(1);
}

function nomTable(classe: string): string {
    return classe.toLowerCase() + "s";
}

function caraCSharp(attribut: string, type: string, i: number): string {
    switch (i) {
        case 1: return `this.${attribut}`;
        case 2: return maj(attribut);
        case 3: return `this.${attribut} = _${attribut};`;
        case 4: return `public ${type} Get${maj(attribut)}() { return this.${attribut}; }`;
        case 5: return `public void Set${maj(attribut)}(${type} _${attribut}) { ${caraCSharp(attribut, type, 3)} }`;
        case 6: return `reader["${attribut}"].ToString()`;
        case 7:
            switch (type) {
                case 'int': return `reader.GetInt32("${attribut}")`;
                case 'float': return `reader.GetFloat("${attribut}")`;
                case 'bool': return `reader.GetBoolean("${attribut}")`;
                default: return `reader.GetString("${attribut}")`;
            }
        case 8: return `this.Set${maj(attribut)}(${caraCSharp(attribut, type, 7)});`;
        case 9: return `@${attribut}`;
        case 10: return `stmt.Parameters.AddWithValue("@${attribut}", ${caraCSharp(attribut, type, 1)});`;
        case 11: return `reader.Get${type === 'int' ? 'Int32' : type === 'float' ? 'Float' : type === 'bool' ? 'Boolean' : 'String'}("${attribut}")`;
        default: return '';
    }
}

export default function generationCSharp(classe: string, champs: Champ[], operations: MethodesCRUD): string {
    const nomClasse = maj(classe);
    const table = nomTable(classe);
    const champsValides = champs.filter(c => c.attribut && c.type);
    const premier = champsValides[0];
    const columns = champsValides.map(c => c.attribut).join(', ');
    const values = champsValides.map(c => caraCSharp(c.attribut, '', 9)).join(', ');

    let l = `public class ${nomClasse}\n    {\n`;

    // ATTRIBUTS
    champsValides.forEach(({ attribut, type }) => {
        l += `        private ${type} ${attribut};\n`;
    });

    l += `\n        public ${nomClasse}() {}\n\n`;

    // CONSTRUCTEUR
    const params = champsValides.map(c => `${c.type} _${c.attribut}`).join(', ');
    l += `        public ${nomClasse}(${params})\n        {\n`;
    champsValides.forEach(({ attribut }) => {
        l += `            ${caraCSharp(attribut, '', 3)}\n`;
    });
    l += `        }\n\n`;

    // GETTERS
    champsValides.forEach(({ attribut, type }) => {
        l += `        ${caraCSharp(attribut, type, 4)}\n`;
    });

    l += `\n`;

    // SETTERS
    champsValides.forEach(({ attribut, type }) => {
        l += `        ${caraCSharp(attribut, type, 5)}\n`;
    });
    
    l += `\n`;

    // CRUD
    if (operations.Create) {
        l += `        public void Create()\n        {\n`;
        l += `            string req_MaxId = "SELECT MAX(${premier.attribut}) FROM ${table}";\n`;
        l += `            Global.conn.Open();\n`;
        l += `            MySqlCommand stmt_maxId = new MySqlCommand(req_MaxId, Global.conn);\n\n`;
        l += `            using (MySqlDataReader reader = stmt_maxId.ExecuteReader())\n`;
        l += `            {\n`;
        l += `                try\n`;
        l += `                {\n`;
        l += `                    reader.Read();\n`;
        l += `                    this.Set${maj(premier.attribut)}(int.Parse(reader["MAX(${premier.attribut})"].ToString()) + 1);\n`;
        l += `                }\n`;
        l += `                catch (Exception) { }\n`;
        l += `            }\n`;
        l += `            Global.conn.Close();\n\n`;



        l += `            string req = "INSERT INTO ${table} (${columns}) VALUES (${values})";\n`;
        l += `            MySqlCommand stmt = new MySqlCommand(req, Global.conn);\n`;
        champsValides.forEach(({ attribut }) => {
            l += `            stmt.Parameters.AddWithValue("@${attribut}", ${caraCSharp(attribut, '', 1)});\n`;
        });
        l += `            Global.conn.Open();\n`;
        l += `            stmt.ExecuteNonQuery();\n`;
        l += `            Global.conn.Close();\n`;
        l += `        }\n\n`;
    }



    if (operations.Read) {
        l += `        public void Read(${premier.type} _${premier.attribut})\n        {\n`;
        l += `            try\n            {\n`;
        l += `                string req = "SELECT * FROM ${table} WHERE ${premier.attribut} = @${premier.attribut}";\n`;
        l += `                MySqlCommand stmt = new MySqlCommand(req, Global.conn);\n`;
        l += `                stmt.Parameters.AddWithValue("@${premier.attribut}", _${premier.attribut});\n`;
        l += `                Global.conn.Open();\n`;
        l += `                using (MySqlDataReader reader = stmt.ExecuteReader())\n                {\n`;
        l += `                    if (reader.Read())\n                    {\n`;
        champsValides.forEach(({ attribut, type }) => {
            l += `                        this.Set${maj(attribut)}(${caraCSharp(attribut, type, 11)});\n`;
        });
        l += `                    }\n                }\n`;
        l += `                Global.conn.Close();\n`;
        l += `            }\n            catch (Exception) { }\n`;
        l += `        }\n\n`;
    }

    if (operations.Update) {
        const set = champsValides.slice(1).map(c => `${c.attribut} = @${c.attribut}`).join(', ');
        l += `        public void Update${nomClasse}()\n        {\n`;
        l += `            try\n            {\n`;
        l += `                string req = "UPDATE ${table} SET ${set} WHERE ${premier.attribut} = @${premier.attribut}";\n`;
        l += `                MySqlCommand stmt = new MySqlCommand(req, Global.conn);\n`;
        champsValides.forEach(({ attribut }) => {
            l += `                stmt.Parameters.AddWithValue("@${attribut}", ${caraCSharp(attribut, '', 1)});\n`;
        });
        l += `                Global.conn.Open();\n`;
        l += `                stmt.ExecuteNonQuery();\n`;
        l += `                Global.conn.Close();\n`;
        l += `            }\n            catch (Exception) { }\n`;
        l += `        }\n\n`;
    }

    if (operations.Delete) {
        l += `        public void Delete${nomClasse}()\n        {\n`;
        l += `            try\n            {\n`;
        l += `                string req = "DELETE FROM ${table} WHERE ${premier.attribut} = @${premier.attribut}";\n`;
        l += `                MySqlCommand stmt = new MySqlCommand(req, Global.conn);\n`;
        l += `                stmt.Parameters.AddWithValue("@${premier.attribut}", ${caraCSharp(premier.attribut, '', 1)});\n`;
        l += `                Global.conn.Open();\n`;
        l += `                stmt.ExecuteNonQuery();\n`;
        l += `                Global.conn.Close();\n`;
        l += `            }\n            catch (Exception) { }\n`;
        l += `        }\n\n`;
    }

    if (operations.FindAll) {
        l += `        public static List<${nomClasse}> FindAll()\n        {\n`;
        l += `            try\n            {\n`;
        l += `                List<${nomClasse}> liste = new List<${nomClasse}>();\n`;
        l += `                string req = "SELECT * FROM ${table}";\n`;
        l += `                MySqlCommand stmt = new MySqlCommand(req, Global.conn);\n`;
        l += `                Global.conn.Open();\n`;
        l += `                using (MySqlDataReader reader = stmt.ExecuteReader())\n                {\n`;
        l += `                    while (reader.Read())\n                    {\n`;
        l += `                        ${nomClasse} obj = new ${nomClasse}(\n`;
        const constructorArgs = champsValides.map(c => caraCSharp(c.attribut, c.type, 11)).join(',\n                            ');
        l += `                            ${constructorArgs}\n                        );\n`;
        l += `                        liste.Add(obj);\n`;
        l += `                    }\n                }\n`;
        l += `                Global.conn.Close();\n`;
        l += `                return liste;\n`;
        l += `            }\n            catch (Exception)\n            {\n`;
        l += `                return new List<${nomClasse}>();\n`;
        l += `            }\n        }\n`;
    }

    l += `    }\n`;

    return l;
}
