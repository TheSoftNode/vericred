# VeriCred+ Setup Guide

See .env.local.example for complete setup instructions.

## Quick Setup Steps

1. **Install dependencies**:
   ```bash
   cd frontend && pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.local.example .env.local
   # Then fill in the values following the instructions in .env.local.example
   ```

3. **Initialize database**:
   ```bash
   npx tsx frontend/lib/database/init.ts
   ```

4. **Deploy contracts** (if not already deployed)

5. **Deploy Envio indexer** (if not already deployed)

6. **Start dev server**:
   ```bash
   cd frontend && pnpm dev
   ```

For detailed step-by-step instructions, see the comments in `.env.local.example`.
