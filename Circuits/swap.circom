pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

template ShieldedSwap() {
    signal input inputAmount;
    signal input outputTokenId;
    signal input nullifier;
    signal input secret;
    signal input randomness;

    signal output commitment;
    signal output outputHash;

    // Commitment = Poseidon(inputAmount, outputTokenId, secret, randomness)
    component commitmentHasher = Poseidon(4);
    commitmentHasher.inputs[0] <== inputAmount;
    commitmentHasher.inputs[1] <== outputTokenId;
    commitmentHasher.inputs[2] <== secret;
    commitmentHasher.inputs[3] <== randomness;
    commitment <== commitmentHasher.out;

    // Nullifier = Poseidon(secret, nullifier)
    component nullifierHasher = Poseidon(2);
    nullifierHasher.inputs[0] <== secret;
    nullifierHasher.inputs[1] <== nullifier;
    signal nullifierHash <== nullifierHasher.out;

    // Output hash = Poseidon(inputAmount, outputTokenId)
    component outputHasher = Poseidon(2);
    outputHasher.inputs[0] <== inputAmount;
    outputHasher.inputs[1] <== outputTokenId;
    outputHash <== outputHasher.out;

    // Enforce inputAmount > 0
    component isPositive = GreaterThan(252);
    isPositive.in[0] <== inputAmount;
    isPositive.in[1] <== 0;
    isPositive.out === 1;
}

component main {public [commitment, nullifier]} = ShieldedSwap();
