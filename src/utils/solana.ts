import nacl, { sign } from "tweetnacl";
import bs58 from "bs58";
import { RPC_ENDPOINT, SIGN_MESSAGE } from "../config";
import { Metaplex } from "@metaplex-foundation/js";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  Keypair,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import "dotenv/config";

export const connection = new Connection(RPC_ENDPOINT, "confirmed");

export const validateEd25519Address = (address: string) => {
  try {
    const isValidAddress = PublicKey.isOnCurve(address);
    if (isValidAddress) return true;
    else return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const verifySignature = (
  address: string,
  nonce: string | undefined,
  signature: string
) => {
  try {
    const message = `${SIGN_MESSAGE} : ${nonce}`;
    return sign.detached.verify(
      new TextEncoder().encode(message),
      bs58.decode(signature),
      bs58.decode(address)
    );
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const getPriceFromDexscreener = async (
  pubKey: string
): Promise<number | null> => {
  interface Pair {
    priceUsd: string;
  }

  interface Data {
    pairs: Pair[];
  }

  try {
    const response = await fetch(
      "https://api.dexscreener.io/latest/dex/tokens/" + pubKey
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      const price = parseFloat(data.pairs[0].priceUsd);
      return isNaN(price) ? null : price;
    } else {
      throw new Error("No pairs data found");
    }
  } catch (error) {
    console.error("Failed to fetch price:", error);
    return null;
  }
};

/**
 * Get metadata of SPL token
 * @param {string} pubKey
 * @returns
 */
export const getMetadata = async (pubKey: string) => {
  const metaplex = Metaplex.make(connection);
  const mintAddress = new PublicKey(pubKey);

  const metadata = await metaplex
    .nfts()
    .findByMint({ mintAddress: mintAddress });
  return metadata;
};

export function formatNumber(num: number): string {
  if (num > 1) {
    return num.toFixed(2);
  } else if (num >= 0.5 && num <= 1) {
    return num.toFixed(4);
  } else {
    return num.toFixed(5);
  }
}
