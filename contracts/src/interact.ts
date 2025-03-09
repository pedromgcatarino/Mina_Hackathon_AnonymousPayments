import {
  AccountUpdate,
  Field,
  MerkleMap,
  Mina,
  PendingTransaction,
  PendingTransactionPromise,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
  UInt64,
} from 'o1js';
import { MinaCash } from './MinaCash.js';

const Local = await Mina.LocalBlockchain({ proofsEnabled: false });
Mina.setActiveInstance(Local);

// STORAGE
const balanceMap = new MerkleMap();
const unstableBalanceMap = new MerkleMap();
const txNullifierMap = new MerkleMap();
const reputationMap = new MerkleMap();

// GENERATE ACCOUNT KEYS
const deployerAccount = Local.testAccounts[0];
const deployerKey = Local.testAccounts[0].key;
const serverAccount = Local.testAccounts[1];
const serverKey = Local.testAccounts[1].key;
const userAccount = Local.testAccounts[2];
const userKey = Local.testAccounts[2].key;

const destinationAccount = Local.testAccounts[3];
const destinationKey = Local.testAccounts[3].key;
const destinationAddress = destinationKey.toPublicKey();

// DEPLOY CONTRACT
const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();
const zkApp = new MinaCash(zkAppAddress);

const deployTx = await Mina.transaction(deployerAccount, async () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  await zkApp.deploy();
  await zkApp.initRoots(
    unstableBalanceMap.getRoot(),
    balanceMap.getRoot(),
    reputationMap.getRoot()
  );
});
await deployTx.prove();
await deployTx.sign([deployerKey, zkAppPrivateKey]).send();

// MOCK SERVER

// Endpoint to receive proofs
async function verifyDeposit(publicKey: PublicKey) {
  const hashedKey = Poseidon.hash(publicKey.toFields());
  const witness = unstableBalanceMap.getWitness(hashedKey);
  const prevBalance = unstableBalanceMap.get(hashedKey);

  // call smart contract
  const tx = await Mina.transaction(serverAccount, async () => {
    zkApp.verifyDeposit(publicKey, witness, prevBalance);
  });
  await tx.prove();
  await tx.sign([serverKey]).send();

  unstableBalanceMap.set(hashedKey, prevBalance.add(Field(1000000)));

  console.log('Deposit verified');
  console.log('Current unstable balance: ' + unstableBalanceMap.get(hashedKey));
  console.log('Current stable balance: ' + balanceMap.get(hashedKey));
}

async function confirmDeposit(publicKey: PublicKey, txHash: Field) {
  const hashedKey = Poseidon.hash(publicKey.toFields());

  // check if txHash has been used already
  const nullifier = txNullifierMap.get(txHash);

  if (nullifier == Field(1)) {
    console.log('Deposit already confirmed');
    return;
  } else {
    txNullifierMap.set(txHash, Field(1));
    const unstableBalance = unstableBalanceMap.get(hashedKey);

    //Check if hash references a valid deposit
    const verified = true && unstableBalance.greaterThanOrEqual(Field(1000000));

    if (verified) {
      const unstableWitness = unstableBalanceMap.getWitness(hashedKey);
      const stableWitness = balanceMap.getWitness(hashedKey);

      const prevStableBalance = balanceMap.get(hashedKey);

      // call smart contract
      const tx = await Mina.transaction(serverAccount, async () => {
        zkApp.makeDeposit(
          publicKey,
          unstableWitness,
          stableWitness,
          unstableBalance,
          prevStableBalance
        );
      });
      await tx.prove();
      await tx.sign([serverKey]).send();

      balanceMap.set(hashedKey, prevStableBalance.add(Field(1000000)));
      unstableBalanceMap.set(hashedKey, unstableBalance.sub(Field(1000000)));

      console.log('Deposit made');
      console.log(
        'Current unstable balance: ' + unstableBalanceMap.get(hashedKey)
      );
      console.log('Current stable balance: ' + balanceMap.get(hashedKey));
    }
  }
}

async function makePayment(
  publicKey: PublicKey,
  amount: UInt64,
  destination: PublicKey
) {
  const hashedKey = Poseidon.hash(publicKey.toFields());
  const balance = balanceMap.get(hashedKey);
  const witness = balanceMap.getWitness(hashedKey);
  const reputation = reputationMap.get(hashedKey);
  const a = Mina.getAccount(destinationAddress);

  // call smart contract
  const tx = await Mina.transaction(serverAccount, async () => {
    let hash = Poseidon.hash(
      destination.toFields().concat(publicKey.toFields())
    ); // takes array of Fields, returns Field

    let msg = [hash];
    let sig = Signature.create(userKey, msg);
    //AccountUpdate.fundNewAccount(serverAccount, 2);

    zkApp.makePayment(
      amount,
      publicKey,
      destination,
      witness,
      balance,
      reputation,
      sig
    );
  });
  await tx.prove();
  await tx.sign([serverKey]).send();

  balanceMap.set(hashedKey, balance.sub(amount.value));
  reputationMap.set(hashedKey, reputation.add(1));

  console.log('Payment made');
  console.log('Current unstable balance: ' + unstableBalanceMap.get(hashedKey));
  console.log('Current stable balance: ' + balanceMap.get(hashedKey));
  console.log('Current reputation: ' + reputationMap.get(hashedKey));
}

// MOCK USER
// Ask server for deposit
await verifyDeposit(userAccount.key.toPublicKey());
// Send tx
// call smart contract
const tx = await Mina.transaction(userAccount, async () => {
  // Not working -> Error: Transaction failed with errors: [[],[["Cancelled"]],[["Cancelled"]],[["Overflow"]],[["Cancelled"]]]
  //AccountUpdate.fundNewAccount(userAccount);
  //zkApp.sendFunds(destinationAddress);
});
await tx.prove();
await tx.sign([userKey, destinationKey]).send();
console.log('Funds sent');

// GET HASH
//const res: PendingTransaction = await tx.sign([userKey]).send();
//const hash = res.hash;

await confirmDeposit(userAccount.key.toPublicKey(), Field(1));

await makePayment(
  userAccount.key.toPublicKey(),
  UInt64.from(100000),
  destinationAddress
);
