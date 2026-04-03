import json
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import AssetConfigTxn

def create_trust_token():
    # Attempt to connect to LocalNet Sandbox
    algod_address = "http://localhost:4001"
    algod_token = "a" * 64
    client = algod.AlgodClient(algod_token, algod_address)
    
    try:
        # Check connection
        status = client.status()
        print("Connected to Algorand Node")
    except Exception as e:
        print("⚠️ Could not connect to Algorand Sandbox. Please make sure `algokit localnet start` is running.")
        print(f"Error: {e}")
        return

    # In a real scenario, use actual creator keys
    private_key, address = account.generate_account()
    
    # Normally we would fund this account from the dispenser here if locally simulating
    # For now, we attempt to construct the token creation transaction
    
    print(f"Creator address: {address}")
    
    try:
        params = client.suggested_params()
        txn = AssetConfigTxn(
            sender=address,
            sp=params,
            total=1000000000,
            default_frozen=False,
            unit_name="TRUST",
            asset_name="SettleChain Trust Token",
            manager=address,
            reserve=address,
            freeze=address,
            clawback=address,
            decimals=0
        )
        
        # We cannot submit without funding, so this is just the structure proof
        print("Constructed Trust Token (ASA) transaction successfully:")
        print(f" - Total Supply: {txn.total}")
        print(f" - Asset Name: {txn.asset_name}")
        print(f" - Unit Name: {txn.unit_name}")
        print(f" - Admin Roles: Manager, Reserve, Freeze, Clawback assigned to {address}")
        
    except Exception as e:
        print(f"Transaction build error: {e}")

if __name__ == "__main__":
    create_trust_token()
