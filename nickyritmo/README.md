# Nicky Ritmo · CVStudio

Interactive proposal published at https://cvstudio.com.ar/nickyritmo/.

Eight illustrative keyboard packs; responsive white, graphite and blue catalogue, generated original box atlas plus code-native box designs, SVG icons, subtle floating music notes and animated logo equalizer. Respects reduced motion. Social links supplied by the client are included.

Administration is accessed from the footer. Username/password authentication is validated on the server; no passwords or hashes are shipped in this repository. The account was provisioned separately. Expiring opaque sessions, hashed server-side, rate-limited sign-in, and logout revocation. No open registration. Tables and cover bucket are isolated from other CVStudio projects. Only the Edge service can read/write the admin tables; no anonymous or authenticated database grants. Credentials and session tables are never returned by public endpoints.

Panel includes dashboard, product search, add/edit, title, description, category, keyboard brand and model compatibility, example price, size, display order, draft/publication, cover upload (JPG/PNG/WebP up to 1MB), live preview, reversible archive/trash and restore. Hero/catalog copy settings. Catalogue and settings are saved online, with conflict checks to prevent overwriting newer edits. Images are public cover artwork only, not purchased files.

Backend source: server/index.ts. Schema reference: server/schema.sql. Edge function nicky-ritmo-api on the existing cvstudio-core project. JWT gateway verification is disabled because the function provides its own opaque-session authentication and per-action authorization. Service credentials are read only from runtime environment, never bundled in the page. No changes to other project authentication, tables or buckets.

All packs, prices, compatibility claims and synthesized audio are illustrative. Payment and TXT download are simulated; no real billing or keyboard sound files. Local sample purchases are independent of the online catalogue. Real sales require verified payment webhooks, buyer authentication and private file storage/authorized downloads.

## Audio/file selection for demo only

The editor has separate selectors for product cover, sample audio and full deliverable (audio or keyboard pack). Cover upload retains the existing public storage workflow. Sample and full-file selections stay only in memory for the lifetime of the current tab; no audio or purchased files are uploaded to the backend, indexed publicly, or stored as base64/localStorage. Sample playback stops at approximately 15 seconds; sample selector accepts common audio formats up to 20MB. The full pack is a File reference, avoiding reading a 1–1.5GB archive into memory. Saving associates these local references with the saved catalogue ID. Closing/cancelling the editor does not publish staged files. A simulated order snapshots the full-file reference available at purchase time; only that demo order exposes its download button. Reloaded/other-browser purchases fall back to the explicit TXT demo. Admin copy explains the temporary scope. Real buyer authentication, payment verification and protected file storage remain out of scope.
