# Plan: drop the three unmaintained `partisia-blockchain-applications-*` packages

Your read is correct. Two package families are in play and they are not from the
same source:

| family | publisher | status |
| --- | --- | --- |
| `@partisiablockchain/*`, `@secata-public/*` | Partisia / Secata (official) | **maintained** — abi-client 6.198.0 published 2026-07-02 |
| `partisia-blockchain-applications-*` | third party | **abandoned** |

Last publish of the abandoned three:

```
partisia-blockchain-applications-rpc      1.0.13   2024-03-18   (~2.5 years)
partisia-blockchain-applications-sdk       0.1.4   2024-06-13   (~2 years)
partisia-blockchain-applications-crypto   1.0.34   2024-10-04   (~2 years)
```

The important part: **the official replacement is already installed.**
`@partisiablockchain/blockchain-api-transaction-client` arrives as a dependency
of `@partisiablockchain/abi-client`, is already 97,288 B of the bundle, and
covers everything the abandoned rpc and crypto packages are used for.

---

## 1. Where the advisories actually come from

45 distinct advisories in the partisia subtrees on `main`:

| source | count | worst |
| --- | --- | --- |
| `partisia-blockchain-applications-rpc` | **33** | critical (`form-data`); the other 32 are `axios` + `follow-redirects` |
| `partisia-blockchain-applications-crypto` | **11** | critical (`elliptic`, `pbkdf2` ×2, `sha.js`, `cipher-base`) |
| `@partisiablockchain/abi-client` (official) | 1 | moderate (`bn.js` infinite loop) |

Reproduce:

```
yarn audit --groups dependencies --json | grep -c partisia
```

**PR #115 already brings production advisories down to 4 low** via a lockfile
refresh plus four `resolutions`. So this plan is *not* about the current
advisory count — that is already handled. It is about the structural problem
underneath it:

- A `resolutions` entry works only while a patched, API-compatible version of
  the transitive dependency exists. The next advisory in `bip32@=2.0.6` (pinned
  with `=`, so it cannot float) or in `axios` under a breaking major has no
  resolution available, and there is no upstream to publish a fix.
- `partisia-blockchain-applications-crypto` pins `bip32: '=2.0.6'` and
  `bip39: '=3.1.0'` exactly. Those are seed/mnemonic paths this SDK never calls.
- It also pulls **`zxcvbn` (3.4 MB installed)**, a password-strength dictionary,
  into a blockchain SDK.

## 2. Are they necessary? No — except one

### `partisia-blockchain-applications-rpc` → **removable**

Used for exactly two things:

| current | official replacement |
| --- | --- |
| `PartisiaAccount(rpc).getContract()` (`src/repositories/contract-repository.ts:24`) | `ChainControllerApi.getContract()` |
| account nonce | `ChainControllerApi.getAccount()` |
| `PartisiaRpc({baseURL}).putTransaction` (`src/transactions/index.ts:35,84,112,139`) | `ChainControllerApi.putTransaction()` |
| transaction lookup | `ShardControllerApi.getTransaction()` |

The official controllers are `fetch`-based (generated OpenAPI runtime), so this
also deletes axios and mime-db — ~180 KB of the read path and 33 of the 45
advisories.

Half this migration is already done: `src/repositories/helpers/avl-client.ts`
talks to the same REST reader API directly with `fetch` via
`src/repositories/helpers/client.ts`. Only `getContract` and the transaction
put/lookup still route through axios.

### `partisia-blockchain-applications-crypto` → **removable**

| current import | official replacement |
| --- | --- |
| `serializedTransaction` (`src/transactions/helper.ts:2`) | `BlockchainTransactionClient.sign()` |
| `deriveDigest`, `getTrxHash`, `getTransactionPayloadData` | handled inside `BlockchainTransactionClient` |
| `signTransaction`, `privateKeyToAccountAddress` | `SenderAuthenticationKeyPair.fromString(pk)` |
| — | `CryptoUtils.privateKeyToKeypair` / `keyPairToAccountAddress` / `signatureToBuffer` / `hashBuffers` |

### `partisia-blockchain-applications-sdk` → **keep**

This one is not crypto or RPC — it is the browser wallet connector (`PartisiaSdk`,
the postMessage bridge to the Partisia wallet extension). There is no official
npm replacement; the only official wallet package is `@partisiablockchain/snap`
(0.3.0, 2024-11-06), which covers the MetaMask snap path the app already calls
directly, not the Partisia extension.

