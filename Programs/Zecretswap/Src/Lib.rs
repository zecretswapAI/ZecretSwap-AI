use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_error::ProgramError;

declare_id!("ZECRT1111111111111111111111111111111111111");

#[program]
pub mod zecretswap {
    use super::*;

    pub fn shielded_swap(
        ctx: Context<ShieldedSwap>,
        proof_a: [u8; 64],
        proof_b: [[u8; 64]; 2],
        proof_c: [u8; 64],
        public_signals: [u8; 64], // [commitment, nullifier]
    ) -> Result<()> {
        let vkey_data = &ctx.accounts.verification_key.data.borrow();
        let vkey_json: serde_json::Value = serde_json::from_slice(vkey_data)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        let proof = anchor_groth16::Groth16Proof {
            a: proof_a,
            b: proof_b,
            c: proof_c,
        };

        let public_inputs = [
            &public_signals[0..32],
            &public_signals[32..64],
        ];

        anchor_groth16::verify_groth16_proof(&vkey_json, &public_inputs, &proof)
            .map_err(|_| ProgramError::InvalidInstructionData)?;

        emit!(ShieldedSwapEvent {
            commitment: public_signals[0..32].to_vec(),
            nullifier: public_signals[32..64].to_vec(),
            payer: ctx.accounts.payer.key(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ShieldedSwap<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account()]
    pub verification_key: Account<'info, VerificationKey>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct VerificationKey {
    pub data: Vec<u8>,
}

#[event]
pub struct ShieldedSwapEvent {
    pub commitment: Vec<u8>,
    pub nullifier: Vec<u8>,
    pub payer: Pubkey,
}
