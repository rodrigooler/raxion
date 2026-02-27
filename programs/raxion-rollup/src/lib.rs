//! RAXION Sovereign Rollup — state root commitments.

use anchor_lang::prelude::*;

declare_id!("5JVFMV1DvhQD6Tm2BtPBs8zkvGArzRGUYF6GSNw2XUeT");

#[program]
pub mod raxion_rollup {
    use super::*;

    /// Commit a Neural SVM state root to Solana.
    pub fn commit_state_root(
        ctx: Context<CommitStateRoot>,
        neural_svm_slot: u64,
        state_root: [u8; 32],
        inference_batch_root: [u8; 32],
        memory_root: [u8; 32],
        agent_count: u32,
        inference_count: u32,
    ) -> Result<()> {
        let commitment = &mut ctx.accounts.state_commitment;
        commitment.neural_svm_slot = neural_svm_slot;
        commitment.state_root = state_root;
        commitment.inference_batch_root = inference_batch_root;
        commitment.memory_root = memory_root;
        commitment.agent_count = agent_count;
        commitment.inference_count = inference_count;
        commitment.l1_slot = Clock::get()?.slot;
        commitment.committed_by = ctx.accounts.sequencer.key();
        commitment.bump = ctx.bumps.state_commitment;

        emit!(StateRootCommitted {
            neural_svm_slot,
            state_root,
            l1_slot: commitment.l1_slot,
            committed_by: commitment.committed_by,
        });
        Ok(())
    }
}

#[account]
pub struct StateCommitment {
    pub neural_svm_slot: u64,
    pub state_root: [u8; 32],
    pub inference_batch_root: [u8; 32],
    pub memory_root: [u8; 32],
    pub agent_count: u32,
    pub inference_count: u32,
    pub l1_slot: u64,
    pub committed_by: Pubkey,
    pub bump: u8,
}

impl StateCommitment {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 4 + 4 + 8 + 32 + 1;
}

#[derive(Accounts)]
#[instruction(neural_svm_slot: u64)]
pub struct CommitStateRoot<'info> {
    #[account(mut)]
    pub sequencer: Signer<'info>,
    #[account(
        init,
        payer = sequencer,
        space = 8 + StateCommitment::LEN,
        seeds = [b"state_root".as_ref(), &neural_svm_slot.to_le_bytes()],
        bump,
    )]
    pub state_commitment: Account<'info, StateCommitment>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct StateRootCommitted {
    pub neural_svm_slot: u64,
    pub state_root: [u8; 32],
    pub l1_slot: u64,
    pub committed_by: Pubkey,
}
