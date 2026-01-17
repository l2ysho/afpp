afpp Design & Architecture

This document explains the architectural decisions behind afpp, the Async Fast PDF Parser for Node.js. It is intended for contributors, reviewers, and engineers evaluating the project.

⸻

Design Goals 1. Minimal dependencies
• Avoid large, transitive dependencies and native build steps. 2. Predictable, non-blocking behavior
• Fully asynchronous page processing without event-loop blocking. 3. Cross-platform compatibility
• Works consistently on all supported Node.js environments without OS-level setup. 4. Production-ready defaults
• Reasonable concurrency, memory usage, and error handling. 5. TypeScript-first API
• Strong typing and developer ergonomics.

⸻

Avoiding Native Dependencies

Many Node.js PDF solutions depend on native build steps or external system binaries (such as canvas, ImageMagick, or Ghostscript). These introduce:
• Installation complexity (C/C++ compilation, OS libraries)
• CI/CD instability
• OS-specific behavior
• Runtime failures in restricted or containerized environments

afpp deliberately avoids these dependencies, relying solely on pure JavaScript/Node.js solutions to:
• Keep installation simple
• Maintain predictable behavior across environments
• Ensure compatibility with modern Node.js versions (>=22.14.0)

⸻

Parsing Architecture

Input Types

afpp functions accept:
• Local file paths (string)
• Buffers (Buffer)
• URLs (URL)

This uniform API reduces complexity and supports asynchronous workflows.

Concurrency Model
• Page processing is configurable via the concurrency option.
• Default concurrency is 1 for minimal memory usage.
• Higher concurrency improves performance on large PDFs but increases memory usage proportionally.

Text vs. Image Extraction
• Text is extracted directly from the PDF object model.
• Non-text content (images or complex layouts) is rendered internally using Node.js-native APIs, without any external binaries.
• Image encoding is configurable (png, jpeg, webp, avif) for flexible output.

Encrypted PDFs
• Supports password-protected PDFs
• Parsing automatically detects encryption and applies the provided password
• No external tools required

⸻

Error Handling & Fail-Fast Philosophy
• Explicit errors for invalid input, unsupported formats, or failed parsing
• Avoids silent failures or corrupted output
• Provides consistent exceptions across all supported Node.js environments

⸻

Trade-offs & Constraints
• Pure JS parsing limits some low-level rendering optimizations available in native pipelines
• Memory usage is linear with concurrency and scale; high-resolution images can be heavy
• Node.js >=22 is required to leverage modern Buffer, stream, and fetch APIs

⸻

Summary

afpp is a dependency-light, asynchronous, TypeScript-first PDF parser. Key differentiators include:
• No native build steps or system binaries
• Consistent cross-platform behavior
• Configurable concurrency and image rendering
• First-class TypeScript support

All design choices aim to provide predictable, production-ready parsing for Node.js projects without operational headaches.
