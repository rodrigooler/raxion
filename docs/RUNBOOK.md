# RAXION Operational Runbook

**Last updated**: 2026-06-29

## Identifiers

| Resource | Value |
|---|---|
| Program ID | `5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT` |
| Wallet | `6LeyWdxSsnrJrqyXNBSd9PuH6c2mkETV6NawDs87vLK4` |
| Wallet path | `~/.config/solana/id.json` |
| Devnet RPC | `https://api.devnet.solana.com` |
| Testnet RPC | `https://api.testnet.solana.com` |
| Cloudflare Account | `0fdeec112211a86b30959041506f9593` |
| Cloudflare Zone | `17a26b101fe05b226a0fdd565a19c0c5` |

## 1. Deploy Program (devnet/testnet)

Replace `<devnet|testnet>` with the target network.

```bash
container run --rm --platform linux/amd64 \
  -v "$(pwd)":/work -v "$HOME/.config/solana":/home/raxion/.config/solana \
  -e HOME=/home/raxion -e CARGO_HOME=/work/.cargo-home -w /work \
  raxion/anchor-devnet:0.1 bash -c "
    solana config set --url <devnet|testnet> --keypair /home/raxion/.config/solana/id.json &&
    cargo build-sbf --manifest-path programs/raxion-poiq/Cargo.toml &&
    cp programs/raxion-poiq/target/deploy/raxion_poiq.so target/deploy/ &&
    solana program deploy target/deploy/raxion_poiq.so --program-id target/deploy/raxion_poiq-keypair.json"
```

Verify: the command prints `Program Id: 5JV...` and a transaction signature.

## 2. Seed Test Inferences

```bash
ln -sf apps/explorer/node_modules node_modules

# Devnet (20 inferences across all 4 categories)
node scripts/devnet_seed.mjs 20

# Testnet
SOLANA_RPC_URL=https://api.testnet.solana.com node scripts/devnet_seed.mjs 20
```

## 3. Deploy Explorer

```bash
cd apps/explorer
npm run build
CLOUDFLARE_API_TOKEN="<token>" npx vinext deploy --name raxion-explorer --skip-build
```

Live at: `devnet.raxion.network` / `testnet.raxion.network` (auto-detected by hostname).

## 4. Deploy Site

```bash
cd apps/site
npm run build
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages deploy out --project-name raxion
```

Live at: `raxion.network`

## 5. Check Program Health

```bash
node -e "
const { Connection, PublicKey } = require('@solana/web3.js');
const c = new Connection('https://api.devnet.solana.com');
c.getAccountInfo(new PublicKey('5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT'))
  .then(i => console.log('Executable:', i?.executable, '| Owner:', i?.owner.toBase58()));
"
```

Run from `apps/explorer/` (needs `@solana/web3.js` in node_modules).

## 6. Emergency Procedures

### 6a. Redeploy Program with Fix

1. Fix the code in `programs/raxion-poiq/src/`
2. Run `cargo test --workspace` to verify
3. Deploy using the command in Section 1
4. Seed new inferences to verify (Section 2)

### 6b. Purge Cloudflare Cache

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/17a26b101fe05b226a0fdd565a19c0c5/purge_cache" \
  -H "Authorization: Bearer <CLOUDFLARE_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'
```

### 6c. Roll Back Site Deployment

```bash
# List recent deployments
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages deployments list --project-name raxion

# Roll back to a specific deployment ID
CLOUDFLARE_API_TOKEN="<token>" npx wrangler pages deployments rollback <deployment-id> --project-name raxion
```

## 7. Monitoring

| What | URL |
|---|---|
| Devnet Explorer | https://devnet.raxion.network |
| Testnet Explorer | https://testnet.raxion.network |
| Site | https://raxion.network |
| GitHub Actions | https://github.com/rodrigooler/raxion/actions |

Explorer auto-refreshes every 30 seconds. Shows inference feed, event log, category distribution, and challenge/slash stats.

## 8. SOL Balance Management

```bash
# Devnet: CLI airdrop
container run --rm --platform linux/amd64 \
  -v "$HOME/.config/solana":/home/raxion/.config/solana \
  -e HOME=/home/raxion \
  raxion/anchor-devnet:0.1 bash -c "
    solana config set --url devnet --keypair /home/raxion/.config/solana/id.json &&
    solana airdrop 2 && solana balance"

# Testnet: use web faucet (CLI airdrop is unreliable)
# https://faucet.solana.com → select Testnet → paste wallet address
```

## 9. Run Tests

```bash
cargo test --workspace          # 74 Rust tests
.venv/bin/pytest poc/tests/ -v  # 23 Python tests
cd apps/explorer && npm run build  # Explorer build check
cd apps/site && npm run build      # Site build check
```

## 10. Contacts

| Role | Contact |
|---|---|
| Founder | Rodrigo Oler (GitHub: @rodrigooler) |
| Issues | https://github.com/rodrigooler/raxion/issues |
| Security | See SECURITY.md |
