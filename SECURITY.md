# Security policy

## Scope

This repository is a static marketing site. It has no server, database, accounts or form processing, and it makes no third-party requests, so the attack surface is small. Relevant concerns are things like supply-chain risk in the GitHub Actions workflows, content injection through contributed changes, and accidentally committed secrets.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Include what you found, how to reproduce it and the impact you expect.

You can expect an acknowledgement within a few days. Once a fix is available it will be published and, where appropriate, credited to you.

## What the project already does

- GitHub Actions are pinned to full commit SHAs and updated weekly by Dependabot.
- Workflows use least-privilege `permissions`.
- The published artifact contains only the built site files (see `scripts/stage.cjs`), not the repository.
- Published pages carry a Content-Security-Policy (`<meta>` tag, as GitHub Pages cannot set headers): scripts, styles, fonts and images load only from the site itself, inline blocks are allowed by SHA-256 hash, and plugins and form submissions are disabled. CI fails if anything on the page violates it.
- Fonts are self-hosted and there are no analytics, trackers or cookies.
- `.gitignore` excludes local tooling output.
