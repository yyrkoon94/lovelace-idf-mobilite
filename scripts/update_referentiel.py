#!/usr/bin/python3
"""update_referentiel.py.

Outil de synchronisation du référentiel IDFM pour l’intégration Home Assistant.

Fonctionnalités :
-----------------
1. Télécharge le référentiel officiel des lignes IDFM (Open Data).
2. Génère un fichier JavaScript contenant les métadonnées des lignes.
3. Télécharge automatiquement les SVG des **bus de remplacement** depuis :
       https://departs.leon.gp/pictos/lines/{id_line}.svg
4. Trie les SVG téléchargés dans des sous‑répertoires par type :
       images/bus/, images/rail/, images/metro/, etc.
5. Conserve l’attribut "icon" dans le JSON pour toutes les lignes
   qui doivent avoir une icône (via __should_have_svg).

Important :
-----------
- Seuls les bus de remplacement téléchargent une icône externe.
- Toutes les autres icônes (métro, tram, bus, RER, train) restent locales.
- Le script ne supprime jamais les icônes existantes.

python3 update_referentiel.py --image-path ./images --output-js-filepath ./idf-lines.js
"""

import argparse
import json
import os
import requests
import tempfile
from tqdm import tqdm


# ============================================================
#  DATABASE SYNCHRONIZER (Téléchargement SVG + génération JS)
# ============================================================
class DatabaseSynchronizer:
    """Classe responsable.

    - du traitement du JSON IDFM
    - de la génération du fichier JS final
    - du téléchargement des SVG (uniquement bus de remplacement)
    """

    def __init__(self, input_json_filepath, image_path, output_js_filepath) -> None:
        """Parameters.

        input_json_filepath : str
            Chemin du fichier JSON IDFM téléchargé.
        image_path : str
            Dossier racine où stocker les SVG triés par type.
        output_js_filepath : str
            Chemin du fichier JS généré.
        """
        self.input_json_filepath = input_json_filepath
        self.image_path = image_path
        self.output_js_filepath = output_js_filepath

    # ------------------------------------------------------------
    def __download(self, url):
        """Télécharge un SVG via HTTP GET.

        Returns:
        -------
        str | None
            Le contenu SVG si valide, sinon None.
        """
        try:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "image/svg+xml,image/*;q=0.8,*/*;q=0.5",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                "Connection": "keep-alive",
            }

            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                text = r.text.strip()
                if text.startswith("<svg"):
                    return text

        except Exception as e:
            print("Error -", url, e)

        return None

    # ------------------------------------------------------------
    def __should_have_svg(self, fields):
        """Détermine si une ligne doit avoir un attribut "icon" dans le JSON.

        Cela n’implique PAS que l’icône sera téléchargée.
        Certaines icônes restent locales.

        Règles :
        - Bus : ROISSYBUS, ORLYBUS, TVM, nightBus, bus de remplacement
        - Rail : toutes sauf TER
        - Autres modes : toujours True
        """
        shortname_line = fields["shortname_line"]
        transportmode = fields["transportmode"]
        submode = fields.get("transportsubmode") or ""
        type_field = fields.get("type") or ""

        if transportmode == "bus":
            return (
                shortname_line in ["ROISSYBUS", "ORLYBUS", "TVM"]
                or submode == "nightBus"
                or type_field.startswith("REPLACEMENT")
            )

        if transportmode == "rail":
            return shortname_line != "TER"

        return True

    # ------------------------------------------------------------
    def __should_download_from_leon(self, fields):
        """Détermine si l’on doit télécharger l’icône depuis departs.leon.gp.

        Règle :
        - Uniquement les bus dont type commence par "REPLACEMENT".
        """
        return fields["transportmode"] == "bus" and (fields.get("type") or "").startswith("REPLACEMENT")

    # ------------------------------------------------------------
    def __folder_for_mode(self, transportmode):
        """Retourne le nom du dossier où stocker les SVG selon le mode."""
        mapping = {
            "bus": "bus",
            "rail": "rail",
            "metro": "metro",
            "tram": "tram",
            "funicular": "funicular",
            "coach": "coach",
        }
        return mapping.get(transportmode, "other")

    # ------------------------------------------------------------
    def __download_svg(self, id_line, transportmode, shortname_line):
        """Télécharge un SVG depuis departs.leon.gp et le stocke dans le bon dossier.

        Returns:
        -------
        str | None
            Chemin du fichier téléchargé ou None en cas d’échec.
        """
        url = f"https://departs.leon.gp/pictos/lines/{id_line}.svg"
        content = self.__download(url)

        if content is None:
            print(f"[SVG] Échec : {shortname_line} ({id_line}) => {url}")
            return None

        folder = self.__folder_for_mode(transportmode)
        folder_path = f"{self.image_path}/{folder}"
        os.makedirs(folder_path, exist_ok=True)

        file_path = f"{folder_path}/{shortname_line}.svg"

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)

        return file_path

    # ------------------------------------------------------------
    def __map_item(self, item):
        """Transforme une entrée du JSON IDFM en entrée du fichier JS final.

        Ajoute l’attribut "icon" si __should_have_svg() est vrai.
        """
        fields = item

        svg_path = None
        if self.__should_have_svg(fields):
            svg_path = fields.get("shortname_line") + ".svg"

        result = {
            "id_line": fields.get("id_line"),
            "name_line": fields.get("name_line"),
            "shortname_line": fields.get("shortname_line"),
            "transportmode": fields.get("transportmode"),
            "transportsubmode": fields.get("transportsubmode"),
            "type": fields.get("type"),
            "colourweb_hexa": fields.get("colourweb_hexa"),
            "textcolourweb_hexa": fields.get("textcolourweb_hexa"),
        }

        if svg_path:
            result["icon"] = svg_path

        return result

    # ------------------------------------------------------------
    def process(self):
        """Exécute le traitement complet.

        - lecture du JSON IDFM
        - filtrage des lignes actives
        - téléchargement des SVG (bus de remplacement)
        - génération du fichier JS final.
        """
        with open(self.input_json_filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        processed_data = []
        filtered_data = filter(lambda item: item.get("status") == "active", data)
        sorted_data = sorted(filtered_data, key=lambda x: x["id_line"])

        for item in tqdm(sorted_data, desc="Synchronizing..."):
            processed_item = self.__map_item(item)

            if self.__should_download_from_leon(item):
                self.__download_svg(item["id_line"], item["transportmode"], item["shortname_line"])

            processed_data.append(processed_item)

        js_data = json.dumps(processed_data, indent=2, ensure_ascii=False)
        js_function_call = f"export function idfMobiliteLineRef() {{\n  return {js_data}\n}}"

        with open(self.output_js_filepath, "w", encoding="utf-8") as f:
            f.write(js_function_call)

        return 0


# ============================================================
#  DATABASE DOWNLOADER (Open Data IDFM)
# ============================================================
class DatabaseDownloader:
    """Télécharge le JSON brut du référentiel IDFM."""

    DATABASE_URL = (
        "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/referentiel-des-lignes/exports/json"
    )

    def __init__(self, json_filepath) -> None:  # noqa: D107
        self.json_filepath = json_filepath

    def __download(self):
        """Télécharge le JSON IDFM.

        Returns:
        -------
        bytes | None
        """
        try:
            r = requests.get(DatabaseDownloader.DATABASE_URL, timeout=10)
            r.raise_for_status()
            return r.content
        except Exception as e:
            print("Failed to download:", e)
            return None

    def process(self):
        """Sauvegarde le JSON téléchargé dans un fichier local."""
        json_data = self.__download()
        if json_data is None:
            return 1

        try:
            data = json.loads(json_data)
            with open(self.json_filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
            print(f"JSON saved to '{self.json_filepath}'")
            return 0
        except Exception as e:
            print("Error:", e)
            return 1


# ============================================================
#  MAIN
# ============================================================
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Update local RATP/IDFM database")

    parser.add_argument("-m", "--image-path", type=str, help="Output path for download images", required=True)
    parser.add_argument("-o", "--output-js-filepath", type=str, help="Output file for JS content", required=True)
    parser.add_argument("-r", "--raw-database-path", type=str, help="Save optionally raw database file", default=None)

    args = parser.parse_args()

    if args.raw_database_path is None:
        with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
            json_path = tmp_file.name
    else:
        json_path = args.raw_database_path

    downloader = DatabaseDownloader(json_path)
    if downloader.process() == 0:
        synchronizer = DatabaseSynchronizer(json_path, args.image_path, args.output_js_filepath)
        status = synchronizer.process()
    else:
        status = 1

    if args.raw_database_path is None:
        try:
            os.remove(json_path)
        except OSError as e:
            print("An error occurred:", e)
            status = 1

    exit(status)
