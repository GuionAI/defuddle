# @flicknote/defuddle

> de·​fud·dle /diˈfʌdl/ *transitive verb*
> to remove unnecessary elements from a web page, and make it easily readable.

A fork of [kepano/defuddle](https://github.com/kepano/defuddle) optimized for **linkedom** and **Cloudflare Workers**.

## Changes from upstream

- **Always outputs Markdown** (optimized for LLM consumption)
- Removed browser-specific APIs (`getComputedStyle`, `styleSheets`, `getBoundingClientRect`)
- Removed Node.js/JSDOM bundle - use linkedom instead
- Replaced webpack with esbuild for faster builds
- ESM-only output for modern runtimes

See [LINKEDOM_COMPAT.md](./LINKEDOM_COMPAT.md) for details on removed features and their impact.

## Installation

```bash
npm install @flicknote/defuddle linkedom turndown
```

### Peer Dependencies

| Package | Required | Purpose |
|---------|----------|---------|
| `linkedom` | Yes | DOM implementation for `Defuddle.parse()` |
| `turndown` | Yes | HTML to Markdown conversion |

## Usage

### Cloudflare Workers / Edge Runtimes (Recommended)

Use the static `Defuddle.parse()` method for the simplest API:

```typescript
import Defuddle from '@flicknote/defuddle';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response('Missing url parameter', { status: 400 });
    }

    const response = await fetch(url);
    const html = await response.text();

    // Simple! No need to manually parse HTML
    const result = Defuddle.parse(html, { removeImages: true, url });

    return Response.json(result);
  }
};
```

Or use the standalone `parse` function:

```typescript
import { parse } from '@flicknote/defuddle';

const result = parse(html, { removeImages: true, url });
```

### With Custom Document (JSDOM, Browser, etc.)

If you have your own Document instance:

```typescript
import Defuddle from '@flicknote/defuddle';

const result = new Defuddle(document, { url }).parse();
```

### Browser

```javascript
import Defuddle from '@flicknote/defuddle';

// Browser has native document
const result = new Defuddle(document).parse();
console.log(result.content);
console.log(result.title);
```

## Response

| Property | Type | Description |
|----------|------|-------------|
| `content` | string | Extracted content as Markdown |
| `title` | string | Title of the article |
| `author` | string | Author of the article |
| `description` | string | Description or summary |
| `domain` | string | Domain name |
| `favicon` | string | URL of the favicon |
| `image` | string | URL of the main image |
| `published` | string | Publication date |
| `site` | string | Name of the website |
| `wordCount` | number | Word count |
| `parseTime` | number | Parse time in milliseconds |
| `schemaOrgData` | object | Schema.org data |
| `metaTags` | object | Meta tags |

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `url` | string | | URL of the page being parsed |
| `debug` | boolean | false | Enable debug logging |
| `removeImages` | boolean | false | Remove all images |
| `removeExactSelectors` | boolean | true | Remove elements matching exact selectors |
| `removePartialSelectors` | boolean | true | Remove elements matching partial selectors |

## Bundles

Two bundles are available:

- **Core** (`@flicknote/defuddle`): Main bundle, no math library dependencies (~85KB)
- **Full** (`@flicknote/defuddle/full`): Includes math libraries for MathML/LaTeX conversion (~461KB)

## License

MIT
