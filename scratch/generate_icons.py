from PIL import Image
import os

source_path = r'C:\Users\Mani\.gemini\antigravity\brain\c50ea5e9-a94c-4838-bb05-d8b4c0cb6db8\board_app_logo_1776701178401.png'
public_dir = r'c:\Users\Mani\Desktop\Board\public'

if not os.path.exists(public_dir):
    os.makedirs(public_dir)

img = Image.open(source_path)

# Icons sizes
sizes = [192, 512]
for size in sizes:
    resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
    resized_img.save(os.path.join(public_dir, f'icon-{size}.png'))
    print(f'Created icon-{size}.png')

# Maskable icon (padding)
maskable_size = 512
maskable_img = Image.new('RGB', (maskable_size, maskable_size), (13, 13, 15)) # #0D0D0F
# Resize original to ~80% of maskable area
inner_size = int(maskable_size * 0.8)
inner_img = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
offset = (maskable_size - inner_size) // 2
maskable_img.paste(inner_img, (offset, offset))
maskable_img.save(os.path.join(public_dir, 'maskable-icon.png'))
print('Created maskable-icon.png')

# Favicon
favicon = img.resize((32, 32), Image.Resampling.LANCZOS)
favicon.save(os.path.join(public_dir, 'favicon.ico'))
print('Created favicon.ico')

# Also save an SVG version (basic representation)
svg_content = """<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="128" fill="#0D0D0F"/>
  <rect x="140" y="120" width="180" height="140" rx="20" fill="#818CF8"/>
  <rect x="180" y="240" width="180" height="140" rx="20" fill="#818CF8" fill-opacity="0.8"/>
  <rect x="170" y="160" width="120" height="15" rx="7.5" fill="white" fill-opacity="0.3"/>
  <rect x="170" y="200" width="80" height="15" rx="7.5" fill="white" fill-opacity="0.3"/>
</svg>"""
with open(os.path.join(public_dir, 'vnoted-icon.svg'), 'w') as f:
    f.write(svg_content)
print('Created vnoted-icon.svg')
