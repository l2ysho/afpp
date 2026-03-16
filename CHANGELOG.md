## [2.5.2](https://github.com/l2ysho/afpp/compare/v2.5.1...v2.5.2) (2026-03-16)

### Bug Fixes

- manual patch release [skip ci] ([729a147](https://github.com/l2ysho/afpp/commit/729a1474ac8054233f22e5ab0f3a8f170071d7ca))

## [2.5.1](https://github.com/l2ysho/afpp/compare/v2.5.0...v2.5.1) (2026-03-04)

### Bug Fixes

- import PDFPageProxy from api.d.ts instead of removed web/interfaces ([f939179](https://github.com/l2ysho/afpp/commit/f93917971a781b6ab69f5cd364ce02e26d8f31c7))
- **tests:** add missing test coverage for validation and edge cases ([220f6b3](https://github.com/l2ysho/afpp/commit/220f6b3adbbb22dbd2363a74bbea0cb2d94c70f9))

# [2.5.0](https://github.com/l2ysho/afpp/compare/v2.4.4...v2.5.0) (2026-02-24)

### Features

- **pdf-metadata:** add api to extract pdf metadata ([0c8166a](https://github.com/l2ysho/afpp/commit/0c8166abf956b1e38d15dbf0b8196e7385e38e65))

## [2.4.4](https://github.com/l2ysho/afpp/compare/v2.4.3...v2.4.4) (2026-02-24)

### Performance Improvements

- **canvas:** implement canvas pooling ([15b31c9](https://github.com/l2ysho/afpp/commit/15b31c93959614c513dfa53faef190cbe89648e4))

## [2.4.3](https://github.com/l2ysho/afpp/compare/v2.4.2...v2.4.3) (2026-02-16)

### Bug Fixes

- **api:** make parsePdf options parameter optional ([485d83d](https://github.com/l2ysho/afpp/commit/485d83d29f2b2d7563308ef75622b01f95769a96))
- **core:** add page-level cleanup to prevent memory accumulation ([e9bf643](https://github.com/l2ysho/afpp/commit/e9bf6433400455fea2c657302f1ded73fbb66a9c))

### Performance Improvements

- **core:** fix O(n^2) text extraction and deduplicate logic ([e32065d](https://github.com/l2ysho/afpp/commit/e32065db3f0163ea146ee3b372f3ad29f945809b))

## [2.4.2](https://github.com/l2ysho/afpp/compare/v2.4.1...v2.4.2) (2026-02-16)

### Bug Fixes

- **core:** add scale parameter validation ([4b5ac3e](https://github.com/l2ysho/afpp/commit/4b5ac3e1f936dc2f4d6af08586c0ff8df1ece3be))

## [2.4.1](https://github.com/l2ysho/afpp/compare/v2.4.0...v2.4.1) (2026-02-16)

### Bug Fixes

- **core:** add concurrency parameter validation ([4bb46c4](https://github.com/l2ysho/afpp/commit/4bb46c4fbf154a38e8954ad77df593621d935b5a))

# [2.4.0](https://github.com/l2ysho/afpp/compare/v2.3.0...v2.4.0) (2026-02-01)

### Features

- adds auto concurrency to afpp ([15efa38](https://github.com/l2ysho/afpp/commit/15efa388701fbc885f7174920a249cc98dfa53b2))

# [2.3.0](https://github.com/l2ysho/afpp/compare/v2.2.1...v2.3.0) (2026-02-01)

### Features

- adds streaming PDF parsing ([3fd2c95](https://github.com/l2ysho/afpp/commit/3fd2c95e9692c7a8aa7471b8848cf61aae15d7d3))
- **benchmark:** adds benchmark infrastructure ([dd116dd](https://github.com/l2ysho/afpp/commit/dd116dd08b7a40a9d5176ddf2ae4abc82f4d89ff))
- **benchmark:** adds benchmarking framework ([cb68355](https://github.com/l2ysho/afpp/commit/cb68355bfe795dfac2dcdabf76c0446354eea25d))
- **benchmark:** adds docker memory tracking ([308758b](https://github.com/l2ysho/afpp/commit/308758b41386c7a756b980db7349c1dec9a20fbd))
- **benchmark:** improves benchmark accuracy ([9849527](https://github.com/l2ysho/afpp/commit/9849527a7befb87076fa6ae587550415607cbd7a))

### Performance Improvements

- **benchmark:** improves benchmark accuracy ([87bdb27](https://github.com/l2ysho/afpp/commit/87bdb27dc82d79dc61c4af13d5870c9ae2a8c758))
- optimizes local file processing ([461f9ec](https://github.com/l2ysho/afpp/commit/461f9ec7132861fa0f9554127275ce5e913501b0))

## [2.2.1](https://github.com/l2ysho/afpp/compare/v2.2.0...v2.2.1) (2026-01-25)

### Performance Improvements

- **render:** reduces default render scale ([45763d9](https://github.com/l2ysho/afpp/commit/45763d923cb9d7b9e24269cc20f2b444f6f876e4))

# [2.2.0](https://github.com/l2ysho/afpp/compare/v2.1.7...v2.2.0) (2026-01-24)

### Bug Fixes

- upgrade pdfjs-dist from 5.4.449 to 5.4.530 ([9107952](https://github.com/l2ysho/afpp/commit/91079529f13a919f966739219b8c3d984ef8c5b7))

### Features

- adds examples and tooling ([34dd383](https://github.com/l2ysho/afpp/commit/34dd38342c82b81eea17104963d2755965ba5bd2))

## [2.1.7](https://github.com/l2ysho/afpp/compare/v2.1.6...v2.1.7) (2026-01-17)

### Bug Fixes

- add CONTRIBUTING.md ([238ee6f](https://github.com/l2ysho/afpp/commit/238ee6f46d7297b54982de0c38bba057089d3820))

---

> **Note:** This changelog begins at v2.1.7. For earlier release history, see the [GitHub Releases page](https://github.com/l2ysho/afpp/releases).
