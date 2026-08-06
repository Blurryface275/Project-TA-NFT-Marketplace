# Current Versions & Official Documentation Reference: NFT Event-Ticketing Stack (August 2026)

## TL;DR
- As of August 2026 the stack's biggest tutorial-breaking traps are: OpenZeppelin Contracts v5.x removed `_beforeTokenTransfer`/`_afterTokenTransfer` in favor of a single `_update()` hook; wagmi v2 + viem v2 rewrote the hook/action API; Pinata retired `@pinata/sdk` (then `pinata-web3`) in favor of the new `pinata` package; and Next.js is now on the 16.x line with Turbopack default and async `params`/`searchParams`.
- Confirmed current stable versions: Foundry v1.7.0, Solidity 0.8.36 (0.8.34 was the prior widely-referenced stable), OpenZeppelin Contracts 5.6.1, ZeroDev SDK 5.5.10 (EntryPoint v0.7 / Kernel v3.1–v3.3), NestJS/CLI 11.x, TypeORM 1.1.0, mysql2 3.23.2, Next.js 16.2.x, wagmi 2.x (see caveat on the observed 3.7.6 npm string), Pinata SDK `pinata` 2.5.6.
- ERC-4337's canonical production EntryPoint remains v0.7 at `0x0000000071727De22E5E9d8BAf0edAc6f37da032`; v0.8 exists (adds native EIP-7702 support) but ZeroDev's SDK still standardizes on `getEntryPoint("0.7")`.

## Key Findings

### Smart Contract Layer

