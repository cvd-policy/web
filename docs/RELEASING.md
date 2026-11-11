# Releasing

`@cvd-policy/core` and `@cvd-policy/cli` are released together under one
version. Pushing a tag `vX.Y.Z` runs [`release.yml`](../.github/workflows/release.yml);
nothing is published by hand.

## What the workflow enforces

1. **Gate.** The full CI workflow runs on the tagged commit.
2. **Tag and version.** The tag must be a commit on `main`, must equal
   `v` + the core version, the CLI version must equal it, the CLI must depend on
   exactly that core version, and `CHANGELOG.md` must contain a `## X.Y.Z`
   section.
3. **Package.** Both tarballs are packed once on Linux and recorded in
   `SHA256SUMS`. Those exact bytes are what gets published and attached to the
   GitHub release.
4. **Publish.** Core first, then CLI, through npm trusted publishing (OIDC, no
   stored token) with provenance attestations. Versions with a prerelease part
   (`-rc.1`) go to the `next` dist-tag, all others to `latest`. After
   publishing, the registry's integrity is compared with the approved tarball.
5. **GitHub release.** Created from the tag with both tarballs, `SHA256SUMS` and
   the version's `CHANGELOG.md` section as notes.

If a run fails after core was published, re-running it is safe: a version
already on the registry with identical bytes is skipped; one with different
bytes fails the run.

npm may hold a new version in automated review ("Validating" on the package
page) before it becomes installable; the integrity check waits up to 30
minutes. While core is held, a CLI that is already live cannot be installed,
because it pins that exact core version.

## One-time setup

- On npmjs.com, for **both** `@cvd-policy/core` and `@cvd-policy/cli`:
  *Settings → Trusted publishing → GitHub Actions* with organization
  `cvd-policy`, repository `web`, workflow `release.yml`, environment `npm`.
  The connection must allow **`npm publish`**: connections created since
  September 2026 allow only `npm stage publish` by default, and a direct publish
  then fails with `403 … OIDC permission denied for this action`.
- In the GitHub repository, the environment `npm` (created on first use if
  absent). Restricting it to `v*` tags, or adding a required reviewer, is
  optional.

## Cutting a release

1. Set the version in `packages/core/package.json`, `packages/cli/package.json`
   and the CLI's `@cvd-policy/core` dependency; run `npm install` to update the
   lockfile.
2. Move the `CHANGELOG.md` entries under `## X.Y.Z`, update versioned commands
   in the READMEs and on the site, commit and push to `main`.
3. Wait for CI on `main` to pass.
4. Tag that commit and push the tag:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z" <commit>
   git push <github-remote> vX.Y.Z
   ```

5. Check the workflow run, the packages on npm (`npm view @cvd-policy/core`)
   and the GitHub release.

A published version is immutable: never re-use a version number or move a
pushed tag. Fix forward with a new patch version.
