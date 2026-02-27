//! RAXION tokenomics program (testnet scaffolding).

use anchor_lang::prelude::*;
use anchor_spl::token::spl_token::instruction::AuthorityType;
use anchor_spl::token::{self, Mint, MintTo, SetAuthority, Token, TokenAccount};

pub mod vesting;

declare_id!("RaxToKen11111111111111111111111111111111111");

pub const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000;
pub const DECIMALS: u8 = 6;

#[program]
pub mod raxion_token {
    use super::*;

    /// Initialize $RAX genesis mint and burn mint authority.
    pub fn initialize_genesis(ctx: Context<InitializeGenesis>) -> Result<()> {
        token::mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.treasury_account.to_account_info(),
                    authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            TOTAL_SUPPLY,
        )?;

        token::set_authority(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                SetAuthority {
                    account_or_mint: ctx.accounts.mint.to_account_info(),
                    current_authority: ctx.accounts.mint_authority.to_account_info(),
                },
            ),
            AuthorityType::MintTokens,
            None,
        )?;

        emit!(GenesisComplete {
            total_supply: TOTAL_SUPPLY,
            treasury: ctx.accounts.treasury_account.key(),
            mint: ctx.accounts.mint.key(),
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeGenesis<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut)]
    pub mint_authority: Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub treasury_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct GenesisComplete {
    pub total_supply: u64,
    pub treasury: Pubkey,
    pub mint: Pubkey,
}