**Foundry (forge, cast, anvil, chisel) — v1.7.0 stable**
- Install: `curl -L https://foundry.paradigm.xyz | bash` then `foundryup`. The site also offers `curl -L https://getfoundry.sh/install | bash && foundryup`.
- **Breaking change vs old tutorials:** `foundryup` now installs the **stable** channel by default (set by PR #9585). Older tutorials assume `foundryup` pulls nightly; nightly now requires explicit `foundryup -i nightly`. Foundry also **no longer publishes npm packages** for forge/cast/anvil/chisel — use foundryup, GitHub releases, Docker, or build from source.
- Foundryup requires Git Bash or WSL on Windows (PowerShell/CMD unsupported). Verify with `forge --version` after install.
- Docs: https://getfoundry.sh/ and https://book.getfoundry.sh/

**OpenZeppelin Contracts — 5.6.1**
- Install: `npm install @openzeppelin/contracts` (or `forge install OpenZeppelin/openzeppelin-contracts` for Foundry).
- **ERC-721 transfer hook — confirmed:** In v5.x the `_beforeTokenTransfer` and `_afterTokenTransfer` hooks were **deleted** and replaced by a single internal `_update(address to, uint256 tokenId, address auth)` function. Per OpenZeppelin's "Introducing Contracts 5.0": "In 5.0, token hooks were removed from ERC20, ERC721, and ERC1155, favoring a single `_update` function." Any tutorial written before this v5.0 change that overrides `_beforeTokenTransfer` will not compile against v5.
- **Correct current pattern for gating/restricting ERC-721 transfers** (e.g. an allowlist so only one approved marketplace contract may move tokens): override `_update`. Example:
  ```solidity
  function _update(address to, uint256 tokenId, address auth)
      internal override returns (address)
  {
      address from = super._update(to, tokenId, auth);
      // mint (from == 0) and burn (to == 0) always allowed;
      // otherwise require the executing party be the approved marketplace
      if (from != address(0) && to != address(0)) {
          require(msg.sender == approvedMarketplace, "transfers restricted");
      }
      return from;
  }
  ```
  `super._update` returns the previous owner (`from`); use that to distinguish mint/burn from transfer. `_update` runs for mint, burn, and transfer, so guard on `from`/`to` being nonzero.
- Minimum pragma raised to 0.8.24 for many modules in recent 5.x minors. Per the OpenZeppelin CHANGELOG: "Update minimum pragma to 0.8.24 in AccessControlEnumerable, Arrays, CircularBuffer, EIP712, EnumerableMap, EnumerableSet, ERC1155… ERC721Enumerable… MessageHashUtils, Strings, Votes and VotesExtended (#5723, #5726, #5965)." Make sure your `solc` version is ≥ 0.8.24.
- Docs: https://docs.openzeppelin.com/contracts/5.x/

**Solidity compiler — 0.8.36 (latest stable line), 0.8.34 prior**
- Per soliditylang.org (Feb 18 2026), 0.8.34 was "a bugfix release that patches an important bug of high severity affecting clearing of storage and transient storage variables in the IR pipeline… only three deployed contracts were found across all EVM-compatible chains." The bug was reported by security firm Hexens and affects 0.8.28–0.8.33 only when compiling with `--via-ir`. 0.8.36 (Jul 9 2026) added two medium-severity security fixes and removed the experimental EOF backend (EOF was rejected from the Fusaka upgrade).
- **Notable EVM-default changes that break older config assumptions:** 0.8.30 changed the default EVM version from `cancun` to `prague` (Pectra); 0.8.31 made `osaka` the default (Fusaka) and deprecated the first batch of features scheduled for removal in 0.9.0. If deploying to Sepolia, pin `evm_version` explicitly to match the network's active fork.
- Recommendation: pin a recent released 0.8.3x in `foundry.toml` (nightly 0.8.37 builds exist but are not stable). Docs: https://docs.soliditylang.org/

**OpenZeppelin ECDSA + EIP-712 utilities**
- Current import paths (v5.x):
  - `import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";`
  - `import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";`
  - `import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";`
- **Breaking change vs v4 tutorials:** In v4, `ECDSA.toEthSignedMessageHash(...)` and related prefix helpers lived on the `ECDSA` library. In **v5 these moved to `MessageHashUtils`** (`MessageHashUtils.toEthSignedMessageHash`, `toTypedDataHash`). Tutorials calling `ECDSA.toEthSignedMessageHash` will not compile.
- **Recommended verification pattern:** derive the digest with `_hashTypedDataV4(structHash)` (from `EIP712`) then recover with `ECDSA.recover(digest, signature)`:
  ```solidity
  bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
      keccak256("Mail(address to,string contents)"), mailTo, keccak256(bytes(mailContents))
  )));
  address signer = ECDSA.recover(digest, signature);
  ```
- **`recover` vs `tryRecover`:** `recover` reverts on an invalid signature; `tryRecover` returns `(address recovered, RecoverError err, bytes32 errArg)` without reverting so the caller can branch. Both remain in v5. For smart-account/ERC-1271 signers (relevant when your buyers use ZeroDev smart accounts), use `SignatureChecker` rather than raw `ECDSA.recover`, since a smart account has no EOA private key and validates via ERC-1271.
- Docs: https://docs.openzeppelin.com/contracts/5.x/api/utils/cryptography

### Account Abstraction Layer

**ZeroDev SDK — @zerodev/sdk 5.5.10**
- Install: `npm i @zerodev/sdk @zerodev/ecdsa-validator viem` (add `permissionless` and `@rhinestone/module-sdk` only if using those).
- **Deprecated packages:** `@zerodevapp/sdk` (last 3.4.4) and `zerodev-sdk` are deprecated — do not follow tutorials importing those.
- **Current quickstart pattern:** import `getEntryPoint`, `KERNEL_V3_1` from `@zerodev/sdk/constants`; build an ECDSA validator with `signerToEcdsaValidator(publicClient, { signer, entryPoint, kernelVersion })`, then `createKernelAccount(publicClient, { plugins: { sudo: ecdsaValidator }, entryPoint, kernelVersion })`, then `createKernelAccountClient({ account, chain, bundlerTransport, client, paymaster })`. Send UserOps with `kernelClient.sendUserOperation({ callData / calls })` and await `waitForUserOperationReceipt`.
- **EntryPoint targeted:** `getEntryPoint("0.7")` with Kernel v3.1 (standard) up to Kernel v3.3 (EIP-7702 flows). ZeroDev SDK v5.5.x does **not** document a `getEntryPoint("0.8")` option — mismatched EntryPoint/Kernel versions cause silent UserOp reverts.
- **Major migration note:** The v5.3.x → later migration removed the old `permissionless`-style `ENTRYPOINT_ADDRESS_V06/V07` constants in favor of `getEntryPoint("0.7")` and an explicit `kernelVersion`. Older ZeroDev tutorials pass `entryPoint` as a raw address constant; the current API expects the `getEntryPoint(...)` object.
- Docs: https://docs.zerodev.app/

**ERC-4337 EntryPoint — canonical v0.7**
- The current canonical production EntryPoint is **v0.7 at `0x0000000071727De22E5E9d8BAf0edAc6f37da032`**. Per Eco's ERC-4337 reference, it is "deployed at 0x0000000071727De22E5E9d8BAf0edAc6f37da032 on Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain, Avalanche, and most other major EVM chains" — the same address on Sepolia, verifiable on Etherscan ("Entry Point 0.7.0"). v0.6 remains at `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789`.
- **v0.8** has been released. Per eth-infinitism/account-abstraction release notes, "we are adding the Simple7702Account contract to the core of the ERC-4337 smart contract distribution. This is a fully audited minimalist smart contract wallet that can be safely authorized by any Externally Owned Account (EOA)," alongside native EIP-7702 authorization support and ERC-712-based UserOp hashing. Adoption is still rolling out and most SDKs (including ZeroDev) default to v0.7. **For a Sepolia thesis project, target v0.7.**

**permissionless.js & viem**
- ZeroDev's SDK is built on viem and historically on permissionless.js. For the current quickstart you primarily need `viem`; `permissionless` is optional unless you use its account/bundler helpers directly. viem is on the 2.x line (peer of wagmi 2.x). Pin viem to a 2.x version compatible with your `@zerodev/sdk` 5.5.x; confirm with `npm show viem version` / `npm show permissionless version`.

**Alchemy — Account Kit / aa-sdk**
- Package families: high-level `@account-kit/*` (react, core, infra, smart-contracts) and low-level `@aa-sdk/*` (core). The older `@alchemy/aa-*` packages (`@alchemy/aa-alchemy`, `@alchemy/aa-core`) are the legacy naming and older tutorials reference them.
- Alchemy provides a Rust bundler ("Rundler") and a Gas Manager paymaster. For Sepolia, create an app, use the Alchemy transport (`alchemy({ apiKey, chain: sepolia })`), and Gas Manager middleware (`alchemyGasAndPaymasterAndDataMiddleware`, used by default in `createAlchemySmartAccountClient`). Alchemy uses a custom `alchemy_requestGasAndPaymasterAndData` RPC rather than the standard ERC-7677 interface — a detail that matters if you later swap providers.
- Docs: https://accountkit.alchemy.com/ (also https://www.alchemy.com/docs/wallets)

### Backend Layer

**NestJS — v11.x (CLI 11.0.24)**
- Install CLI: `npm install -g @nestjs/cli` (pin to major: `@nestjs/cli@11`). Scaffold: `nest new my-app` (add `--strict` for stricter TS). Requires Node.js >= 20.
- **Breaking note:** NestJS 11 defaults to **Express v5**. Pin the CLI to `@11` — a v10 CLI scaffolds boilerplate missing the Express v5 type fixes.
- Docs: https://docs.nestjs.com/

**TypeORM — 1.1.0 (also active 0.3.30 line)**
- Install: `npm install typeorm reflect-metadata`.
- **Status/health — actively maintained again.** New maintainers took over at the end of 2024; through 2025 they shipped 8 patch releases, merged 575 PRs and closed over 2,300 issues. **TypeORM 1.0 shipped May 19 2026** (first major since 2016), and 1.1.0 followed July 13 2026. Per TypeORM's official 1.0 blog, v1.0 renames `Connection` to `DataSource` and removes APIs deprecated since v0.3 (`createConnection`, `getConnection`, `getRepository`, `Connection`/`ConnectionOptions`), and requires ES2023 / newer Node. The project reports 36,400+ GitHub stars.
- **Community trend — be honest with your advisor:** Per Snyk's typeorm package page, the library sees **4,044,242 weekly npm downloads** and is rated a "Key ecosystem project" (npm trends shows ~4.29M/week; TypeORM's own blog cites 4.7M+). However, multiple 2026 comparisons (Encore, Kanopy, PkgPulse) describe TypeORM's growth as flatlined and treat it as the "legacy/enterprise" choice, recommending Prisma (schema-first, best-in-class migrations) or Drizzle (SQL-first, edge-friendly, ~1.5M weekly downloads and climbing) for greenfield TypeScript. TypeORM remains the natural fit inside NestJS via first-class `@nestjs/typeorm` integration. For a thesis on NestJS + MySQL it is a defensible, well-integrated choice; cite that it is now a maintained 1.x rather than the old "pre-1.0" perception.
- Docs: https://typeorm.io/

