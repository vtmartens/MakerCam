# Contributing to MakerCam

Thanks for your interest in MakerCam. This project is a modern port of
PartKam/MakerCam, and contributions that improve correctness, safety, and
usability are welcome.

## Code of conduct

By participating in this project, you agree to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting security issues

Do not report security vulnerabilities in public issues. See
[SECURITY.md](SECURITY.md) for the private reporting process.

## Before you start

- Open an issue before starting a large change or a new feature so we can agree
  on the approach.
- Keep pull requests focused on one change.
- Reproduce bugs on the latest release or `main` before reporting them.

## Development setup

Requirements:

- Node.js 20.19+ or 22.12+ (Node 24 LTS recommended).
- .NET SDK 10 for the native Windows app.
- A modern browser for the web app.
- Windows is required to build and run the WPF app.

Install dependencies with a reproducible lockfile:

```bash
npm ci
```

### Web app

```bash
npm run dev       # build and serve at http://localhost:5173
npm test          # Vitest unit tests
npm run typecheck # TypeScript type checking
npm run build     # writes dist/app.js, dist/styles.css, dist/index.html
```

The repository ships a ready-to-open build in `dist/`. Commit the rebuilt `dist/`
files when a source change affects the bundle.

### Native Windows app

```bash
dotnet build dotnet/MakerCam.slnx
dotnet test dotnet/tests/MakerCam.Core.Tests/MakerCam.Core.Tests.csproj
dotnet run --project dotnet/src/MakerCam.App
```

The native core is tested against golden fixtures generated from the TypeScript
core. If you change CAM or G-code behavior, regenerate the fixtures and run both
test suites:

```bash
node dotnet/tools/oracle/oracle.mjs
dotnet test dotnet/tests/MakerCam.Core.Tests/MakerCam.Core.Tests.csproj
```

### Browser smoke checks

The `tools/browser_*.mjs` scripts use Playwright with an installed Chromium
browser. They launch Microsoft Edge by default; set `EDGE_PATH` or `CHROME_PATH`
to use another installation. Start the dev server first with `npm run dev`.

## Code guidelines

- Keep TypeScript type checking clean and avoid new dependencies unless they are
  necessary.
- Preserve byte-for-byte G-code and project-format parity between the TypeScript
  and C# implementations. The oracle tests exist for this.
- Add or update tests for behavior changes.
- Keep user-facing wording consistent between the web and native apps.
- Do not commit secrets, credentials, personal paths, or proprietary designs.
- Update documentation when behavior or command-line usage changes.

## CAM safety

MakerCam generates G-code for machines that can cause injury or damage. Always
verify toolpaths and G-code, simulate or air-cut first, and never run unverified
output on a real machine. Safety-critical bugs should be reported privately as
described in [SECURITY.md](SECURITY.md).

## Submitting a pull request

1. Fork the repository and create a focused branch.
2. Make the change and add tests.
3. Run the relevant checks listed above.
4. Open a pull request describing the problem, the change, and the testing you
   performed.
5. Link the related issue where possible.

By contributing, you agree that your contributions are licensed under the
project's [LGPL-3.0 license](LICENSE).
