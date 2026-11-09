# ADR-031. Social preview image

Status: Accepted. Date: 2026-11-09.

## Context

A person who posts https://bunker.nosistech.com on X, LinkedIn, Slack or Discord gets a link card. The page already names a title and a description (`og:title`, `og:description`, `og:type`, `og:url`). It names no image. The card is an empty grey box.

The page allows images only from `data:` URLs ([ADR-016](ADR-016-content-security-policy.md)). The page must not request the preview.

## Options

| Option | For | Against |
|---|---|---|
| A. No image | Nothing to host | The card stays empty |
| B. An image on another host | The page file stays one file | A second host. The card breaks if that host is down |
| **C. A PNG in `site/`, named in the page as an absolute URL** | The host already serves `site/`. A crawler fetches the image. The page still loads nothing | One more file in the repository |

## Decision

Option C.

- The source is `assets/social-card.html`. `node tools/render-og.js` draws the PNGs with the page font, Archivo.
- `assets/og.png` is 1200 by 630 pixels. `tools/site.js` copies it to `site/og.png`. The public URL is `https://bunker.nosistech.com/og.png`.
- The page names that URL in `og:image` and `twitter:image`. `twitter:card` is `summary_large_image`. The width, the height and the alt text are set too.
- The Content Security Policy does not change. A crawler fetches the image by itself. The browser does not load it for the page.
- `assets/github-social.png` is 1280 by 640 pixels. GitHub does not read this file. Upload it by hand under the repository settings, in Social preview.

## Consequences

- `site/SHA256SUMS.txt` includes the hash of `og.png`.
- The image uses the same headers as the page. A link-card service downloads the file on its own server. Those headers apply in a browser, and they do not hide the file from that download.
- Nothing redirects `/og.png`. The download rule is only for `nosis-bunker.html`.
- To change the picture, edit the HTML source, run the render script, and commit both PNGs. CI has no browser, so the script is not part of `npm run check`.