**mysql2 — 3.23.2**
- Install: `npm install mysql2`. In the 3.x line as expected; the driver behind TypeORM's `mysql` connection. v3.23.1 included a security fix for unbounded decompression of server-supplied compressed packets — stay current.
- Docs: https://github.com/sidorares/node-mysql2

### Frontend Layer

**Next.js — 16.2.x (current stable line)**
- Create: `npx create-next-app@latest` (flags such as `--typescript --tailwind --eslint --app --src-dir --turbopack`).
- **App Router vs Pages Router:** App Router is the default and recommended approach for all new projects; the Pages Router is in maintenance mode but still fully supported. For a new thesis project, use the App Router.
- **Breaking changes that break older tutorials:** (1) dynamic route `params` and `searchParams` are now **Promises** — you must `await` them (introduced Next.js 15, still true in 16). (2) **Turbopack is the default dev bundler** in 16. (3) the middleware file `middleware.ts` was renamed to `proxy.ts` in the 16.x line. (4) `fetch` is no longer cached by default (Next.js 15 change). Upgrade to ≥16.2.6, which shipped a coordinated batch of 13 security advisories.
- Docs: https://nextjs.org/docs

**wagmi & viem — 2.x majors**
- Install: `npm i wagmi viem @tanstack/react-query`.
- **Breaking changes:** wagmi **v2** was a major API redesign making wagmi a thin wrapper over viem + TanStack Query. Key removals/renames: `usePrepareContractWrite` → `useSimulateContract`; `useContractWrite` → `useWriteContract`; `useSigner`/`useProvider` → `useWalletClient`/`usePublicClient` (viem terminology); `mainnet`/`sepolia` moved to the `wagmi/chains` (viem/chains) entrypoint; ENS names must be normalized manually with viem's `normalize`. wagmi requires `@tanstack/react-query` as a peer dependency. Any pre-v2 (0.x/1.x) tutorial will not work.
- viem is on the 2.x line and is the low-level client both wagmi and ZeroDev build on.
- Docs: https://wagmi.sh/ and https://viem.sh/

