/*
 * Warning: The reducer API in o1js is currently not safe to use in production applications. The `reduce()`
 * method breaks if more than the hard-coded number (default: 32) of actions are pending. Work is actively
 * in progress to mitigate this limitation.
 */
import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Permissions,
  MerkleWitness,
  MerkleMapWitness,
  PublicKey,
  Poseidon,
  AccountUpdate,
  UInt64,
  PrivateKey,
  Signature,
} from 'o1js';

class MerkleWitness8 extends MerkleWitness(8) {}

export class MinaCash extends SmartContract {
  @state(Field) unstableBalancesMapRoot = State<Field>();
  @state(Field) balancesMapRoot = State<Field>();
  @state(Field) reputationMapRoot = State<Field>();

  async deploy() {
    await super.deploy();
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method async initRoots(
    unstableBalancesMapRoot: Field,
    balancesMapRoot: Field,
    reputationMapRoot: Field
  ) {
    this.unstableBalancesMapRoot.set(unstableBalancesMapRoot);
    this.balancesMapRoot.set(balancesMapRoot);
    this.reputationMapRoot.set(reputationMapRoot);
  }

  @method async verifyDeposit(
    user: PublicKey,
    userWitness: MerkleMapWitness,
    previousBalance: Field
  ) {
    const currentBalancesMapRoot =
      this.unstableBalancesMapRoot.getAndRequireEquals();

    const [computedBalancesRoot, key1] =
      userWitness.computeRootAndKey(previousBalance);

    key1.assertEquals(Poseidon.hash(user.toFields()), 'User does not match');

    computedBalancesRoot.assertEquals(
      currentBalancesMapRoot,
      'Previous balance does not match'
    );

    const [newBalancesRoot, key2] = userWitness.computeRootAndKey(
      previousBalance.add(Field(100))
    );

    this.unstableBalancesMapRoot.set(newBalancesRoot);
  }

  @method async makeDeposit(
    user: PublicKey,
    unstableWitness: MerkleMapWitness,
    stableWitness: MerkleMapWitness,
    previousUnstableBalance: Field,
    previousStableBalance: Field
  ) {
    const unstableMapRoot = this.unstableBalancesMapRoot.getAndRequireEquals();
    const stableMapRoot = this.balancesMapRoot.getAndRequireEquals();

    // Check if unstable balance matches
    const [unstableBalancesRoot, key1] = unstableWitness.computeRootAndKey(
      previousUnstableBalance
    );
    unstableBalancesRoot.assertEquals(
      unstableMapRoot,
      "Unstable balance doesn't match"
    );
    key1.assertEquals(Poseidon.hash(user.toFields()), 'User does not match');

    // Check if stable balance matches
    const [stableBalancesRoot, key2] = stableWitness.computeRootAndKey(
      previousStableBalance
    );
    stableBalancesRoot.assertEquals(
      stableMapRoot,
      "Stable balance doesn't match"
    );
    key1.assertEquals(Poseidon.hash(user.toFields()), 'User does not match');

    // Calculate new unstable root
    const [newUnstableBalancesRoot, key3] = unstableWitness.computeRootAndKey(
      previousUnstableBalance.sub(Field(100))
    );

    this.unstableBalancesMapRoot.set(newUnstableBalancesRoot);

    // Calculate new stable root
    const [newStableBalancesRoot, key4] = stableWitness.computeRootAndKey(
      previousStableBalance.add(Field(100))
    );

    this.balancesMapRoot.set(newStableBalancesRoot);
  }

  @method async sendFunds(user: PublicKey) {
    // const payerUpdate = AccountUpdate.createSigned(user);
    // payerUpdate.send({
    //   to: this.address,
    //   amount: UInt64.from(100),
    // });
  }

  //TODO: Require Signature from sender
  @method async makePayment(
    amount: UInt64,
    sender: PublicKey,
    destination: PublicKey,
    senderWitness: MerkleMapWitness,
    previousBalance: Field,
    reputation: Field,
    senderSignature: Signature
  ) {
    const hash = Poseidon.hash(
      destination.toFields().concat(sender.toFields())
    ); // takes array of Fields, returns Field

    let msg = [hash];
    const validSig = senderSignature.verify(sender, msg);
    validSig.assertTrue('Invalid Signature');
    const currentBalancesMapRoot = this.balancesMapRoot.getAndRequireEquals();
    const currentReputationRoot = this.reputationMapRoot.getAndRequireEquals();

    // Check that previous balance is correct
    const [computedBalancesRoot, key1] =
      senderWitness.computeRootAndKey(previousBalance);
    computedBalancesRoot.assertEquals(currentBalancesMapRoot);

    // Check that previous reputation is correct
    const [rep, key3] = senderWitness.computeRootAndKey(reputation);
    rep.assertEquals(currentReputationRoot);

    // Check that balance >= amount
    previousBalance.assertGreaterThanOrEqual(amount.value);

    const [newBalancesRoot, key2] = senderWitness.computeRootAndKey(
      previousBalance.sub(amount.value)
    );

    const [newReputationRoot, key4] = senderWitness.computeRootAndKey(
      reputation.add(1)
    );

    key1.assertEquals(key2);

    this.balancesMapRoot.set(newBalancesRoot);
    this.reputationMapRoot.set(newReputationRoot);

    // Not working -> Invalid fee excess.
    this.send({ to: destination, amount: amount });
  }

  @method async getReputation(witness: MerkleWitness8, reputation: Field) {
    const currentReputationRoot = this.reputationMapRoot.getAndRequireEquals();
    const rep = witness.calculateRoot(reputation);

    currentReputationRoot.assertEquals(rep);
  }
}
