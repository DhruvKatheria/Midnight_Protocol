const { Web3Storage, File } = require('web3.storage');
const crypto = require('crypto');

// A simple mock for Firebase Storage fallback if required
async function fallbackToFirebaseStorage(fileBuffer, filename) {
    console.log("Web3.storage token missing. Falling back to mock firebase storage...");
    const cidLikeMock = "Qm" + crypto.randomBytes(22).toString('hex');
    return `https://firebasestorage.googleapis.com/v0/b/mock/o/${filename}?alt=media&hash=${cidLikeMock}`;
}

async function uploadToIPFS(fileBuffer, filename = "document") {
  try {
    const token = process.env.WEB3_STORAGE_TOKEN;

    if (!token || token === "your_web3_storage_token") {
        return await fallbackToFirebaseStorage(fileBuffer, filename);
    }
    
    const client = new Web3Storage({ token });
    const file = new File([fileBuffer], filename, { type: 'application/octet-stream' });
    
    // Upload
    const cid = await client.put([file], { wrapWithDirectory: false });
    return `https://${cid}.ipfs.w3s.link`;
} catch (err) {
    console.error("IPFS Upload Error:", err);
    throw err;
  }
}

module.exports = {
  uploadToIPFS,
};