### Supporting Services

**Pinata (IPFS) — `pinata` 2.5.6**
- **Package churn (major trap):** Pinata has changed its SDK **twice**. The original `@pinata/sdk` (last 2.1.0, ~4 years old) is deprecated; the interim `pinata-web3` (last 0.5.4, Dec 2024) is also superseded; the **current official package is simply `pinata`** (latest 2.5.6). Install: `npm i pinata`.
- **Current auth/usage:** initialize with a JWT and gateway: `new PinataSDK({ pinataJwt: process.env.PINATA_JWT, pinataGateway: "your-gateway.mypinata.cloud" })`. The current API namespaces uploads by network: `pinata.upload.public.file(file)` (and `pinata.gateways.public.get(cid)`), which differs from `pinata-web3`'s `pinata.upload.file(...)`. Initialize server-side; use signed JWTs for client-side uploads. Note the response shape also changed (returns a `cid` field and object metadata rather than the old `IpfsHash`).
- Docs: https://docs.pinata.cloud/

**Midtrans — midtrans-client (official Node client)**
- Install: `npm install midtrans-client` (the official `Midtrans/midtrans-nodejs-client`; latest in the 1.4.x line — confirm exact patch on npm). Avoid unofficial `midtrans-node`/`midtrans-snap` wrappers.
- **Sandbox setup:** `new midtransClient.Snap({ isProduction: false, serverKey: 'YOUR_SERVER_KEY', clientKey: 'YOUR_CLIENT_KEY' })`, then `snap.createTransaction(parameter)` → `transaction.token`. Frontend loads `https://app.sandbox.midtrans.com/snap/snap.js` with `data-client-key`; call `snap.pay(token, {...})`. Remove `.sandbox` from the script URL and flip `isProduction: true` for production.
- Docs: https://docs.midtrans.com/

