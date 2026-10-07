# Nicky Ritmo · CVStudio

Interactive proposal published at https://cvstudio.com.ar/nickyritmo/.

Eight illustrative keyboard packs; responsive white, graphite and blue catalogue, generated original box atlas plus code-native box designs, SVG icons, subtle floating music notes and animated logo equalizer. Respects reduced motion. Social links supplied by the client are included.

Administration is accessed from the footer. Username/password authentication is validated on the server; no passwords or hashes are shipped in this repository. The account was provisioned separately. Expiring opaque sessions, hashed server-side, rate-limited sign-in, and logout revocation. No open registration. Tables and cover bucket are isolated from other CVStudio projects. Only the Edge service can read/write the admin tables; no anonymous or authenticated database grants. Credentials and session tables are never returned by public endpoints.

Panel includes dashboard, product search, add/edit, title, description, category, keyboard brand and model compatibility, example price, size, display order, draft/publication, cover upload (JPG/PNG/WebP up to 1MB), live preview, reversible archive/trash and restore. Hero/catalog copy settings. Catalogue and settings are saved online, with conflict checks to prevent overwriting newer edits. Images are public cover artwork only, not purchased files.

Backend source: server/index.ts. Schema reference: server/schema.sql. Edge function nicky-ritmo-api on the existing cvstudio-core project. JWT gateway verification is disabled because the function provides its own opaque-session authentication and per-action authorization. Service credentials are read only from runtime environment, never bundled in the page. No changes to other project authentication, tables or buckets.

All packs, prices, compatibility claims and synthesized audio are illustrative. Payment and TXT download are simulated; no real billing or keyboard sound files. Local sample purchases are independent of the online catalogue. Real sales require verified payment webhooks, buyer authentication and private file storage/authorized downloads.
