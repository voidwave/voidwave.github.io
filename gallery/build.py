import os
import json
from PIL import Image

script_dir = os.path.dirname(__file__)
image_dir = os.path.join(script_dir, 'images')
output_file = os.path.join(script_dir, 'images.json')
thumbnail_dir = os.path.join(script_dir, 'thumbnails')

# Create thumbnails directory if it doesn't exist
os.makedirs(thumbnail_dir, exist_ok=True)

# Allowed image extensions
allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

image_files = [
    f for f in os.listdir(image_dir)
    if os.path.isfile(os.path.join(image_dir, f)) and os.path.splitext(f)[1].lower() in allowed_extensions
]

# Generate thumbnails
for img_name in image_files:
    img_path = os.path.join(image_dir, img_name)
    thumb_path = os.path.join(thumbnail_dir, img_name)
    try:
        with Image.open(img_path) as img:
            img.thumbnail((640, 320), Image.LANCZOS)
            # Create a new image with exact size and black background
            thumb = Image.new('RGB', (640, 320), (0, 0, 0))
            # Center the thumbnail
            x = (640 - img.width) // 2
            y = (320 - img.height) // 2
            thumb.paste(img, (x, y))
            thumb.save(thumb_path)
    except Exception as e:
        print(f'Error creating thumbnail for {img_name}: {e}')

# Write to images.json
with open(output_file, 'w') as f:
    json.dump(image_files, f, indent=2)

print(f'✅ Generated images.json with {len(image_files)} entries.')
print(f'✅ Generated thumbnails in "{thumbnail_dir}".')