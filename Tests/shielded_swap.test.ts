import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Zecretswap } from '../target/types/zecretswap';
import { generateShieldedSwapProof, formatProofForSolana } from '../sdk/src/proof';
import fs from 'fs';
import path from 'path';

describe('zecretswap', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Zecretswap as Program<Zecretswap>;

  it('verifies shielded swap', async () => {
    const vkeyData = fs.readFileSync(
      path.join(__dirname, '../circuits/build/verification_key.json')
    );
    const vkeyAccount = anchor.web3.Keypair.generate();

    // Upload vkey (assume initializeVkey exists or skip for test)
    // await program.methods.initializeVkey(...)

    const input = {
      inputAmount: 1000000n,
      outputTokenId: 1n,
      nullifier: 12345n,
      secret: 999888777666555444333222111n,
      randomness: BigInt(Date.now()),
    };

    const { proof, publicSignals } = await generateShieldedSwapProof(input);
    const { proof_a, proof_b, proof_c } = formatProofForSolana(proof);

    const pubSigBytes = new Uint8Array(64);
    pubSigBytes.set(Uint8Array.from(Buffer.from(publicSignals[0].slice(2), 'hex').slice(0, 32)), 0);
    pubSigBytes.set(Uint8Array.from(Buffer.from(publicSignals[1].slice(2), 'hex').slice(0, 32)), 32);

    await program.methods
      .shieldedSwap(
        Array.from(proof_a),
        proof_b.map(b => Array.from(b)),
        Array.from(proof_c),
        Array.from(pubSigBytes)
      )
      .accounts({
        payer: provider.wallet.publicKey,
        verificationKey: vkeyAccount.publicKey,
      })
      .rpc();
  });
});
