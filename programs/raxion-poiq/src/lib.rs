//! raxion-poiq - RAXION Proof of Inference Quality on-chain program.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::slot_hashes::SlotHashes;
use anchor_lang::solana_program::sysvar::Sysvar;

pub mod challenge;

declare_id!("5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT");

pub const COHERENCE_THRESHOLD_REJECT: f32 = 0.30;
pub const COHERENCE_THRESHOLD_STANDARD: f32 = 0.60;
pub const COHERENCE_THRESHOLD_HIGH: f32 = 0.85;

/// Whitepaper Trigger 1 base rate: 1%
pub const SLASH_RATE_IMMEDIATE_BPS: u16 = 100;
/// Whitepaper Trigger 2 base rate: 2%
pub const SLASH_RATE_CHALLENGE_BPS: u16 = 200;

pub const CHALLENGE_RATE_NEW_AGENT: u16 = 50; // 5.0%
pub const CHALLENGE_RATE_ESTABLISHED: u16 = 15; // 1.5%
pub const CHRONIC_MULTIPLIER_MIN_MILLI: u64 = 1_000;
pub const CHRONIC_MULTIPLIER_MAX_MILLI: u64 = 5_000;
pub const CHRONIC_MULTIPLIER_STEP_MILLI: u64 = 500;
pub const CHRONIC_BASE_FAILURES: u16 = 2;
pub const WARMUP_SLOTS: u64 = 518_400; // ~72h at ~2 slots/sec

#[account]
#[derive(Default)]
pub struct InferenceRecord {
    pub agent: Pubkey,
    pub inference_id: u64,
    pub slot: u64,
    pub coherence_score: f32,
    pub category: u8,
    pub is_final: bool,
    pub proof_hash: [u8; 32],
    pub output_hash_t: [u8; 32],
    pub output_hash_s: [u8; 32],
    pub timestamp: i64,
    pub challenged: bool,
    pub challenge_passed: Option<bool>,
    pub bump: u8,
}

impl InferenceRecord {
    pub const LEN: usize = 32 + 8 + 8 + 4 + 1 + 1 + 32 + 32 + 32 + 8 + 1 + 2 + 1;
}

#[account]
#[derive(Default)]
pub struct SlashRecord {
    pub agent: Pubkey,
    pub slash_amount: u64,
    pub trigger: u8,
    pub slot: u64,
    pub inference_id: u64,
    pub bump: u8,
}

impl SlashRecord {
    pub const LEN: usize = 32 + 8 + 1 + 8 + 8 + 1;
}

#[account]
#[derive(Default)]
pub struct AgentStakeAccount {
    pub agent: Pubkey,
    pub stake_amount: u64,
    pub bump: u8,
}

impl AgentStakeAccount {
    pub const LEN: usize = 32 + 8 + 1;
}

#[account]
#[derive(Default)]
pub struct CognitiveAccountState {
    pub agent: Pubkey,
    pub consecutive_failures: u16,
    pub staked_at_slot: u64,
    pub bump: u8,
}

impl CognitiveAccountState {
    pub const LEN: usize = 32 + 2 + 8 + 1;
}

#[program]
pub mod raxion_poiq {
    use super::*;

