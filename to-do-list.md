# NFT Ticketing Marketplace with ERC-4337 Account Abstraction
## Final Thesis Master Roadmap

Author: Benedictus Leonardo Edward Stephen Sugianto
Focus:
- ERC-4337 Account Abstraction
- NFT Ticketing
- Commit-Reveal Scheme
- Soulbound NFT
- Ethereum Sepolia

---

# 1. CORE THESIS POSITIONING

## Real Differentiator

This thesis is NOT:
- another NFT marketplace
- another event booking system
- another blockchain CRUD app

This thesis IS:
> An anti-scalping NFT ticketing architecture using ERC-4337 smart accounts and commit-reveal protection.

If examiner asks:
"Kenapa harus blockchain?"

Answer:
- Ticket ownership must be publicly verifiable
- Ticket transfer rules must be enforced by code
- Secondary market restrictions require immutable enforcement
- Front-running mitigation requires transparent on-chain ordering

---

# 2. MAIN RESEARCH CONTRIBUTION

## Contribution #1
ERC-4337 onboarding abstraction:
- email login
- passkey authentication
- automatic smart wallet creation
- gasless transaction via paymaster

## Contribution #2
Commit-reveal scheme:
- hidden ticket purchase intent
- front-running mitigation
- fairer flash sale

## Contribution #3
Soulbound NFT restriction:
- transfer blocked
- resale only through marketplace
- anti-scalping enforcement

---

# 3. SYSTEM ARCHITECTURE

## Frontend
Stack:
- Next.js
- Tailwind
- Wagmi
- Viem
- Tanstack Query

Responsibilities:
- login/register
- flash sale UI
- ticket marketplace
- QR verification
- wallet abstraction UX

---

## Backend
Stack:
- NestJS
- MySQL
- TypeORM
- Redis (optional)
- BullMQ (optional)

Responsibilities:
- Midtrans webhook
- event management
- metadata generation
- IPFS upload
- relayer/paymaster orchestration
- flash sale queue handling

---

## Blockchain Layer

### Contract 1 — TicketNFT.sol
Responsibilities:
- mint ticket NFT
- soulbound restriction
- used ticket tracking
- original price tracking
- resale authorization

### Contract 2 — FlashSale.sol
Responsibilities:
- commit phase
- reveal phase
- timestamp ordering
- ticket allocation
- refund handling

Optional:
- Marketplace.sol if architecture becomes too crowded

---

## Infrastructure

Blockchain:
- Ethereum Sepolia

RPC:
- Alchemy

Storage:
- Pinata IPFS

AA Provider:
- ZeroDev / Pimlico

Payment:
- Midtrans Sandbox

---

# 4. SMART CONTRACT TODO

# PRIORITY ORDER IS CRITICAL

Most students fail because they build frontend first.

DO NOT TOUCH FRONTEND BEFORE CONTRACTS WORK.

---

## Phase 1 — ERC-721 Foundation

### TODO
- [ ] Setup Foundry
- [ ] Setup OpenZeppelin
- [ ] Create TicketNFT.sol
- [ ] Implement ERC721
- [ ] Mint function
- [ ] Token URI support
- [ ] Access control

### Deliverable
Basic NFT minting works on Sepolia

---

## Phase 2 — Soulbound Restriction

### TODO
- [ ] Override transfer logic
- [ ] Block safeTransferFrom
- [ ] Block transferFrom
- [ ] Allow transfer only from marketplace
- [ ] Add usedTickets mapping
- [ ] Add originalPrice mapping

### Deliverable
NFT cannot be transferred outside marketplace

---

## Phase 3 — Marketplace Logic

### TODO
- [ ] Create resale listing
- [ ] Enforce original price lock
- [ ] Buy resale ticket
- [ ] Cancel listing
- [ ] Ownership update

### Deliverable
Resale only at original price

---

## Phase 4 — Commit Reveal

### TODO
- [ ] Commit hash generation
- [ ] Store commit hash
- [ ] Reveal function
- [ ] Validate reveal
- [ ] Prevent double reveal
- [ ] Timestamp ordering
- [ ] Winner selection
- [ ] Refund losers

### Deliverable
Anti-front-running flash sale system

---

## Phase 5 — ERC-4337

### TODO
- [ ] Learn UserOperation flow
- [ ] Setup bundler
- [ ] Setup paymaster
- [ ] Smart account creation
- [ ] Gas sponsorship
- [ ] Passkey authentication

### Deliverable
Users can interact without MetaMask or ETH

---

# 5. FRONTEND TODO

## Authentication
- [ ] Register
- [ ] Login
- [ ] Email verification
- [ ] Passkey support

## Marketplace
- [ ] Event listing
- [ ] Ticket purchase
- [ ] Flash sale page
- [ ] Resale page
- [ ] My Tickets page

## Verification
- [ ] QR generation
- [ ] QR scanning page
- [ ] markUsed flow

---

# 6. BACKEND TODO

## User System
- [ ] User entity
- [ ] JWT auth
- [ ] Email verification
- [ ] Session management

