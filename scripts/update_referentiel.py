#!/usr/bin/python3

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
    def __init__(self, input_json_filepath, image_path, output_js_filepath):
        self.input_json_filepath = input_json_filepath
        self.image_path = image_path
        self.output_js_filepath = output_js_filepath

    # ------------------------------------------------------------
    #  Téléchargement SVG (remplace Selenium)
    # ------------------------------------------------------------
    def __download(self, url):
        try:
            headers = {
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                "Accept": "image/svg+xml,image/*;q=0.8,*/*;q=0.5",
                "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
                "Referer": "https://www.ratp.fr/",
                "Sec-Fetch-Dest": "image",
                "Sec-Fetch-Mode": "no-cors",
                "Sec-Fetch-Site": "cross-site",
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
    #  Déterminer si une ligne doit avoir un SVG
    # ------------------------------------------------------------
    def __should_have_svg(self, fields):
        shortname_line = fields["shortname_line"]
        transportmode = fields["transportmode"]

        if transportmode == "bus":
            return shortname_line in ["ROISSYBUS", "ORLYBUS", "TVM"] or fields.get("transportsubmode") == "nightBus"

        if transportmode == "rail":
            return shortname_line != "TER"

        return True

    # ------------------------------------------------------------
    #  Téléchargement du SVG RATP
    # ------------------------------------------------------------
    def __download_svg(self, id_line, transportmode, shortname_line):
        url = f"https://cachesync.prod.bonjour-ratp.fr/svg/LIG:IDFM:{id_line}.svg"
        content = self.__download(url)

        folder_path = f"{self.image_path}/{transportmode}"
        file_path = f"{folder_path}/{shortname_line}.svg"

        if content is None:
            print(f"Download error: {shortname_line} ({id_line} => {url})")
            return None

        os.makedirs(folder_path, exist_ok=True)

        with open(file_path, "w") as f:
            f.write(content)

        return file_path if os.path.isfile(file_path) else None

    # ------------------------------------------------------------
    #  Mapping d'une ligne
    # ------------------------------------------------------------
    def __map_item(self, item):
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
            result["icon"] = f"{fields.get('shortname_line')}.svg"

        return result

    # ------------------------------------------------------------
    #  Process complet
    # ------------------------------------------------------------
    def process(self):
        with open(self.input_json_filepath, "r") as f:
            data = json.load(f)

        processed_data = []
        filtered_data = filter(lambda item: item.get("status") == "active", data)
        sorted_data = sorted(filtered_data, key=lambda x: x["id_line"])

        for item in tqdm(sorted_data, desc="Synchronizing..."):
            processed_item = self.__map_item(item)
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
    DATABASE_URL = (
        "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/referentiel-des-lignes/exports/json"
    )

    def __init__(self, json_filepath):
        self.json_filepath = json_filepath

    def __download(self):
        try:
            r = requests.get(DatabaseDownloader.DATABASE_URL, timeout=10)
            r.raise_for_status()
            return r.content
        except Exception as e:
            print("Failed to download:", e)
            return None

    def process(self):
        json_data = self.__download()
        if json_data is None:
            return 1

        try:
            data = json.loads(json_data)
            with open(self.json_filepath, "w") as f:
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
    parser = argparse.ArgumentParser(description="Update local RATP database")

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
