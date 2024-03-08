#!/usr/bin/python3

# python3 -m pip install selenium
# scripts/update_database.py -m dist/images -o dist/referentiel-des-lignes-filtered.js [ -r dist/referentiel-des-lignes.json ]

import argparse
import json
import os
import requests
import tempfile
import time

from tqdm import tqdm
from selenium import webdriver

class DatabaseSynchronizer:

    def __init__(self, input_json_filepath, image_path, output_js_filepath):
        self.input_json_filepath = input_json_filepath
        self.image_path = image_path
        self.output_js_filepath = output_js_filepath

    def __download(self, url):
        driver = webdriver.Chrome()
        try:
            driver.get(url)
            time.sleep(0.1)
            ret = driver.page_source
            driver.quit()
            return ret
        except Exception:
            print("Error - " + url)
        return None

    def __should_have_svg(self, fields):
        shortname_line = fields['shortname_line']
        transportmode = fields['transportmode']
        ret = False
        if (transportmode == "bus"):
            # download only night buses and 3 exceptions
            if (shortname_line in ['ROISSYBUS', 'ORLYBUS', 'TVM']) or \
               ('transportsubmode' in fields and fields['transportsubmode'] == 'nightBus'):
                ret = True
        elif transportmode == "rail":
            if shortname_line != 'TER':
                ret = True
        else:
            ret = True
        return ret
    
    def __download_svg(self, id_line, transportmode, shortname_line):
        output_file = None
        url = f"https://cachesync.prod.bonjour-ratp.fr/svg/LIG:IDFM:{id_line}.svg"
        content = self.__download(url)

        folder_path = f"{self.image_path}/{transportmode}"
        file_path = f"{folder_path}/{shortname_line}.svg"

        if (content == None or not content.startswith("<svg")):
            print(f"Download error: {shortname_line}({id_line} => {url})")
        else:
            if not os.path.isdir(folder_path):
                os.makedirs(folder_path)
            with open(file_path, 'w') as f:
                f.write(content)

        # return file path if the file exists
        if os.path.isfile(file_path):
            output_file = file_path
        return output_file

    def __map_item(self, item):
        fields = item
        svg_path = None
        if self.__should_have_svg(fields):
            svg_path = self.__download_svg(fields.get("id_line"), fields.get("transportmode"), fields.get("shortname_line"))
        
        result = {
            "id_line": fields.get("id_line"),
            "name_line": fields.get("name_line"),
            "shortname_line": fields.get("shortname_line"),
            "transportmode": fields.get("transportmode"),
            "transportsubmode": fields.get("transportsubmode"),
            "type": fields.get("type"),
            "operatorname": fields.get("operatorname"),
            "networkname": fields.get("networkname"),
            "colourweb_hexa": fields.get("colourweb_hexa"),
            "textcolourweb_hexa": fields.get("textcolourweb_hexa"),
        }
        
        if fields.get("picto"):
            result["picto"] = {
                "id": fields["picto"]["id"],
                "filename": fields["picto"]["filename"]
            }
        
        if svg_path:
            result["icon"] = f"{fields.get('shortname_line')}.svg"
        
        return result
    
    def process(self):
        with open(self.input_json_filepath, 'r') as f:
            data = json.load(f)
        processed_data = []
        filtered_data = filter(lambda item: item.get("status") == "active", data)
        sorted_data = sorted(filtered_data, key=lambda x: x["id_line"])
        for item in tqdm(sorted_data, desc = "Synchronizing..."):
            processed_item = self.__map_item(item)
            processed_data.append(processed_item)

        # Convert processed data to JavaScript function call format
        js_data = json.dumps(processed_data, indent=2, ensure_ascii=False)
        js_function_call = f"export function idfMobiliteLineRef() {{\n  return {js_data}\n}}"

        # Write to JavaScript file
        with open(self.output_js_filepath, "w", encoding="utf-8") as f:
            f.write(js_function_call)
        return 0


class DatabaseDownloader:
    DATABASE_URL = "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/referentiel-des-lignes/exports/json"

    def __init__(self, json_filepath):
        self.json_filepath = json_filepath

    def __download(self):
        try:
            response = requests.get(DatabaseDownloader.DATABASE_URL)
            response.raise_for_status()  # Raise an exception for HTTP errors (status codes other than 2xx)
            return response.content

        except requests.exceptions.RequestException as e:
            print("Failed to download the file:", e)
            return None

    def process(self):
        json_data = self.__download()

        try:
            # Parse JSON data
            data = json.loads(json_data)

            # Save JSON data to a file with proper indentation
            with open(self.json_filepath, 'w') as f:
                json.dump(data, f, indent=4)

            print(f"JSON data saved to '{self.json_filepath}' file.")
            return 0
        except (OSError, json.JSONDecodeError) as e:
            print(f"An error occurred: {e}")
            return 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Update local RATP database')

    # Add command-line arguments
    parser.add_argument('-m', '--image-path', type=str, help='Output path for download images', required=True)
    parser.add_argument('-o', '--output-js-filepath', type=str, help='Output file for JS content', required=True)
    parser.add_argument('-r', '--raw-database-path', type=str, help='Save optionally raw database file', default=None)

    # Parse the command-line arguments
    args = parser.parse_args()

    # Check if raw_database_path is None
    if args.raw_database_path is None:
        try:
            # Create a temporary file but don't delete it
            with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
                json_path = tmp_file.name
        except (OSError, ValueError) as e:
            print(f"An error occurred: {e}")
            exit(1)
    else:
        json_path = args.raw_database_path

    # Process with the existing raw database path
    downloader = DatabaseDownloader(json_path)
    if downloader.process() == 0:
        synchronizer = DatabaseSynchronizer(json_path, args.image_path, args.output_js_filepath)
        status = synchronizer.process()
        status = 0
    else:
        status = 1

    if args.raw_database_path is None:
        try:
            os.remove(json_path)
        except OSError as e:
            print(f"An error occurred: {e}")
            status = 1
    exit(status)