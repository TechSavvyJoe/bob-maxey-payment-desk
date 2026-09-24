# MySoldLog deployment

Prepared for the current payment desk on September 24, 2026. Hosting and DNS changes are not yet applied.

## Existing domain

Live DNS inspection found `mysoldlog.com` on GoDaddy nameservers `ns59.domaincontrol.com` and `ns60.domaincontrol.com`, with the apex pointing to `199.36.158.100`. The root and `/desking` currently return the same Firebase-hosted Sales Ledger application. Do not replace the root application or its DNS record to publish the desk.

## Cloudflare hosting with a GoDaddy subdomain

Recommended address: `https://desking.mysoldlog.com`.

1. Build the reviewed source with `npm run build`. Upload only `dist`, which contains the calculator and static assets, not the repository or user-entered figures.
2. Create or select a Cloudflare Pages project in the verified account. Record its actual `pages.dev` hostname and deployment ID; do not assume the requested project name is available.
3. Test that deployment before adding the custom domain: selling price, payment calculation, target application/undo, itemized breakdown, customer view, and print/copy.
4. Add `desking.mysoldlog.com` under the Pages project's Custom domains first.
5. In GoDaddy DNS for `mysoldlog.com`, check for existing `desking` records. If none exists, add a CNAME named `desking` pointing to the actual Pages hostname. If a record exists, inspect its purpose before replacing it. Keep all other records and nameservers unchanged.
6. Wait for the Cloudflare domain and certificate to be active. Verify HTTPS, response headers, JS/CSS/font/icon/manifest loading, and the original `https://mysoldlog.com` site.

The built `_headers` file supplies CSP, no-sniff, no-referrer, noindex, and camera/microphone/location restrictions on Cloudflare Pages. Existing GitHub Pages deployment does not apply this file as HTTP headers.

For repeat deployments, use the same Pages project and record the source commit with the release. Direct Upload and Git integration are distinct project creation choices. The existing repository workflow only updates GitHub Pages from `main`; it does not update Cloudflare automatically. Keep the existing PR/release checks in the release process.

## Exact `/desking` path alternative

`https://mysoldlog.com/desking` is a path, so it cannot be added using a DNS CNAME. It needs a deployment within the existing Firebase site or Cloudflare routing in front of the existing hostname. The latter requires a Cloudflare-proxied DNS setup for the apex, a complete inventory of existing DNS records, and a planned migration that preserves the current site and email.

The app uses relative asset paths and supports `/desking/`. Redirect `/desking` to `/desking/` while retaining its query string. A Cloudflare Worker must strip only `/desking` from requests in that path before fetching the desk's static assets. Requests outside that path must continue to the existing application. Do not add a blanket SPA fallback for unknown nested paths; this app has no client-side URL routes.

## Rollback

Record any pre-existing `desking` DNS record before changes. To undo a subdomain launch, restore that record or remove only the newly created `desking` CNAME and detach the custom domain from Pages. The main site should not require restoration because it is unchanged. For an application regression, roll back the Pages project to its previous successful deployment.

## References

- [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Cloudflare Workers routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)
- [GoDaddy CNAME records](https://www.godaddy.com/help/add-a-cname-record-19236)
