# NOTE3

A decentralized note-taking application built on 0G Storage with real-time Markdown editing and blockchain integration.

## Features

- **Real-time Markdown Editor**: Split-panel editor with live preview
- **0G Storage Integration**: Decentralized storage on 0G blockchain
- **Wallet Connection**: MetaMask and WalletConnect support via RainbowKit
- **Tab Key Support**: Full Tab key input support in editor
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript Support**: Full type safety across the application

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript 5.3
- **Blockchain**: 0G Storage SDK (@0glabs/0g-ts-sdk), ethers.js 6.13, wagmi 2.16, viem 2.33
- **UI**: Tailwind CSS 3.4, React Markdown 9.0
- **Wallet**: RainbowKit 2.2, MetaMask, WalletConnect
- **Build Tools**: Turbo 1.12, pnpm 8.15
- **Package Manager**: pnpm

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd note3
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Build the SDK**
   ```bash
   pnpm build
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## Environment Variables

```env
# 0G Storage Configuration
NEXT_PUBLIC_OG_ENDPOINT=https://evmrpc-testnet.0g.ai/
NEXT_PUBLIC_OG_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
NEXT_PUBLIC_OG_GATEWAY=https://gateway.0g.ai/ipfs/

# Wallet Configuration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id_here
```

## Project Structure

```
note3/
├── apps/
│   └── web/                 # Next.js web application
│       ├── app/             # App Router pages and API routes
│       │   ├── api/         # API endpoints
│       │   ├── new/         # Create new note page
│       │   ├── note/[id]/   # Individual note view page
│       │   ├── globals.css  # Global styles
│       │   ├── layout.tsx   # Root layout
│       │   ├── page.tsx     # Home page
│       │   └── providers.tsx # Context providers
│       ├── src/
│       │   ├── components/  # React components
│       │   │   ├── GlobalLoadingSpinner.tsx
│       │   │   ├── LoadingSpinner.tsx
│       │   │   ├── NavBar.tsx
│       │   │   └── PageLoadingSpinner.tsx
│       │   ├── lib/         # Utility functions and configurations
│       │   │   ├── 0g-storage.ts  # 0G storage utilities
│       │   │   ├── config.ts      # App configuration
│       │   │   ├── note.ts        # Note-related utilities
│       │   │   └── wagmi.ts       # Wagmi configuration
│       │   └── components/        # UI components
│       ├── next.config.js   # Next.js configuration
│       ├── tailwind.config.js # Tailwind CSS configuration
│       └── package.json
├── packages/
│   ├── sdk/                 # 0G Storage SDK wrapper
│   │   ├── src/
│   │   │   ├── encrypt.ts   # Encryption utilities
│   │   │   ├── hash.ts      # Hashing functions
│   │   │   ├── index.ts     # Main SDK exports
│   │   │   ├── nft.ts       # NFT-related functions
│   │   │   ├── registry.ts  # Registry operations
│   │   │   └── storage.ts   # Storage operations
│   │   └── package.json
│   └── types/               # TypeScript type definitions
│       ├── src/
│       │   ├── index.ts     # Type exports
│       │   └── note.ts      # Note-related types
│       └── package.json
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── turbo.json               # Turbo build configuration
└── package.json             # Root package configuration
```

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the navigation bar
2. **Create Note**: Navigate to `/new` to create a new note
3. **Edit Markdown**: Use the split-panel editor with live preview
4. **Save to 0G**: Click "Save Note" to store on 0G blockchain
5. **View Notes**: Access your notes from the home page


## Dependencies

### Core Dependencies
- **@0glabs/0g-ts-sdk**: Official 0G Labs TypeScript SDK
- **ethers**: Ethereum library for blockchain interactions
- **wagmi**: React hooks for Ethereum
- **viem**: TypeScript interface for Ethereum
- **@rainbow-me/rainbowkit**: Wallet connection UI components

### Development Dependencies
- **turbo**: Monorepo build system
- **typescript**: Type checking and compilation
- **tailwindcss**: Utility-first CSS framework

## License

MIT License - see the [LICENSE](LICENSE) file for details.
