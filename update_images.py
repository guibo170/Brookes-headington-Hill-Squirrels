import os
import json
from pathlib import Path

IMAGE_DIR = Path("Apic")
OUTPUT_JSON = Path("images-manifest.json")
VALID_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg", ".webp"}

def scan_images():
    IMAGE_DIR.mkdir(exist_ok=True)
    image_list = []
    for file_path in sorted(IMAGE_DIR.iterdir()):
        if file_path.is_file() and file_path.suffix.lower() in VALID_EXTENSIONS:
            image_list.append({
                "filename": file_path.name,
                "path": f"Apic/{file_path.name}"
            })
    return image_list

def main():
    images = scan_images()
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(images, f, indent=4)
    print(f"Manifest updated with {len(images)} images.")

if __name__ == "__main__":
    main()
