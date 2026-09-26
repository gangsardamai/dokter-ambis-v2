# Cloudflare Workers deployment

This branch adds a parallel `vinext` build. The existing Next.js scripts remain available.

## Before deploying

1. Run `npm ci`, `npm run build:vinext`, and `npm run test:leader`.
2. In the Cloudflare Workers project, provide these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time and runtime. These are embedded in browser code, so a rebuild is needed when they change.
   - `NEXT_PUBLIC_SITE_URL` with the eventual canonical site URL.
   - If R2 uploads and private materials are in use, configure `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET`, and the legacy `CLOUDFLARE_R2_BUCKET_NAME` value expected by `lib/cloudflare-r2.ts`. Add `CLOUDFLARE_R2_ENDPOINT` only if the account endpoint differs from the derived endpoint.
3. Keep secrets out of the repository. Configure them in Cloudflare's environment/secrets UI or with `wrangler secret put` after authenticating locally.

## Build and verify

Run `npm run build:vinext`. `npm run start:vinext` starts the built Worker locally. Once the Worker is deployed, verify registration, login, admin/Leader access, course materials, image uploads, quizzes, Try Outs, and R2 downloads on the temporary `workers.dev` hostname before switching the custom domain.

The vinext adapter is beta. Its compatibility check passes the imports used by this repository, but that static check does not establish runtime correctness. The `next/image` shim currently lacks local image optimization. Keep the existing deployment configuration as a rollback path until production flows pass on Workers.

Do not change `dokterambis.com` DNS until the temporary deployment is verified. Supabase Auth redirect URLs must include the temporary hostname for testing and the final custom domain after cutover.
