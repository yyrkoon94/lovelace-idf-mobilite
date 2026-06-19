#!/usr/bin/env python3
"""Synchronisation du référentiel IDFM des lignes.

Télécharge le dataset officiel IDFM "référentiel-des-lignes",
filtre les lignes actives, extrait uniquement les champs utiles
et génère un fichier JavaScript minimaliste contenant une fonction
`idfMobiliteLineRef()` retournant la liste des lignes.

Compatible Ruff (D100, D103).
"""

print("DEBUG: script lancé")
import argparse
import json
import requests


REFERENTIEL_URL = (
    "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/referentiel-des-lignes/exports/json"
)


def download_referentiel():
    """Télécharge le référentiel IDFM des lignes.

    Returns:
        list: Liste brute des objets JSON représentant les lignes.
    """
    response = requests.get(REFERENTIEL_URL, timeout=10)
    response.raise_for_status()
    return response.json()


def simplify_line(item):
    """Extrait uniquement les champs nécessaires pour la carte.

    Args:
        item (dict): Ligne brute issue du référentiel IDFM.

    Returns:
        dict: Ligne simplifiée contenant uniquement les champs utiles.
    """
    return {
        "id_line": item.get("id_line"),
        "name_line": item.get("name_line"),
        "shortname_line": item.get("shortname_line"),
        "transportmode": item.get("transportmode"),
        "transportsubmode": item.get("transportsubmode"),
    }


def generate_js(lines, output_path):
    """Génère le fichier JavaScript contenant la fonction idfMobiliteLineRef().

    Args:
        lines (list): Liste des lignes simplifiées.
        output_path (str): Chemin du fichier JS à écrire.
    """
    js = "export function idfMobiliteLineRef() {\n  return "
    js += json.dumps(lines, indent=2, ensure_ascii=False)
    js += "\n}"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(js)


def main(output_js, raw_json=None):
    """Point d'entrée principal : télécharge, filtre, simplifie et génère le JS.

    Args:
        output_js (str): Chemin du fichier JS généré.
        raw_json (str | None): Chemin optionnel pour sauvegarder le JSON brut.
    """
    data = download_referentiel()

    if raw_json:
        with open(raw_json, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    active = [l for l in data if l.get("status") == "active"]
    active_sorted = sorted(active, key=lambda x: x["id_line"])

    simplified = [simplify_line(l) for l in active_sorted]

    generate_js(simplified, output_js)

    print(f"✔ Référentiel généré : {output_js}")
    print(f"✔ {len(simplified)} lignes actives traitées")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Synchronise le référentiel IDFM des lignes.")
    parser.add_argument("-o", "--output-js", required=True)
    parser.add_argument("-r", "--raw-json", required=False)
    args = parser.parse_args()

    main(args.output_js, args.raw_json)
