# removeImages Option

The `removeImages: true` option removes visual media elements that are not useful for LLM processing or markdown output.

## What Gets Removed

| Element | Reason |
|---------|--------|
| `<img>` | Standard images |
| `<picture>` | Responsive image container |
| `<source>` | Media source elements |
| `<video>` | Video content |
| `<svg>` | Raw XML paths/coordinates are meaningless to LLMs |
| `<canvas>` | Content is JavaScript-rendered, tag itself is empty |
| `<figure>` | Only if empty or image-only after media removal |

## What Gets Preserved

`<figure>` elements are handled specially because they can contain non-image content:

- **Tables** - Data tables wrapped in figures
- **Code blocks** - `<pre>`, `<code>` elements
- **Math** - `<math>`, `.MathJax`, `.katex` elements
- **Substantial captions** - `<figcaption>` with >20 characters

This ensures academic content (ArXiv papers, technical docs) retains meaningful figures while removing decorative images.

## Usage

```typescript
import Defuddle from '@flicknote/defuddle';

const result = new Defuddle(document, {
  removeImages: true
}).parse();
```

## Why Remove These Elements?

For LLM processing pipelines:

1. **LLMs can't "see" images** - They only process text
2. **SVG is just XML** - Path data like `M10 10 L20 20` is meaningless
3. **Canvas is empty** - Actual content is drawn via JavaScript at runtime
4. **Markdown can't embed these** - No native support for SVG/canvas
5. **Reduces token usage** - Removes noise from the extracted content