    /// Submit PoIQ Layer 1 convergence.
    /// Formula: CoherenceScore = 0.4*CS_semantic + 0.6*CC
    pub fn submit_convergence(
        ctx: Context<SubmitConvergence>,
        inference_id: u64,
        coherence_score: f32,
        proof_hash: [u8; 32],
        output_hash_t: [u8; 32],
        output_hash_s: [u8; 32],
    ) -> Result<()> {
        require!((0.0..=1.0).contains(&coherence_score), PoiqError::InvalidCoherenceScore);
        require!(proof_hash != [0u8; 32], PoiqError::MissingProof);

        let clock = Clock::get()?;
        let slot_hash = latest_slot_hash(&ctx.accounts.slot_hashes)?;
        let challenge_rate = if clock.slot.saturating_sub(ctx.accounts.cognitive_account.staked_at_slot)
            < WARMUP_SLOTS
        {
            CHALLENGE_RATE_NEW_AGENT
        } else {
            CHALLENGE_RATE_ESTABLISHED
        };
        let challenged = challenge::should_challenge(
            &slot_hash,
            inference_id,
            ctx.accounts.agent_stake.stake_amount,
            challenge_rate,
        );
        let record = &mut ctx.accounts.inference_record;

        record.agent = ctx.accounts.agent.key();
        record.inference_id = inference_id;
        record.slot = clock.slot;
        record.coherence_score = coherence_score;
        record.category = categorize_score(coherence_score);
        record.is_final = coherence_score >= COHERENCE_THRESHOLD_STANDARD && !challenged;
        record.proof_hash = proof_hash;
        record.output_hash_t = output_hash_t;
        record.output_hash_s = output_hash_s;
        record.timestamp = clock.unix_timestamp;
        record.challenged = challenged;
        record.challenge_passed = None;
        record.bump = ctx.bumps.inference_record;

        emit!(ConvergenceSubmitted {
            agent: record.agent,
            inference_id,
            coherence_score,
            is_final: record.is_final,
            challenged,
            slot: record.slot,
            timestamp: record.timestamp,
        });

        // SLASHING: Trigger 1 (immediate rejection) event emission path.
        if coherence_score < COHERENCE_THRESHOLD_REJECT {
            let slash =
                compute_immediate_slash(ctx.accounts.agent_stake.stake_amount, coherence_score);
            emit!(SlashTriggered {
                agent: record.agent,
                slash_amount: slash,
                trigger: 1,
                inference_id,
            });
        }

        Ok(())
    }

    /// Submit PoIQ Layer 2 challenge response.
    /// Formula reference: slash_challenge = stake * 0.02 * chronic_multiplier
    pub fn submit_challenge_response(
        ctx: Context<SubmitChallengeResponse>,
        inference_id: u64,
        response_hash: [u8; 32],
        is_correct: bool,
    ) -> Result<()> {
        require!(response_hash != [0u8; 32], PoiqError::MissingChallengeResponseHash);

        let record = &mut ctx.accounts.inference_record;
        require!(record.agent == ctx.accounts.agent.key(), PoiqError::UnauthorizedAgent);
        require!(record.challenged, PoiqError::NotChallenged);
        require!(record.challenge_passed.is_none(), PoiqError::AlreadyResponded);

        record.challenge_passed = Some(is_correct);
        let cognitive = &mut ctx.accounts.cognitive_account;

        // SLASHING: Trigger 2 (challenge failure) event emission path.
        if is_correct {
            cognitive.consecutive_failures = 0;
            record.is_final = record.coherence_score >= COHERENCE_THRESHOLD_STANDARD;
        } else {
            cognitive.consecutive_failures = cognitive.consecutive_failures.saturating_add(1);
            let chronic_multiplier_milli = derive_chronic_multiplier_milli(cognitive.consecutive_failures);
            let slash = compute_challenge_slash(
                ctx.accounts.agent_stake.stake_amount,
                chronic_multiplier_milli,
            );
            emit!(SlashTriggered {
                agent: record.agent,
                slash_amount: slash,
                trigger: 2,
                inference_id,
            });
        }

        emit!(ChallengeResponded {
            agent: record.agent,
            inference_id,
            passed: is_correct,
            response_hash,
        });

        Ok(())
    }
}

