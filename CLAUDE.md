# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Defuddle

Defuddle is a web content extraction library that removes clutter (ads, sidebars, footers) from web pages to extract the main article content. It's designed as an alternative to Mozilla Readability, with more forgiving extraction and better handling of math, code blocks, and footnotes.

## Commands

```bash
npm install           # Install dependencies
npm run build         # Clean + build types + webpack
npm run dev           # Watch mode for development
npm test              # Run vitest tests (uses linkedom)
npm run playground    # Start local playground server
```

## Build System

Two separate build outputs via webpack:
- `dist/index.js` - Core browser bundle (no dependencies)
- `dist/index.full.js` - Full bundle with math libraries (mathml-to-latex, temml)

Entry points: `src/index.ts`, `src/index.full.ts`

## Architecture

### Main Flow

1. `Defuddle` class (`src/defuddle.ts`) - Main entry point
   - Checks for site-specific extractor first
   - Falls back to generic content extraction using content scoring

2. `ExtractorRegistry` (`src/extractor-registry.ts`) - Routes URLs to site-specific extractors
   - Extractors in `src/extractors/` handle sites like Reddit, Twitter, YouTube, GitHub, ChatGPT, Claude, etc.
   - Each extractor extends `BaseExtractor` and implements `canExtract()` and `extract()`

3. `ContentScorer` (`src/scoring.ts`) - Scores DOM elements to find main content

4. `standardizeContent()` (`src/standardize.ts`) - Normalizes HTML output (headings, code blocks, footnotes, math)

### Element Handlers

`src/elements/` contains specialized handlers:
- `code.ts` - Code block standardization
- `footnotes.ts` - Footnote normalization
- `headings.ts` - Heading cleanup
- `math.ts` / `math.core.ts` / `math.full.ts` - MathML/LaTeX handling (core vs full bundle)

### Adding a New Site Extractor

1. Create `src/extractors/yoursite.ts` extending `BaseExtractor`
2. Implement `canExtract()` and `extract()` methods
3. Register in `src/extractor-registry.ts` with URL patterns

## Testing

Tests use vitest with fixture-based testing (linkedom for DOM):
- HTML fixtures go in `tests/fixtures/`
- Expected outputs (markdown with JSON metadata preamble) in `tests/expected/`
- Run `npm test` to create baseline expected results for new fixtures
- Delete expected file and re-run to update baselines

## linkedom Compatibility

This fork is optimized for linkedom (lightweight DOM for Cloudflare Workers, edge runtimes).
See `LINKEDOM_COMPAT.md` for details on removed browser APIs and their impact.
