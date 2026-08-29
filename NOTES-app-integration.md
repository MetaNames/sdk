# Note: how the React app consumes the SDK

Side note to the five optimisation PRs (#115–#119). Everything here is measured,
not estimated; the commands are included so the numbers can be re-derived.

## 1. Where the SDK stands after the five PRs

Measured by merging all five branches into a local `integration-check` branch,
then bundling the published entry point:

```
npx esbuild dist/esm/index.js --bundle --minify --format=esm \
  --platform=node --splitting --outdir=/tmp/split
```

|                                   | `main`                                   | after #115–#119        |
| --------------------------------- | ---------------------------------------- | ---------------------- |
| Read-path entry chunk             | 1,642,792 B                              | **343,073 B (−79.1%)** |
| All chunks (consumer using everything) | 1,642,792 B                         | 1,192,906 B (−27.4%)   |
| Production packages installed     | 121                                      | **49**                 |
| Production advisories             | 99 (25 critical, 25 high, 36 moderate, 13 low) | **1 low**        |

`yarn audit --groups dependencies`, both sides installed fresh from their own
lockfiles on the same day.

Tests: 21 suites / 269 tests pass on the merged branch.

What is left in the 343 KB entry chunk:

```
200,245  @partisiablockchain/abi-client
 97,288  @partisiablockchain/blockchain-api-transaction-client
 42,217  (SDK's own code)
  2,809  @partisiablockchain/sections
```

The remaining opportunity is `@partisiablockchain/abi-client`, which is now 58%
of the read path. Not touched in these PRs.

## 2. What the app does today

### 2.1 The whole SDK is eager in the client bundle

`components/providers.tsx` is a `"use client"` component that statically imports
`metaNamesSdkFactory` from `lib/sdk.ts`, which statically imports `MetaNamesSdk`.
The instance is only ever created inside a `useEffect`, but the import is
top-level, so the SDK lands in the bundle for **every page**.

Evidence from the existing production build in `.next/static/chunks`:

```
$ grep -l "Signing strategy not found" .next/static/chunks/*   # SDK ContractRepository
$ grep -l "Domain name is too long"    .next/static/chunks/*   # SDK DomainValidator
```

Both match the *same* 306,958-byte client chunk. The signing path — which only
runs after a wallet connects — ships to every visitor, including ones who never
connect a wallet.

**Fix:** move the import inside the effect.

```diff
-import { metaNamesSdkFactory } from "@/lib/sdk";
-
 useEffect(() => {
   if (!initialized.current && !metaNamesSdk) {
     initialized.current = true;
-    setMetaNamesSdk(metaNamesSdkFactory());
+    void import("@/lib/sdk").then(({ metaNamesSdkFactory }) =>
+      setMetaNamesSdk(metaNamesSdkFactory()),
+    );
   }
 }, [metaNamesSdk, setMetaNamesSdk]);
```

This works today. #119 then splits what remains by signing strategy, and #118 is
what lets the bundler split at all.

**Better fix, if it fits the roadmap:** the app already proxies reads through API
routes (`/api/account/balance`, `/api/domains`, `/api/register/[name]/fees/[coin]`)
and keeps a server-side singleton in `lib/actions/sdk.ts`. If the remaining
client-side reads moved behind routes, the SDK would leave the client bundle
entirely and only signing would need it — which is already lazy in `lib/wallet.ts`.

### 2.2 `lib/domain-validator.ts` ships a second copy of the IDNA table

The app imports `tr46` directly (`package.json:35`) to re-implement validation
the SDK already does.

One client chunk is 203,107 bytes, of which **137,453 characters (68%) are
digits, commas and brackets** — the raw UTS-46 mapping table. It begins with a
lucide spinner icon and then `/^xn--/`:

```
$ head -c 300 .next/static/chunks/0d6-e_486gaul.js
(globalThis.TURBOPACK||…).push([…,"loader-circle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56"…}]]…let A=/^xn--/
```

Six chunks reference `useSTD3ASCIIRules`, totalling 573,294 bytes.

This is also a correctness problem, not only a size one. The comment in
`lib/domain-validator.ts:37-42` documents a bug caused by exactly this
duplication: the app capped each label at 32 characters while the SDK caps the
whole name including `.mpc`, so names passed app validation and then threw
inside the SDK, surfacing as a 500 from `/check`.

**Fix:** delete the tr46 path and call the SDK's `DomainValidator`, then drop
`tr46` from the app's dependencies. After #117 the SDK's validator carries an
11.7 KB generated table instead of a 225 KB one, and needs no tr46 at all — so
this removes ~200 KB from the client bundle *and* removes the rules that already
drifted once.

The app's friendlier error messages can stay: keep them as the copy layer and
let the SDK decide pass/fail — the same split `lib/records.ts` already uses for
record validation.

### 2.3 Value imports are already minimal

Only three modules import SDK *values*; everything else is `import type` and
costs nothing:

| file                | import                            |
| ------------------- | --------------------------------- |
| `lib/sdk.ts`        | `MetaNamesSdk`, `Enviroment`      |
| `lib/constants.ts`  | `RecordClassEnum`                 |
| `lib/records.ts`    | `getRecordValidator`              |

`RecordClassEnum` is a TypeScript enum, so it is a real runtime object and cannot
be `import type`. Today that one import pulls the entire barrel into any chunk
that touches `lib/constants.ts` — which is most of the UI. #118 fixes this: with
ESM and `sideEffects: false`, a consumer importing only `RecordClassEnum` bundles
393 bytes instead of 1,642,801.

No app change needed for that one; it lands with the SDK upgrade.

### 2.4 Deep `dist/` imports

Four deep paths are in use:

```
@metanames/sdk/dist/models/domain
@metanames/sdk/dist/providers/config
@metanames/sdk/dist/interface
@metanames/sdk/dist/transactions/ledger
```

#118 adds an `exports` map, which would normally make these unreachable. They
are explicitly kept working via a `./dist/*` pattern, so **nothing breaks on
upgrade**. Cleaner equivalents are exported alongside and are worth migrating to
at leisure:

```diff
-import type { BYOCSymbol } from "@metanames/sdk/dist/providers/config";
+import type { BYOCSymbol } from "@metanames/sdk/providers/config";
```

### 2.5 Wallet loading is already right

`lib/wallet.ts` dynamic-imports `partisia-blockchain-applications-sdk`,
`@ledgerhq/hw-transport-webusb`, `partisia-blockchain-applications-crypto` and
the SDK's Ledger client at each connect call site. That is exactly the shape
#119 gives the SDK internals, and it is why the app already declares all three
signing packages as direct dependencies — so the v7 move to optional peer
dependencies needs **no change** on the app side.

## 3. Suggested order of work

1. Merge #115 (security) — no API change, unblocks the rest.
2. Merge #116, #117 — no API change; −540 KB between them.
3. Merge #118 (ESM). App keeps working unchanged thanks to the `./dist/*`
   pattern; this is what makes everything downstream splittable.
4. Merge #119 (v7, breaking). App already has the three peers installed.
5. App: bump to `^7.0.0`, then §2.1 (lazy import in `providers.tsx`) and §2.2
   (delete the duplicated validator, drop `tr46`). These two are the whole
   app-side win.
6. Optional: §2.4 import-path migration, §2.1's server-side variant.

## 4. Not addressed

- `@partisiablockchain/abi-client` at 200 KB is now the largest single item on
  the read path. Worth a look on its own.
- `partisia-blockchain-applications-rpc` pulls axios + mime-db (~180 KB). It is
  on the read path and stays a required dependency.
- The live-testnet test suites are order-dependent and flake under contention —
  a full run failed 13 record-update tests, a re-run passed all 269, and each
  suite passes in isolation. Same on unmodified `main`. Worth separating from
  the unit suite so CI signal means something.

## 5. Re-measured 2026-08-29, after #120, #122, #123

The app is still on `@metanames/sdk@^6.3.1`, so none of #115–#123 has reached it.

App-shaped entry (`MetaNamesSdk`, `Enviroment`, `RecordClassEnum`,
`getRecordValidator`), minified, code-split, eager entry chunk only:

|                          | 6.3.1 (published) | sdk `main` + #123 |
| ------------------------ | ----------------- | ----------------- |
| app-shaped import        | 1,684,409 B       | 245,837 B         |
| `RecordClassEnum` only   | 1,684,355 B       | 413 B             |

6.3.1 emits one chunk: no ESM, so nothing splits and nothing shakes.

In the app's existing `.next` build (4,207,292 B of client chunks):

- one 306,958 B chunk holds the whole SDK — validators, signing, everything —
  and is pulled in by `components/providers.tsx`'s top-level import of
  `lib/sdk.ts`, so it ships to every visitor. §2.1 is still unfixed.
- six chunks reference `useSTD3ASCIIRules`, 573,294 B between them; the largest
  is 212,393 B of raw UTS-46 table. §2.2 is still unfixed. The SDK carries an
  11.7 KB generated table instead.
- no bip39 wordlist in the client bundle; that was only ever on the SDK's node
  path, and #122 removed it there too.

Two things the SDK now does for the app (both in #123):

- `assert` was the last node builtin; the package bundles for
  `--platform=browser` with no polyfills.
- `privateKeyToAddress` replaces the app's dev-only use of
  `partisia-blockchain-applications-crypto` in `lib/wallet.ts:63`, letting that
  dependency leave the app's `package.json`. It stays in the graph transitively
  through `partisia-blockchain-applications-sdk`, but leaves the bundle.

App work, in order of payoff:

1. Bump `@metanames/sdk`. Nothing breaks: the `./dist/*` export pattern keeps
   the four deep imports working.
2. Delete `lib/domain-validator.ts`'s tr46 path, call the SDK's
   `DomainValidator`, drop `tr46`. Largest single client-side win, and it ends
   the validation drift documented at `lib/domain-validator.ts:37-42`.
3. Move the `lib/sdk` import inside the effect in `components/providers.tsx`.
4. Swap `lib/wallet.ts:63` to `privateKeyToAddress`, drop
   `partisia-blockchain-applications-crypto`.