/// Trigger 1 slash with integer-safe arithmetic.
/// Formula: slash = stake * 0.01 * (1 - coherence/0.30)
fn compute_immediate_slash(stake_lamports: u64, coherence_score: f32) -> u64 {
    // factor in [0, 1], represented in micros to avoid float truncation to 0.
    let factor = if coherence_score >= COHERENCE_THRESHOLD_REJECT {
        0.0_f64
    } else {
        (f64::from(COHERENCE_THRESHOLD_REJECT) - f64::from(coherence_score))
            / f64::from(COHERENCE_THRESHOLD_REJECT)
    };

    let factor_micros = (factor * 1_000_000.0).round() as u128;
    let stake = u128::from(stake_lamports);
    let slash = stake
        .saturating_mul(u128::from(SLASH_RATE_IMMEDIATE_BPS))
        .saturating_mul(factor_micros)
        / 10_000
        / 1_000_000;

    slash.min(u128::from(u64::MAX)) as u64
}

/// Trigger 2 slash with integer-safe arithmetic.
/// Formula: slash = stake * 0.02 * chronic_multiplier
/// `chronic_multiplier_milli` uses 1000 == 1.0x, 1500 == 1.5x.
fn compute_challenge_slash(stake_lamports: u64, chronic_multiplier_milli: u16) -> u64 {
    let stake = u128::from(stake_lamports);
    let slash = stake
        .saturating_mul(u128::from(SLASH_RATE_CHALLENGE_BPS))
        .saturating_mul(u128::from(chronic_multiplier_milli))
        / 10_000
        / 1_000;

    slash.min(u128::from(u64::MAX)) as u64
}

fn derive_chronic_multiplier_milli(consecutive_failures: u16) -> u16 {
    let extra = u64::from(consecutive_failures.saturating_sub(CHRONIC_BASE_FAILURES));
    let value = CHRONIC_MULTIPLIER_MIN_MILLI
        .saturating_add(extra.saturating_mul(CHRONIC_MULTIPLIER_STEP_MILLI))
        .min(CHRONIC_MULTIPLIER_MAX_MILLI);
    value as u16
}

fn latest_slot_hash(slot_hashes_ai: &AccountInfo<'_>) -> Result<[u8; 32]> {
    let slot_hashes = SlotHashes::from_account_info(slot_hashes_ai)
        .map_err(|_| error!(PoiqError::InvalidSlotHashesSysvar))?;
    let (_, hash) = slot_hashes
        .first()
        .ok_or_else(|| error!(PoiqError::MissingSlotHash))?;
    Ok(hash.to_bytes())
}

fn categorize_score(coherence_score: f32) -> u8 {
    if coherence_score < COHERENCE_THRESHOLD_REJECT {
        0
    } else if coherence_score < COHERENCE_THRESHOLD_STANDARD {
        1
    } else if coherence_score < COHERENCE_THRESHOLD_HIGH {
        2
    } else {
        3
    }
}

#[derive(Accounts)]
#[instruction(inference_id: u64)]
pub struct SubmitConvergence<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        seeds = [b"stake", agent.key().as_ref()],
        bump = agent_stake.bump,
        constraint = agent_stake.agent == agent.key() @ PoiqError::StakeOwnerMismatch,
    )]
    pub agent_stake: Account<'info, AgentStakeAccount>,

    #[account(
        seeds = [b"cognitive", agent.key().as_ref()],
        bump = cognitive_account.bump,
        constraint = cognitive_account.agent == agent.key() @ PoiqError::CognitiveOwnerMismatch,
    )]
    pub cognitive_account: Account<'info, CognitiveAccountState>,

    /// CHECK: sysvar account address is enforced below.
    #[account(address = anchor_lang::solana_program::sysvar::slot_hashes::id())]
    pub slot_hashes: AccountInfo<'info>,

    #[account(
        init,
        payer = agent,
        space = 8 + InferenceRecord::LEN,
        seeds = [b"inference", agent.key().as_ref(), &inference_id.to_le_bytes()],
        bump,
    )]
    pub inference_record: Account<'info, InferenceRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(inference_id: u64)]
