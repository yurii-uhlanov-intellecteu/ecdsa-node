import { useState } from "react";
import server from "./server";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { toHex, utf8ToBytes } from "ethereum-cryptography/utils";
import { getRandomBytesSync } from "ethereum-cryptography/random.js";
import { sha256 } from "ethereum-cryptography/sha256.js";

function Transfer({ privateKey, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();
    const transactionId = toHex(getRandomBytesSync(32));
    const amount = parseInt(sendAmount);
    const message = { transactionId, amount, recipient }
    const messageHash = sha256(utf8ToBytes(JSON.stringify(message)));
    const signature = secp256k1.sign(toHex(messageHash), privateKey);

    try {
      const { data: { balance } } = await server.post(`send`, {
        message,
        signature: signature.toDERHex(),
        recovery: signature.recovery,
      });
      setBalance(balance);
    } catch (ex) {
      console.log(ex);
      alert(ex.response?.data?.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 036fad0f29b451...."
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
