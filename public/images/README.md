# Images Directory

Add your blog and project images here. They will be accessible at `/images/filename.ext` in your app.

## Supported formats:
- `.jpg`, `.jpeg` - JPEG images
- `.png` - PNG images with transparency
- `.webp` - Modern compressed format
- `.svg` - Vector graphics
- `.gif` - Animated images

## Usage in pages:

### In Blog Posts (as markdown):
```markdown
![Alt text](/images/my-image.jpg)
```

### In React Components:
```tsx
import Image from 'next/image';

<Image 
  src="/images/my-image.jpg" 
  alt="Description" 
  width={800} 
  height={600}
/>
```

### In HTML:
```html
<img src="/images/my-image.jpg" alt="Description" />
```

## Tips:
1. Keep image filenames lowercase and use hyphens (e.g., `my-blog-image.jpg`)
2. Optimize images before uploading to keep load times fast
3. Use descriptive alt text for accessibility
4. Recommended max file size: 1-2 MB per image
