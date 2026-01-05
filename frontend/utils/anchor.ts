import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@project-serum/anchor";
import idl from "./dealshield_idl.json";

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID || "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getProgram = (connection: Connection, wallet: any) => {
  const provider = new AnchorProvider(
    connection,
    wallet,
    { preflightCommitment: "processed" }
  );
  return new Program(idl as Idl, PROGRAM_ID, provider);
};

export const getEscrowPDA = (
  buyer: PublicKey,
  seller: PublicKey,
  listingId: string
) => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      buyer.toBuffer(),
      seller.toBuffer(),
      Buffer.from(listingId)
    ],
    PROGRAM_ID
  );
};
