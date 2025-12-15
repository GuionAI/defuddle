# Turndown Workers Compatibility

This document explains how we made Turndown work in Cloudflare Workers and other edge runtimes without a global `document`.

## The Problem

Turndown accepts two types of input:

```typescript
turndown(input: string | HTMLElement): string
```

When you pass an **HTML string**, Turndown needs to parse it into DOM nodes. It does this using `document.implementation.createHTMLDocument()` in browsers or the `domino` library in Node.js.

In Cloudflare Workers and edge runtimes:
- There's no global `document`
- The `domino` library isn't available
- Turndown throws: `ReferenceError: document is not defined`

## The Solution

Looking at Turndown's source code (`root-node.js`):

```js
if (typeof input === 'string') {
  // Needs document to parse HTML string
  var doc = htmlParser().parseFromString(...)
} else {
  // Just clones the node - no document needed!
  root = input.cloneNode(true)
}
```

**When you pass a DOM node instead of a string, Turndown just clones it without needing `document`.**

## Our Implementation

In `markdown.ts`, we create a container element using the linkedom document and pass that to Turndown:

```typescript
export function createMarkdownContent(content: string, doc: Document) {
  const turndownService = new TurndownService({ ... });

  // Create a DOM node from the HTML string using linkedom's document
  const container = doc.createElement('div');
  container.innerHTML = content;

  // Pass DOM node instead of string - Turndown will just clone it
  let markdown = turndownService.turndown(container);

  return markdown;
}
```

## Flow

```
1. linkedom parseHTML(fullPageHtml)
   └── Creates document object

2. Defuddle extracts article content
   └── Returns HTML string

3. doc.createElement('div') + innerHTML
   └── Uses linkedom's document to parse HTML into DOM nodes

4. turndownService.turndown(container)
   └── Receives DOM node, just clones it
   └── No global document needed!
```

## Why This Works

- linkedom's `document` object is available (we created it with `parseHTML`)
- We use that document to convert our HTML string back into DOM nodes
- Turndown receives a DOM node and simply clones it
- The HTML parsing happens through linkedom, not Turndown's internal parser

## Related Files

- `src/markdown.ts` - Markdown conversion with the fix
- `src/defuddle.ts` - Passes document to `createMarkdownContent`
