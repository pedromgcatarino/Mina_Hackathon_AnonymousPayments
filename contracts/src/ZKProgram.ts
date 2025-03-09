// ===============================================================~

// Not used for now

/*
import { Field, MerkleMapWitness, Provable, PublicKey, ZkProgram } from 'o1js';

const Deposit = ZkProgram({
  name: 'deposit-proof',
  methods: {
    create: {
      privateInputs: [PublicKey, MerkleMapWitness, Field],
      async method(
        user: PublicKey,
        userWitness: MerkleMapWitness,
        previousBalance: Field
      ) {
        
        const currentBalancesMapRoot =
          this.balancesMapRoot.getAndRequireEquals();

        const [computedBalancesRoot, key1] =
          userWitness.computeRootAndKey(previousBalance);

        key1.assertEquals(
          Poseidon.hash(user.toFields()),
          'User does not match'
        );

        computedBalancesRoot.assertEquals(
          currentBalancesMapRoot,
          'previous balance does not match'
        );

        const [newBalancesRoot, key2] = userWitness.computeRootAndKey(
          previousBalance.add(amount)
        );

        key1.assertEquals(key2, 'Keys do not match');

        this.balancesMapRoot.set(newBalancesRoot);

        const payerUpdate = AccountUpdate.createSigned(user);
        payerUpdate.send({
          to: this.address,
          amount: UInt64.from(amount.toBigInt()),
        });
      },
    },

    makeDonation: {
      privateInputs: [SelfProof, Field, PrivateKey, MerkleWitness20],

      async method(
        newState: FundState,
        earlierProof: SelfProof<FundState, void>,
        amount: Field,
        destination: PublicKey,
        donator: PrivateKey,
        donatorWitness: MerkleWitness20
      ) {
        earlierProof.verify();
        const computedState = FundState.makeDonation(
          earlierProof.publicInput,
          amount,
          donator,
          donatorWitness
        );
        FundState.assertEquals(computedState, newState);

        const payerUpdate = AccountUpdate.createSigned(donator.toPublicKey());
        payerUpdate.send({
          to: destination,
          amount: UInt64.from(amount.toBigInt()),
        });
      },
    },
  },
});

export let FundProof_ = ZkProgram.Proof(Fund);
export class FundProof extends FundProof_ {}
*/