**Cloudflare Turnstile (Next.js)**
- **Client:** either implicit rendering (add the `cf-turnstile` class + Cloudflare script) or a React wrapper (e.g. `@marsidev/react-turnstile`). Store the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client) and the secret in `TURNSTILE_SECRET_KEY` (server-only).
- **Server-side verification (mandatory):** POST the token to `https://challenges.cloudflare.com/turnstile/v0/siteverify` (content-type `application/x-www-form-urlencoded`) with `secret` and `response` fields, from a Route Handler (`app/api/.../route.ts`) or Server Action, and check `success`. Per Cloudflare's docs: "Each token is valid for 300 seconds (5 minutes) after generation. Tokens are single-use… A replayed token will be rejected with the timeout-or-duplicate error code." Test keys exist for development (e.g. site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`).
- Docs: https://developers.cloudflare.com/turnstile/

## Recommendations
1. **Pin everything explicitly** in a lockfile and in `foundry.toml` (`solc_version`, `evm_version`). For Sepolia, set `evm_version` to match the network's active fork rather than relying on the compiler default, which has moved (cancun → prague → osaka) across 0.8.30/0.8.31 and will silently change behavior if left implicit.
2. **Smart contracts:** use OpenZeppelin 5.6.1 and implement transfer gating via `_update` (not `_beforeTokenTransfer`). For any off-chain-signed ticket-claim flow, use `EIP712._hashTypedDataV4` + `ECDSA.recover`, importing prefix helpers from `MessageHashUtils` (not `ECDSA`); use `SignatureChecker` if the signer may be a smart account.
3. **Account abstraction:** target EntryPoint v0.7 + Kernel v3.1 with `@zerodev/sdk` 5.5.10 and `getEntryPoint("0.7")`. Do not mix v0.6/v0.7 address constants from old permissionless tutorials. Only move to EntryPoint v0.8 (+ Kernel v3.3) if you specifically need EIP-7702 EOA-upgrade/passkey flows.
4. **Backend:** NestJS 11 (CLI pinned `@11`) + TypeORM 1.1.0 + mysql2 3.23.2 is coherent and well-integrated. In your thesis, acknowledge the ecosystem shift toward Prisma/Drizzle but justify TypeORM on the grounds of first-class NestJS integration and its renewed, now-1.x maintenance.
5. **Frontend:** Next.js 16.2.x App Router, wagmi 2.x + viem 2.x + `@tanstack/react-query`. Await `params`/`searchParams`; expect `proxy.ts` instead of `middleware.ts`.
6. **Supporting services:** install the `pinata` package (not `@pinata/sdk` or `pinata-web3`); use official `midtrans-client`; always verify Turnstile tokens server-side.
- **Thresholds that change the above:** if you need edge/serverless DB access or start a fresh backend outside NestJS, reconsider Drizzle/Prisma over TypeORM; if you adopt EIP-7702 passkey/EOA-upgrade flows, move to EntryPoint v0.8 + Kernel v3.3.

## Caveats
- **wagmi exact version:** An observed npm listing showed the version string `3.7.6` for a wagmi-related package line while wagmi's documented current major is v2 (the v1→v2 migration guide is the authoritative breaking-change source). I could not fully reconcile whether the top-level `wagmi` package has advanced to a 3.x major. Treat "wagmi 2.x" as the confirmed major for API purposes and verify the exact installed version with `npm show wagmi version` before writing it into the thesis.
- **viem and permissionless.js exact patch versions** were not confirmed; both are on their current 2.x lines. Confirm with `npm show viem version` / `npm show permissionless version`.
- **Foundry v1.7.0** is cited from official docs pages; the exact GitHub release tag page could not be opened directly. Confirm with `foundryup && forge --version`.
- **Midtrans `midtrans-client` exact latest patch** (1.4.x observed) should be confirmed on npm.
- **Solidity latest patch:** 0.8.36 (Jul 2026) is the newest stable referenced; nightly 0.8.37 builds exist but should not be used for deployment. Pin a released 0.8.3x.
- **EntryPoint v0.8 adoption** is still in flux as of August 2026; verify current SDK support before depending on it rather than assuming a tutorial's EntryPoint address is current.
- Several 2026 comparison and tutorial sources cited for ecosystem/trend context (ORM comparisons, Next.js/NestJS tutorials) are third-party blogs, not primary docs; version numbers here are cross-checked against official npm/GitHub/docs where possible, but treat trend framing as informed opinion.