## Event System
- [ ] Create event
- [ ] Ticket category
- [ ] Flash sale scheduling

## Blockchain Integration
- [ ] Contract interaction service
- [ ] Transaction monitoring
- [ ] IPFS metadata upload

## Payment
- [ ] Midtrans integration
- [ ] Webhook verification
- [ ] Payment confirmation

---

# 7. DATABASE TABLES

## Essential Tables

### users
- id
- email
- wallet_address
- passkey_id

### events
- id
- name
- venue
- start_time

### ticket_categories
- id
- event_id
- quota
- price

### orders
- id
- user_id
- payment_status

### nft_cache
- token_id
- owner
- metadata_uri

### flash_sale_commits
- commit_hash
- reveal_status
- timestamp

### resale_listings
- token_id
- seller
- status

---

# 8. SECURITY TESTING CHECKLIST

## Smart Contract Security

### Transfer Restriction
- [ ] Direct transfer fails
- [ ] Marketplace transfer works

### Front Running
- [ ] Mempool attacker cannot infer target ticket
- [ ] Reveal validation works

### Replay Protection
- [ ] Cannot reuse reveal data

### Double Spending
- [ ] Used ticket cannot be reused

### Access Control
- [ ] Unauthorized mint blocked

---

# 9. TESTING STRATEGY

## Unit Testing
Use:
- Foundry

Coverage:
- mint
- transfer restriction
- resale
- commit reveal

---

## Integration Testing

Test:
- frontend -> backend
- backend -> blockchain
- webhook -> mint flow

---

## User Validation

Measure:
- usability
- onboarding simplicity
- understanding of blockchain abstraction

Use:
- SUS questionnaire

---

# 10. THESIS WRITING STRATEGY

## Biggest Mistake

Most students:
- build system first
- write thesis later

Wrong.

You should write in parallel.

---

## Chapter Strategy

### BAB 1
Finish early:
- background
- problem statement
- scope

### BAB 2
Continuous:
- ERC-4337
- NFT
- account abstraction
- commit reveal
- soulbound token

### BAB 3
Write while designing:
- architecture
- ERD
- sequence diagram
- flowchart

### BAB 4
Write while implementing:
- screenshots
- contract explanation
- API explanation

### BAB 5
Write after testing:
- conclusion
- limitations
- future work

---

# 11. HIGH RISK AREAS

## Risk #1 — ERC-4337 Complexity
This is your hardest technical area.

You must deeply understand:
- EntryPoint
- UserOperation
- Bundler
- Paymaster
- Smart Accounts

Without understanding flow internally,
your TA defense will collapse under questioning.

---

## Risk #2 — Overengineering
Do NOT:
- build full production marketplace
- build seat map system
- build analytics dashboard

Focus only on:
- anti-scalping
- account abstraction
- ticket ownership security

---

## Risk #3 — Frontend Time Sink
Frontend can consume 70% of time if uncontrolled.

UI only needs:
- clean
- understandable
- functional

Not startup-level polish.

---

# 12. LEARNING PRIORITY

## Priority 1
Ethereum fundamentals
- calldata
- msg.sender
- events
- mappings
- gas

## Priority 2
ERC-721 internals

## Priority 3
Foundry testing

## Priority 4
ERC-4337 architecture

## Priority 5
Frontend polish

---

# 13. SUGGESTED TIMELINE

## Month 1
- Foundry
- ERC721
- Soulbound logic

## Month 2
- Commit reveal
- Marketplace
- Testing

## Month 3
- ERC4337 integration
- Paymaster
- Smart account

## Month 4
- Backend integration
- Midtrans
- IPFS

## Month 5
- Frontend
- UX
- Validation testing

## Month 6
- Thesis writing
- Revision
- Defense preparation

---

# 14. DEFENSE PREPARATION

You MUST be able to answer:

## Why ERC-4337 instead of MetaMask?
## Why commit-reveal instead of queue?
## Why Soulbound?
## Why blockchain instead of centralized DB?
## Why Ethereum Sepolia?
## Why not use Solana?
## How does paymaster work?
## What prevents scalping outside platform?
## What data is on-chain vs off-chain?
## What happens if backend dies?
## What happens if IPFS metadata disappears?

---

# 15. LLM MEMORY BLOCK

## IMPORTANT CONTEXT FOR FUTURE LLM SESSIONS

Project:
NFT Ticketing Marketplace Thesis

Core Stack:
- Next.js
- NestJS
- MySQL
- Solidity
- Foundry
- ERC-4337
- ZeroDev
- Alchemy
- Pinata
- Midtrans

Blockchain:
Ethereum Sepolia

Core Features:
- NFT ticket minting
- Soulbound restriction
- Commit reveal flash sale
- ERC4337 smart accounts
- Gasless transactions
- Resale price locking

Research Focus:
- Anti-scalping
- Anti-front-running
- Web2-like onboarding UX for blockchain apps

Priority:
Smart contracts first.
Frontend last.

Critical Differentiator:
ERC-4337 expertise.