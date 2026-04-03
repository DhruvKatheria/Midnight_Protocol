const algosdk = require("algosdk");
const fs = require("fs");
const path = require("path");

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

// App ID defaults
const DEFAULT_APP_ID = parseInt(process.env.APP_ID || "0");
const DEFAULT_APP_ADDRESS = DEFAULT_APP_ID !== 0 ? algosdk.getApplicationAddress(DEFAULT_APP_ID) : "MOCK_APP_ADDRESS";

// 🚀 Deploy Contract Programmatically
async function deployBountyContract() {
  try {
    const mnemonic = process.env.ALGORAND_MNEMONIC;
    if (!mnemonic) throw new Error("ALGORAND_MNEMONIC not set in .env");

    const deployerAccount = algosdk.mnemonicToSecretKey(mnemonic);

    const baseDir = path.resolve(__dirname, "../../../smart-contracts/artifacts");
    const approvalTeal = fs.readFileSync(path.join(baseDir, "approval.teal"), "utf8");
    const clearTeal = fs.readFileSync(path.join(baseDir, "clear.teal"), "utf8");

    const approvalCompiled = await algodClient.compile(approvalTeal).do();
    const clearCompiled = await algodClient.compile(clearTeal).do();

    const approvalProgram = new Uint8Array(Buffer.from(approvalCompiled.result, "base64"));
    const clearProgram = new Uint8Array(Buffer.from(clearCompiled.result, "base64"));

    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeApplicationCreateTxnFromObject({
      from: deployerAccount.addr,
      suggestedParams,
      onCompletion: algosdk.OnApplicationComplete.NoOpOC,
      approvalProgram,
      clearProgram,
      numGlobalInts: 5,
      numGlobalByteSlices: 7,
      numLocalInts: 0,
      numLocalByteSlices: 0,
    });

    const signedTxn = txn.signTxn(deployerAccount.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 6);
    
    const appId = confirmedTxn["application-index"];
    const appAddress = algosdk.getApplicationAddress(appId);

    // Fund the App with 0.2 ALGO
    const fundParams = await algodClient.getTransactionParams().do();
    const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: deployerAccount.addr,
        to: appAddress,
        amount: 200000,
        suggestedParams: fundParams
    });
    const signedFundTxn = fundTxn.signTxn(deployerAccount.sk);
    const fundRes = await algodClient.sendRawTransaction(signedFundTxn).do();
    await algosdk.waitForConfirmation(algodClient, fundRes.txId, 6);

    return { appId, appAddress };
  } catch (err) {
    console.error("Failed to deploy bounty contract:", err);
    throw err;
  }
}

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
async function buildAppCallTxn(senderAddress, method, args = [], targetAppId = DEFAULT_APP_ID) {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();

    const txn = algosdk.makeApplicationCallTxnFromObject({
      from: senderAddress,
      appIndex: parseInt(targetAppId),
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
    
    // Check if it's an array of number arrays (from our robust JSON msgpack conversion)
    if (Array.isArray(signedTxnPayload)) {
      if (Array.isArray(signedTxnPayload[0])) {
         // Fix for msgpack array of numbers
         groupedTxnBuffer = Buffer.concat(signedTxnPayload.map(arr => Buffer.from(arr)));
      } else {
         // Keep old b64 fallback just in case
         groupedTxnBuffer = Buffer.concat(signedTxnPayload.map((b64) => Buffer.from(b64, "base64")));
      }
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
  deployBountyContract,
  buildAppCallTxn,
  buildPayTxn,
  submitSignedTxn,
  getContractState,
  getTransaction,
};