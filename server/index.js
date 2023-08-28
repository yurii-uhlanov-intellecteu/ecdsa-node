const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { utf8ToBytes } = require("ethereum-cryptography/utils");
const { sha256 } = require("ethereum-cryptography/sha256.js");

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0278dc27a78e31ca685f69872b245f682018c0e5af473b28ad96fa3fd1f8761aa0": 100,
  "036fad0f29b4515d7efc13a0b87e57f2560c30ea498e59d2f63dbdc45df82bab34": 50,
  "03864f9c23eb38b0a9fc43ee616185218e9d3ee3deee9dad262795b448fa35299d": 75,
};

const transactions = [];

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { message, signature, recovery } = req.body;
  const { transactionId, recipient, amount } = message;

  const messageHash = sha256(utf8ToBytes(JSON.stringify(message)));
  const signatureInstance = secp256k1.Signature.fromDER(signature).addRecoveryBit(recovery);
  const sender = signatureInstance.recoverPublicKey(messageHash).toHex();

  if (!secp256k1.verify(signature, messageHash, sender)) {
    res.status(400).send({ message: "Signature is invalid" });
    return;
  }
  
  console.log(transactions);

  if (transactions.includes(transactionId)) {
    res.status(400).send({ message: "Such transaction ID exists" });
    return;
  }

  transactions.push(transactionId);

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
