# Security Policy

## Supported versions

Security fixes are applied to the latest release and the current `main` branch.
Please reproduce the issue on the latest version before reporting it.

## Reporting a vulnerability

Please do not open a public issue for a security vulnerability.

Preferred method:

1. Open the repository on GitHub.
2. Go to the **Security** tab.
3. Open **Advisories** and click **Report a vulnerability**.
4. Describe the issue privately.

If the **Report a vulnerability** button is not available, open a public issue
titled **Security contact request** with no sensitive details, and say that you
need a private channel. A maintainer will follow up.

Please include, where possible:

- The affected component: web app, native Windows app, installer, SVG/project
  import, or G-code generation.
- The version, release tag, or commit you tested.
- Your operating system and browser, if relevant.
- Clear reproduction steps and the impact you believe the issue has.
- Any suggested fix or proof of concept, if you have one.

Do not include real credentials, personal data, or proprietary designs in a
report. If you find an exposed secret, revoke or rotate it first, then tell us
only the type of secret and where it was exposed.

## Safety-critical toolpath issues

MakerCam generates G-code for machines that can cause injury or property damage.
If you find a toolpath or G-code generation issue that could make a machine move
unexpectedly, plunge, exceed limits, or ignore a safety height, treat it as
security-sensitive. Report it privately using the process above. Do not test
potentially unsafe output on a real machine without the machine owner's
permission, an emergency stop, and appropriate supervision.

## What to expect

This is a volunteer project, so responses are best-effort. We aim to acknowledge
reports within five business days, then triage the issue and discuss a fix and
disclosure plan with you. We will credit reporters in the advisory unless you
prefer to remain anonymous.

## Scope

In scope:

- The web application in `src/` and `dist/`.
- The native Windows application and installer in `dotnet/`.
- Build, packaging, and helper scripts in `scripts/` and `tools/`.
- SVG and project import, project serialization, and G-code export.
- Dependency or configuration issues that affect MakerCam's users.

Out of scope:

- Vulnerabilities that require physical access to an unattended machine or the
  user's computer.
- Social engineering and phishing.
- Issues in third-party dependencies that do not affect MakerCam; please report
  those upstream as well.
- The reference-only original Flash files under `makercam.swf` and
  `tools/extracted/`. Those are historical material; if a vulnerability affects
  the maintained application code, it is still in scope.

## Good-faith research

We will not pursue legal action for good-faith security research that respects
privacy and does not disrupt systems or data. Please do not access other
people's data, run generated G-code on hardware without authorization, or
publish details before a fix has been coordinated.
