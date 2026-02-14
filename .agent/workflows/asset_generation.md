---
description: Steps for generating new images and converting them to WebP
---

# Asset Generation Workflow

Follow these steps when generating new image assets (e.g., hero images for blog posts) to ensure they meet the project's quality and performance standards.

## 1. Generate Image
Use the `generate_image` tool to create the desired image. Save it with a descriptive name.

## 2. Convert to WebP
Run the following command to convert the generated PNG to the WebP format.

// turbo
```bash
npx -y cwebp-bin -q 80 [input_file].png -o [output_file].webp
```

## 3. Update Registry
Ensure the `heroImage` field in `src/content/articles/articleRegistry.ts` points to the new `.webp` file.

## 4. Cleanup
Delete the original PNG file to keep the repository clean.

// turbo
```bash
rm [input_file].png
```
