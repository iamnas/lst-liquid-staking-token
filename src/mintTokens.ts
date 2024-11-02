import { 
    Connection, 
    PublicKey, 
    Transaction, 
    sendAndConfirmTransaction, 
    SystemProgram, 
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
    TOKEN_PROGRAM_ID, 
    getAssociatedTokenAddress, 
    createAssociatedTokenAccountInstruction, 
    createMintToInstruction, 
    createBurnInstruction 
} from '@solana/spl-token';
import { Keypair } from '@solana/web3.js';
import base58 from 'bs58';
import { PRIVATE_KEY, PUBLIC_KEY } from './address';

// Load your environment variables (replace these with your actual private/public keys)
// const PUBLIC_KEY = "Your_Public_Key"; // Replace with your public key
// const PRIVATE_KEY = PRIVATE_KEY!; // Replace with your private key

// Initialize Solana connection
const SOLANA_RPC_URL = "https://api.devnet.solana.com"; // Use your RPC URL
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
const MINT_ADDRESS = new PublicKey(PUBLIC_KEY!);

// Load wallet
const secretKey = base58.decode(PRIVATE_KEY!);
const wallet = Keypair.fromSecretKey(secretKey);

// Helper function to create or get the associated token account (ATA)
async function getOrCreateATA(connection: Connection, mint: PublicKey, owner: PublicKey, payer: Keypair): Promise<PublicKey> {
    const ata = await getAssociatedTokenAddress(mint, owner);
    const ataInfo = await connection.getAccountInfo(ata);

    // If ATA does not exist, create it
    if (!ataInfo) {
        const ataTransaction = new Transaction().add(
            createAssociatedTokenAccountInstruction(payer.publicKey, ata, owner, mint)
        );
        await sendAndConfirmTransaction(connection, ataTransaction, [payer]);
        console.log(`Created ATA for ${owner.toBase58()}`);
    }
    return ata;
}

// Mint tokens to the recipient's associated token account
export const mintTokens = async (fromAddress: string, toAddress: string, amount: number) => {
    const toPublicKey = new PublicKey(toAddress);

    // Get or create the recipient's associated token account
    const toTokenAccount = await getOrCreateATA(connection, MINT_ADDRESS, toPublicKey, wallet);

    const mintInstruction = createMintToInstruction(
        MINT_ADDRESS,
        toTokenAccount,
        wallet.publicKey,  // Mint authority
        amount * Math.pow(10, 9), // Assuming token has 9 decimal places
        [],
        TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction().add(mintInstruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
    console.log(`Mint transaction confirmed: ${signature}`);
};

// Burn tokens from the sender's associated token account
export const burnTokens = async (fromAddress: string, amount: number) => {
    const fromPublicKey = new PublicKey(fromAddress);

    // Get or create the sender's associated token account
    const fromTokenAccount = await getOrCreateATA(connection, MINT_ADDRESS, fromPublicKey, wallet);

    const burnInstruction = createBurnInstruction(
        fromTokenAccount,
        MINT_ADDRESS,
        wallet.publicKey,  // Burn authority
        amount * Math.pow(10, 9), // Assuming token has 9 decimal places
        [],
        TOKEN_PROGRAM_ID
    );

    const transaction = new Transaction().add(burnInstruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
    console.log(`Burn transaction confirmed: ${signature}`);
};

// Transfer SOL from the wallet to the recipient
export const sendNativeTokens = async (toAddress: string, amount: number) => {
    const toPublicKey = new PublicKey(toAddress);

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: toPublicKey,
            lamports: amount * LAMPORTS_PER_SOL,
        })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [wallet]);
    console.log(`SOL transfer transaction confirmed: ${signature}`);
};
