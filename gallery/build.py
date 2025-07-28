import os
import json

# Path to the images directory (relative to this script)
image_dir = os.path.join(os.path.dirname(__file__), 'images')
output_file = os.path.join(os.path.dirname(__file__), 'images.json')

# Allowed image extensions
allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

# List all files in the directory
image_files = [
    f for f in os.listdir(image_dir)
    if os.path.isfile(os.path.join(image_dir, f)) and os.path.splitext(f)[1].lower() in allowed_extensions
]

# Write to images.json
with open(output_file, 'w') as f:
    json.dump(image_files, f, indent=2)

print(f'✅ Generated images.json with {len(image_files)} entries.')