pub struct SubmitChallengeResponse<'info> {
    #[account(mut)]
    pub agent: Signer<'info>,

    #[account(
        seeds = [b"stake", agent.key().as_ref()],
        bump = agent_stake.bump,
        constraint = agent_stake.agent == agent.key() @ PoiqError::StakeOwnerMismatch,
    )]
    pub agent_stake: Account<'info, AgentStakeAccount>,

    #[account(
        mut,
        seeds = [b"cognitive", agent.key().as_ref()],
        bump = cognitive_account.bump,
        constraint = cognitive_account.agent == agent.key() @ PoiqError::CognitiveOwnerMismatch,
    )]
    pub cognitive_account: Account<'info, CognitiveAccountState>,

    #[account(
        mut,
        seeds = [b"inference", agent.key().as_ref(), &inference_id.to_le_bytes()],
        bump = inference_record.bump,
    )]
    pub inference_record: Account<'info, InferenceRecord>,
}

#[event]
pub struct ConvergenceSubmitted {
    pub agent: Pubkey,
    pub inference_id: u64,
    pub coherence_score: f32,
    pub is_final: bool,
    pub challenged: bool,
    pub slot: u64,
    pub timestamp: i64,
}

#[event]
pub struct SlashTriggered {
    pub agent: Pubkey,
    pub slash_amount: u64,
    pub trigger: u8,
    pub inference_id: u64,
}

#[event]
pub struct ChallengeResponded {
    pub agent: Pubkey,
    pub inference_id: u64,
    pub passed: bool,
    pub response_hash: [u8; 32],
}

#[error_code]
pub enum PoiqError {
    #[msg("CoherenceScore must be in [0.0, 1.0]")]
    InvalidCoherenceScore,

    #[msg("Proof hash cannot be zero")]
    MissingProof,

    #[msg("Challenge response hash cannot be zero")]
    MissingChallengeResponseHash,

    #[msg("Agent is not owner of this inference record")]
    UnauthorizedAgent,

    #[msg("Inference was not challenged")]
    NotChallenged,

    #[msg("Challenge response already submitted")]
    AlreadyResponded,

    #[msg("Stake account owner mismatch")]
    StakeOwnerMismatch,

    #[msg("Cognitive account owner mismatch")]
    CognitiveOwnerMismatch,

    #[msg("Invalid slot-hashes sysvar account")]
    InvalidSlotHashesSysvar,

    #[msg("No slot hash available")]
    MissingSlotHash,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_categorize_score_boundaries() {
        assert_eq!(categorize_score(0.10), 0);
        assert_eq!(categorize_score(0.45), 1);
        assert_eq!(categorize_score(0.70), 2);
        assert_eq!(categorize_score(0.90), 3);
    }

    #[test]
    fn test_immediate_slash_not_zero_for_rejected() {
        let stake = 1_000_000u64;
        let slash = compute_immediate_slash(stake, 0.10);
        assert!(slash > 0);
    }

    #[test]
    fn test_immediate_slash_zero_at_threshold() {
        let stake = 1_000_000u64;
        let slash = compute_immediate_slash(stake, 0.30);
        assert_eq!(slash, 0);
    }

    #[test]
    fn test_challenge_slash_whitepaper_rate() {
        let stake = 1_000_000u64;
        // 2% with 1.0x multiplier
        let slash = compute_challenge_slash(stake, 1000);
        assert_eq!(slash, 20_000);
    }

    #[test]
    fn test_challenge_slash_multiplier() {
        let stake = 1_000_000u64;
        // 2% with 1.5x multiplier => 30_000
        let slash = compute_challenge_slash(stake, 1500);
        assert_eq!(slash, 30_000);
    }

    #[test]
    fn test_derive_chronic_multiplier_bounds() {
        assert_eq!(derive_chronic_multiplier_milli(0), 1_000);
        assert_eq!(derive_chronic_multiplier_milli(2), 1_000);
        assert_eq!(derive_chronic_multiplier_milli(3), 1_500);
        assert_eq!(derive_chronic_multiplier_milli(10), 5_000);
    }
}
