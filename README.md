# DealShield

DealShield is a fully open-source decentralized marketplace on the Solana blockchain. It features a built-in on-chain escrow system to ensure safe transactions between buyers and sellers.

## Features

- **User Authentication**: Wallet-based (Phantom, Backpack).
- **Product Listings**: Decentralized listings with IPFS storage.
- **Payments**: SOL support.
- **Escrow**: On-chain escrow with timeout and dispute resolution.
- **Fees**: Fixed 0.01 SOL fee per transaction.

## Project Structure

- `frontend/`: Next.js application (React, Tailwind CSS).
- `backend/`: Node.js Express server for indexing and webhooks.
- `programs/`: Solana Smart Contract (Anchor/Rust).

## Getting Started

### Prerequisites

- Node.js & npm/yarn
- Rust & Cargo (for smart contract)
- Solana CLI & Anchor (for smart contract)

### 1. Run the Backend

The backend handles off-chain data and webhooks.

```bash
cd backend
npm install
npm start
```
Server runs on `http://localhost:3001`.

### 2. Run the Frontend

The frontend is the user interface for the marketplace.

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Build Smart Contract (Optional)

If you have Rust and Anchor installed:

```bash
cd programs/dealshield
anchor build
anchor test
```

## License

MIT License. See [LICENSE](LICENSE) for details.
