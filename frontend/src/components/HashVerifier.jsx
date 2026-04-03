import React, { useState } from "react";

export default function HashVerifier() {
  const [input, setInput] = useState("");
  const [hash, setHash] = useState("");
  const [verified, setVerified] = useState(null);

  const handleHash = async () => {
    if (input.trim()) {
      // TODO: Use crypto library to compute SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setHash(hashHex);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
      <h3>🔐 Hash Verifier</h3>
      <textarea
        placeholder="Enter content to hash"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", height: "100px", marginBottom: "10px" }}
      />
      <div>
        <button onClick={handleHash} style={{ marginRight: "10px", padding: "8px 16px" }}>
          Generate Hash
        </button>
        {hash && (
          <>
            <p>
              <strong>Hash:</strong> {hash.substring(0, 16)}...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
