import os
from PIL import Image
import argparse

def create_output_directory(output_path):
    """Create output directory if it doesn't exist"""
    if not os.path.exists(output_path):
        os.makedirs(output_path)

def resize_image(image, size):
    """Resize image maintaining aspect ratio with padding if necessary"""
    img_copy = image.copy()
    
    # Convert to RGBA if not already
    if img_copy.mode != 'RGBA':
        img_copy = img_copy.convert('RGBA')
    
    # Calculate aspect ratios
    target_ratio = size[0] / size[1]
    img_ratio = img_copy.size[0] / img_copy.size[1]
    
    if img_ratio > target_ratio:
        # Image is wider than target
        new_height = int(size[0] / img_ratio)
        resized = img_copy.resize((size[0], new_height), Image.Resampling.LANCZOS)
        new_img = Image.new('RGBA', size, (0, 0, 0, 0))
        paste_pos = ((size[0] - size[0]) // 2, (size[1] - new_height) // 2)
    else:
        # Image is taller than target
        new_width = int(size[1] * img_ratio)
        resized = img_copy.resize((new_width, size[1]), Image.Resampling.LANCZOS)
        new_img = Image.new('RGBA', size, (0, 0, 0, 0))
        paste_pos = ((size[0] - new_width) // 2, (size[1] - size[1]) // 2)
    
    new_img.paste(resized, paste_pos)
    return new_img

def create_favicon(image, output_path):
    """Create ICO file with multiple sizes"""
    sizes = [(16, 16), (32, 32), (48, 48)]
    favicon_images = []
    
    for size in sizes:
        resized = resize_image(image, size)
        favicon_images.append(resized)
    
    favicon_path = os.path.join(output_path, 'favicon.ico')
    favicon_images[0].save(
        favicon_path,
        format='ICO',
        sizes=[(img.size) for img in favicon_images],
        append_images=favicon_images[1:]
    )
    print(f"Created favicon.ico with sizes {[size for size in sizes]}")

def create_platform_icons(image, output_path):
    """Create platform-specific icons"""
    icon_specs = {
        'apple-touch-icon': (180, 180),
        'android-chrome-192': (192, 192),
        'android-chrome-512': (512, 512),
        'mstile': (144, 144)
    }
    
    for name, size in icon_specs.items():
        resized = resize_image(image, size)
        icon_path = os.path.join(output_path, f'{name}.png')
        resized.save(icon_path, 'PNG')
        print(f"Created {name}.png ({size[0]}x{size[1]})")

def generate_icons(input_path, output_path):
    """Generate all required icons from input image"""
    try:
        # Open and validate input image
        with Image.open(input_path) as img:
            # Create output directory
            create_output_directory(output_path)
            
            # Generate favicon.ico
            create_favicon(img, output_path)
            
            # Generate platform-specific icons
            create_platform_icons(img, output_path)
            
        print(f"\nAll icons generated successfully in: {output_path}")
        
    except Exception as e:
        print(f"Error generating icons: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Generate various platform icons from an input image')
    parser.add_argument('input_image', help='Path to the input image')
    parser.add_argument('-o', '--output', default='icons',
                        help='Output directory path (default: icons)')
    
    args = parser.parse_args()
    
    generate_icons(args.input_image, args.output)

if __name__ == '__main__':
    main()