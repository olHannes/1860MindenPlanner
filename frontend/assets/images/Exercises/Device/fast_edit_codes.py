import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SOURCE_DIR = BASE_DIR / "Vault"
TARGET_DIR = SOURCE_DIR
TARGET_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_CODES = ["FIG_MAG_2022_2024", "FIG_MAG_2025_2028"]

for json_file in SOURCE_DIR.glob("*.json"):
    print(json_file)
    with json_file.open("r", encoding="utf-8") as f:
        elements = json.load(f)

    migrated = []

    for element in elements:
        element = dict(element)

        if "valid_codes" not in element:
            element["valid_codes"] = DEFAULT_CODES.copy()

        if "code_overrides" in element and not element["code_overrides"]:
            element.pop("code_overrides")

        migrated.append(element)

    output_file = TARGET_DIR / "test.json"

    with output_file.open("w", encoding="utf-8") as f:
        json.dump(migrated, f, ensure_ascii=False, indent=4)

    print(f"Migriert: {json_file} -> {output_file}")