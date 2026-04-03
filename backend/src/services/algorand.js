const algosdk = require("algosdk");

// Create Algorand client
const algodClient = new algosdk.Algodv2(
  "",
  process.env.ALGORAND_NODE_URL,
  ""
);

// Indexer (for reading blockchain data)
const indexerClient = new algosdk.Indexer(
  "",
  process.env.ALGORAND_INDEXER_URL,
  ""
);

// App ID (you will update this after deploying contract)
const APP_ID = parseInt(process.env.APP_ID || "0");
const APP_ADDRESS = APP_ID !== 0 ? algosdk.getApplicationAddress(APP_ID) : "MOCK_APP_ADDRESS";

// 🧠 1. Get Contract Global State
async function getContractState() {
  try {
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();

    const state = {};

    const globalState = appInfo.params["global-state"] || [];

    for (const item of globalState) {
      const key = Buffer.from(item.key, "base64").toString();

      state[key] =
        item.value.type === 1
          ? Buffer.from(item.value.bytes, "base64").toString()
          : item.value.uint;
    }

    return state;

  } catch (err) {
    console.error("Error fetching contract state:", err);
    throw err;
  }
}


// 🧱 2. Build Smart Contract Call (UNSIGNED)
async function buildAppCallTxn(senderAddress, method, args = []) {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: APP_ID,
      onCompletion: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new TextEncoder().encode(method),
        ...args.map((arg) =>
          typeof arg === "string"
            ? new TextEncoder().encode(arg)
            : algosdk.encodeUint64(arg)
        ),
      ],
      suggestedParams,
    });

    return txn;

  } catch (err) {
    console.error("Error building app call txn:", err);
    throw err;
  }
}


// 💸 3. Build Payment Transaction (for escrow)
async function buildPayTxn(sender, receiver, amount) {
  try {
    console.log(`[PAYMENT BUILD] Checking Receiver: ${receiver}`);
    if (!receiver || receiver.length !== 58) {
       console.error(`[CRITICAL] Receiver is MALFORMED. Length: ${receiver ? receiver.length : 'undefined'}. Value: ${receiver}`);
    }

    const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: receiver,
      amount: parseInt(amount),
      suggestedParams,
    });

    return txn;

  } catch (err) {
    console.error("Error building payment txn:", err);
    throw err;
  }
}


// 📤 4. Submit Signed Transaction
async function submitSignedTxn(signedTxnPayload) {
  try {
    let groupedTxnBuffer;
    if (Array.isArray(signedTxnPayload)) {
      groupedTxnBuffer = Buffer.concat(signedTxnPayload.map((b64) => Buffer.from(b64, "base64")));
    } else {
      groupedTxnBuffer = Buffer.from(signedTxnPayload, "base64");
    }

    const { txId } = await algodClient
      .sendRawTransaction(groupedTxnBuffer)
      .do();

    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);

    return txId;

  } catch (err) {
    console.error("Error submitting txn:", err);
    throw err;
  }
}


// 📊 5. Get Transaction Info (for logs)
async function getTransaction(txId) {
  try {
    const txn = await indexerClient.lookupTransactionByID(txId).do();
    return txn;
  } catch (err) {
    console.error("Error fetching txn:", err);
    throw err;
  }
}


module.exports = {
  algodClient,
  indexerClient,
  buildAppCallTxn,
  buildPayTxn,
  submitSignedTxn,
  getContractState,
  getTransaction,
  APP_ID,
  APP_ADDRESS
};