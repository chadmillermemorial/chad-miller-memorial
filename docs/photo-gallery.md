# Tournament photo gallery

The gallery uses local static assets. It does not need access to visitors’ Google accounts, does not change the private Drive folder, and has no new hosting-service dependency.

- `/photos`: 2026 Inaugural, with the approved sponsor recognition banner.
- `/photos/2027`: 2027 First Annual, coming soon at Kings Grant, with venue and sponsorship inquiry links. No next-year course imagery is introduced.
- `data/photos-2026.json`: public filenames, dimensions and byte ranges only; no Drive credentials or internal records.
- `public/photos/2026/previews`: 43 WebP sheets, each holding up to 24 cropped previews. A page uses one sheet, not 24 original JPEG requests.
- `public/photos/2026/albums`: 85 standard, uncompressed ZIPs containing 12 unchanged uploaded JPEGs each. The viewer retrieves exactly one JPEG with an HTTP byte-range request. If a host ignores ranges, the viewer safely extracts the requested bytes from the full returned album. Invalid or truncated replies display an error and retry button.

Downloads are the resized JPEG copies uploaded for the gallery. The full-resolution originals on the organizer’s computer are not represented as available online. File numbering follows the camera filenames and requires no individual captions. Photographer credit is omitted until verified.

## Rebuilding

Prepare a private JSON inventory sorted by filename: `[{"id":"drive-file-id","name":"camera-filename.jpeg","size":123456}, ...]`. Download each source to `<SOURCE_DIR>/<id>.jpg` through the connected account. Keep that inventory and downloaded originals outside version control.

With Python and Pillow available:

```sh
python scripts/build-gallery.py INVENTORY_JSON SOURCE_DIR
npm test
npm run build
```

The generator checks the expected 1,020 unique source files, writes deterministic ZIPs, verifies every stored byte range against its source, creates previews, and emits the public manifest. A private SHA-256 source audit is saved next to SOURCE_DIR. Preview sheets use 6 columns and 4 rows of 300×200-pixel crops, matching the client coordinates.

For a requested removal, resolve the photo number or filename, remove its image from the public album and preview sheet, rebuild the affected manifest/ranges, and redeploy. Update the expected collection count in the generator and integrity test when the collection changes. Do not merely hide the thumbnail while leaving the image in a current downloadable album. Retain the organizer’s private records. Historic public Git revisions and copies already downloaded by visitors are outside the current website’s removal controls.

## Verification

The asset test checks all 1,020 records and JPEG ranges and bounds each preview below 500 KB. Range tests exercise 206 responses, a 200 full-album fallback, incorrect ranges, truncated bytes and non-image data. Public browser checks should cover pagination, opening and downloading a JPEG, next/previous, Escape/focus behavior, the last page, and the 2027 links.
