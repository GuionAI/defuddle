# linkedom Compatibility Changes

This document describes changes made to make Defuddle compatible with [linkedom](https://github.com/WebReflection/linkedom), a lightweight DOM implementation.

## Background

linkedom is significantly lighter than JSDOM but intentionally doesn't implement certain browser APIs:

- **CSSOM**: `document.styleSheets`, `CSSMediaRule`, `CSSStyleRule`
- **Computed Styles**: `window.getComputedStyle()`
- **Layout**: `element.getBoundingClientRect()`

These APIs require a full CSS engine and layout calculation, which linkedom trades for performance.

## What Was Removed

### 1. Mobile Styles Detection (`_evaluateMediaQueries`, `applyMobileStyles`)

**Original purpose**: Parse `@media (max-width: ...)` rules to detect elements hidden on mobile view, assuming mobile-hidden elements are clutter (sidebars, ads, etc.).

**APIs used**: `document.styleSheets`, `CSSMediaRule`, `CSSStyleRule`

**Impact**: Minor. Clutter removal still works via:
- Selector-based removal (`EXACT_SELECTORS`, `PARTIAL_SELECTORS`)
- Content scoring by text/link density

### 2. Hidden Elements Removal (`removeHiddenElements`)

**Original purpose**: Remove elements with `display: none`, `visibility: hidden`, or `opacity: 0`.

**APIs used**: `window.getComputedStyle()`

**Impact**: Minimal. Hidden elements don't contribute visible text. The main content finder won't prioritize them anyway.

### 3. Small Image Detection (`findSmallImages`, `removeSmallImages`)

**Original purpose**: Remove tiny images (< 33px) like icons and avatars.

**APIs used**: `window.getComputedStyle()`, `element.getBoundingClientRect()`

**Impact**: None for LLM use. Use `removeImages: true` option to remove all images instead.

### 4. Computed Style in Table Layout Detection (`findTableBasedContent`)

**Original purpose**: Detect old table-based layouts by checking if tables have width > 400px via computed CSS.

**APIs used**: `window.getComputedStyle()`

**Change**: Now parses inline `style` attribute instead of computed styles.

**What still works**:
| Check | Status |
|-------|--------|
| `<table width="800">` | ✅ Works |
| `<table style="width: 800px">` | ✅ Works |
| `<table class="content">` | ✅ Works |
| `<table align="center">` | ✅ Works |
| External CSS: `table { width: 800px }` | ❌ Lost |

**Impact**: Very small. Only affects pages with:
- No semantic elements (`<article>`, `<main>`, etc.)
- Table width only in external CSS
- No "content"/"article" in class names

Even when missed, content is still extracted (as `<body>` with more clutter).

### 5. Block Element Detection in Standardization (`standardize.ts`)

**Original purpose**: Use `getComputedStyle().display === 'block'` for whitespace cleanup rules.

**APIs used**: `window.getComputedStyle()`

**Change**: Now uses a static set of known HTML block elements.

**Impact**: None. The static list covers all standard block elements.

### 6. Node.js Bundle Removed (`src/node.ts`)

**Original purpose**: Provide a JSDOM-based wrapper for Node.js environments.

**Why removed**: JSDOM doesn't work in Cloudflare Workers or similar edge runtimes. linkedom is the preferred DOM implementation for these environments.

**Change**: Use linkedom directly with the core Defuddle class.

## Summary

| Feature Removed | Impact for LLM Content Extraction |
|-----------------|-----------------------------------|
| Mobile styles detection | Minor - other clutter removal still works |
| Hidden elements removal | Minimal - hidden text is rare |
| Small image detection | None - use `removeImages: true` |
| External CSS table detection | Very small edge case |
| Computed block element check | None - static list works |
| Node.js/JSDOM bundle | None - use linkedom directly |

## Recommended Usage with linkedom

```typescript
import { parseHTML } from 'linkedom';
import Defuddle from 'defuddle';

const { document } = parseHTML(html);
const result = new Defuddle(document, {
  removeImages: true,  // Remove all images since small image detection is gone
  url: 'https://example.com/article'
}).parse();
```

## Cloudflare Workers Example

```typescript
import { parseHTML } from 'linkedom';
import Defuddle from 'defuddle';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response('Missing url parameter', { status: 400 });
    }

    const response = await fetch(url);
    const html = await response.text();
    const { document } = parseHTML(html);

    const result = new Defuddle(document, {
      removeImages: true,
      url
    }).parse();

    return Response.json(result);
  }
};
```
