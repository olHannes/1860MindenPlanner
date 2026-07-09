import json
from pathlib import Path

APPARATUS = "Vault"
FILE_NAME = "VA_Elements.json"


INPUT_FILE = Path(f"frontend/assets/images/Exercises/Device/{APPARATUS}/{FILE_NAME}")
OUTPUT_FILE = Path(f"frontend/assets/images/Exercises/Device/{APPARATUS}/test.json")
OUTPUT_FILE = INPUT_FILE

CODE_VARIANTS = [
    {"code": "FIG_MAG_2022_2024"},
    {"code": "FIG_MAG_2025_2028"},
]


def transform_item(item: dict) -> dict:
    return {
        "id": item.get("id", ""),
        "bezeichnung": item.get("bezeichnung", ""),
        "name": item.get("name", ""),
        "dismount": item.get("dismount", False),
        "defaults": {
            "elementegruppe": item.get("elementegruppe", ""),
            "wertigkeit": item.get("wertigkeit", ""),
            "image_path": item.get("image_path", ""),
        },
        "code_variants": CODE_VARIANTS,
    }


def main():
    print(f"Aktueller Ausführ-Pfad: {Path.cwd()}")
    print(f"Input-Datei erwartet unter: {(Path.cwd() / INPUT_FILE).resolve()}")
    print()

    with INPUT_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list):
        raise ValueError("Die JSON-Datei muss ein Array als oberste Struktur enthalten.")

    transformed_data = [transform_item(item) for item in data]

    with OUTPUT_FILE.open("w", encoding="utf-8") as file:
        json.dump(transformed_data, file, ensure_ascii=False, indent=4)

    print(f"{len(transformed_data)} Elemente wurden transformiert.")
    print(f"Ausgabe gespeichert in: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()