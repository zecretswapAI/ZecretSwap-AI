import { groth16 } from 'snarkjs';
import path from 'path';

const ZKEY_PATH = path.join(__dirname, '../../circuits/build/swap_0001.zkey');
const WASM_PATH = path.join(__dirname, '../../circuits/build/swap.wasm');

export interface SwapInput {
  inputAmount: bigint;
  outputTokenId: bigint;
  nullifier: bigint;
  secret: bigint;
  randomness: bigint;
}

export async function generateShieldedSwapProof(
  input: SwapInput
): Promise<{ proof: any; publicSignals: string[] }> {
  const { proof, publicSignals } = await groth16.fullProve(
    {
      inputAmount: input.inputAmount.toString(),
      outputTokenId: input.outputTokenId.toString(),
      nullifier: input.nullifier.toString(),
      secret: input.secret.toString(),
      randomness: input.randomness.toString(),
    },
    WASM_PATH,
    ZKEY_PATH
  );
  return { proof, publicSignals };
}

export function formatProofForSolana(proof: any) {
  const toBytes = (hex: string): Uint8Array => {
    const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = Uint8Array.from(
      clean.match(/.{2}/g)!.map(b => parseInt(b, 16))
    );
    return bytes.length === 64 ? bytes : Uint8Array.from([...bytes, ...new Uint8Array(64 - bytes.length)]);
  };

  return {
    proof_a: toBytes(proof.pi_a[0]),
    proof_b: [toBytes(proof.pi_b[0][1]), toBytes(proof.pi_b[0][0])],
    proof_c: toBytes(proof.pi_c[0]),
  };
}
