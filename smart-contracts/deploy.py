"""
Smart Contract Deployment Script for SettleChain
Deploys the escrow contract to Algorand testnet
"""

from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.transaction import (
    ApplicationCreateTxn,
    OnComplete,
    StateSchema
)
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Algod client setup
algod_client = algod.AlgodClient(
    "",
    "https://testnet-api.algonode.cloud"
)

# Check connection
try:
    status = algod_client.status()
    print(f"✅ Connected to Algorand - Round: {status['last-round']}")
except Exception as e:
    print(f"❌ Failed to connect to Algorand: {e}")
    exit(1)

# Load and compile TEAL programs to bytecode
try:
    with open("artifacts/approval.teal", "r") as f:
        approval_teal = f.read()
    
    with open("artifacts/clear.teal", "r") as f:
        clear_teal = f.read()
    
    print("✅ TEAL contracts loaded")
    print("🔨 Compiling TEAL to bytecode...")
    
    # Compile TEAL to bytecode using algod
    approval_compiled = algod_client.compile(approval_teal)
    clear_compiled = algod_client.compile(clear_teal)
    
    # Get the bytecode (base64 encoded)
    import base64
    approval_program = base64.b64decode(approval_compiled["result"])
    clear_program = base64.b64decode(clear_compiled["result"])
    
    print("✅ TEAL compiled to bytecode")
except FileNotFoundError as e:
    print(f"❌ Missing TEAL file: {e}")
    print("⚠️ Run: python settlechain_escrow.py (to compile contract first)")
    exit(1)
except Exception as e:
    print(f"❌ Failed to compile TEAL: {e}")
    exit(1)

# Get account from mnemonic (from environment or user input)
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")

if not MNEMONIC or MNEMONIC.strip() == "":
    print("\n⚠️ ALGORAND_MNEMONIC not set in .env")
    print("📝 Enter your 25-word mnemonic (or paste it): ")
    MNEMONIC = input().strip()
    
    if len(MNEMONIC.split()) != 25:
        print("❌ Invalid mnemonic (must be 25 words)")
        exit(1)

try:
    private_key = mnemonic.to_private_key(MNEMONIC)
    deployer_address = account.address_from_private_key(private_key)
    print(f"✅ Account loaded: {deployer_address}")
except Exception as e:
    print(f"❌ Invalid mnemonic: {e}")
    exit(1)

# Get suggested parameters
try:
    params = algod_client.suggested_params()
    print(f"✅ Using fee: {params.flat_fee} microAlgo")
except Exception as e:
    print(f"❌ Failed to get suggested params: {e}")
    exit(1)

# Create the application
try:
    print("\n📦 Creating application...")
    
    txn = ApplicationCreateTxn(
        sender=deployer_address,
        sp=params,
        on_complete=OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema = StateSchema(1, 2),
        local_schema = StateSchema(0, 0),
    )
    
    print("✅ Transaction created")
    
    # Sign transaction
    signed_txn = txn.sign(private_key)
    print("✅ Transaction signed")
    
    # Send transaction
    tx_id = algod_client.send_transaction(signed_txn)
    print(f"📤 Sent transaction: {tx_id}")
    
    # Wait for confirmation
    print("⏳ Waiting for confirmation...")
    confirmed_txn = None
    timeout = 30
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            confirmed_txn = algod_client.pending_transaction_info(tx_id)
            if "application-index" in confirmed_txn:
                app_id = confirmed_txn["application-index"]
                print(f"\n✅ SUCCESS! Contract deployed")
                print(f"📱 APP_ID: {app_id}")
                print(f"💾 Round: {confirmed_txn['confirmed-round']}")
                print(f"\n📋 Update your .env with:")
                print(f"APP_ID={app_id}")
                
                # Save to file for convenience
                with open(".env.deployment", "w") as f:
                    f.write(f"APP_ID={app_id}\n")
                    f.write(f"DEPLOYER_ADDRESS={deployer_address}\n")
                    f.write(f"DEPLOYMENT_ROUND={confirmed_txn['confirmed-round']}\n")
                
                print(f"\n📄 Configuration saved to .env.deployment")
                exit(0)
        except FileNotFoundError:
            pass
        
        time.sleep(1)
    
    print(f"\n❌ Timeout: Transaction not confirmed within {timeout} seconds")
    exit(1)

except Exception as e:
    print(f"\n❌ Deployment failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