Caveat: it depends on `partisia-blockchain-applications-crypto@^1.0.23`, so that
subtree stays reachable transitively. Two things limit the damage — it is
dynamically imported at connect time only (off the read path entirely after
#119), and the app's own `lib/wallet.ts` already imports it lazily. Keep the
`elliptic` resolution from #115 in place for it.

## 3. The design that falls out

`SenderAuthentication` is a two-method interface:

```ts
interface SenderAuthentication {
  getAddress(): BlockchainAddress;
  sign(transactionPayload: Buffer, chainId: string): Promise<Signature>;
}
```

All four of this SDK's signing strategies collapse into four small
implementations of it, and `BlockchainTransactionClient.signAndSend()` replaces
the hand-rolled serialize/digest/sign/concat/put pipeline that
`src/transactions/index.ts` repeats four times:

| strategy | implementation |
| --- | --- |
| `privateKey` | `SenderAuthenticationKeyPair.fromString(privateKey)` — already provided |
| `Ledger` | wrap the existing `PartisiaLedgerClient` (`src/transactions/ledger.ts`) |
| `MetaMask` | wrap the existing snap `wallet_invokeSnap` call |
| `partisiaSdk` | wrap `PartisiaSdk.signMessage` |

This deletes most of `src/transactions/index.ts` and all of
`src/transactions/helper.ts`.

## 4. Order of work

Do this **after** #115–#119 land. It is a v8 change; #119 already moved these
packages to optional peers, and this removes two of the three outright.

Status: step 1 = PR #120 (merged), step 2 = PR #122 (merged), step 3 = PR #123 (open).

1. **Reader first, lowest risk.** Replace `PartisiaAccount.getContract` in
   `src/repositories/contract-repository.ts` with `ChainControllerApi`. Nothing
   about signing changes. Removing the axios subtree here is 33 of 45
   advisories and ~180 KB.
2. **`SenderAuthentication` adapters.** Add the four wrappers behind the
   existing `setSigningStrategy` API so the public surface does not move.
3. **Swap the transaction pipeline** to `BlockchainTransactionClient`, delete
   `src/transactions/helper.ts`, drop `partisia-blockchain-applications-crypto`
   from peers. Done in #123: the chain id now comes from `GET /chain` so
   `isMainnet` is gone, and the transaction half of `ShardedClient` went with
   the helper.
4. **Leave `partisia-blockchain-applications-sdk`** as an optional peer for the
   wallet connector. Revisit if Partisia publishes an official connector.

Each step is independently shippable and independently testable against
testnet.

### Verify at each step

```
yarn test:run
yarn audit --groups dependencies
npx esbuild dist/esm/index.js --bundle --minify --format=esm \
  --platform=node --splitting --outdir=/tmp/split
```

## 5. App side

`../app` — checked, current state:

| package | app usage | action |
| --- | --- | --- |
| `partisia-blockchain-applications-rpc` | **not imported at all** | nothing to do |
| `partisia-blockchain-applications-crypto` | one call site: `lib/wallet.ts:63-66`, `privateKeyToAccountAddress` inside `connectDevPrivateKey`, which throws in production | **removable now**, see below |
| `partisia-blockchain-applications-sdk` | `lib/wallet.ts:31` (`PartisiaSdk`, dynamic) + `PermissionTypes` type import | keep |

The app can drop `partisia-blockchain-applications-crypto` from its own
`package.json` today, independent of everything above. It is used only in a
dev-only branch and only for deriving an address from a private key, which the
already-installed official client does:

```diff
-  const mod = await import("partisia-blockchain-applications-crypto");
-  const partisiaCrypto = mod.default?.partisiaCrypto ?? mod.partisiaCrypto;
-  const address = partisiaCrypto.wallet.privateKeyToAccountAddress(privateKey);
+  const { CryptoUtils } = await import(
+    "@partisiablockchain/blockchain-api-transaction-client"
+  );
+  const address = CryptoUtils.keyPairToAccountAddress(
+    CryptoUtils.privateKeyToKeypair(privateKey),
+  );
```

Note this changes which package must be declared: add
`@partisiablockchain/blockchain-api-transaction-client` as a direct app
dependency rather than relying on it being hoisted from the SDK. Verify the two
functions produce the same address for a known key before merging — same
elliptic curve and hash, but confirm rather than assume.

`partisia-blockchain-applications-sdk` stays either way, and keeps the crypto
subtree present transitively. That is acceptable: it is behind a dynamic import
that only runs when someone connects the Partisia wallet.
