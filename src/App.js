import logo from './cc.png';
import './App.css';
import { useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  Program, AnchorProvider, web3, utils, BN
} from '@project-serum/anchor';
import idl from './idl.json';
import { Buffer } from 'buffer';
import { getAccount } from '@solana/spl-token';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
// import { init_owner_atas } from './init-owner-atas.js';
require('@solana/wallet-adapter-react-ui/styles.css');


const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter()
]

const { SystemProgram, Keypair } = web3;
/* create an account  */
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);
const ccMintConst = "GLHZiMyU2cHYvbaCbCSKUpE7aoENq7S9Gv1pfyA7xWjW";
const ccb1MintConst = "AG2ABtrFUD6M4gvUqDnf4j7sNtnmwayB25Qbo2yvQakJ";

function App() {
  // const [value, setValue] = useState(null);
  // state vars
  const [ima0, setIma0] = useState(null);
  const [pstate, setPstate] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [redeem, setRedeem] = useState('');
  const [needAtas, setNeedAtas] = useState(null);

  const [ccBal, setCcBal] = useState(null);
  const [ccbBal, setCcbBal] = useState(null);
  const [ccsBal, setCcsBal] = useState(null);
  const [ccb0Bal, setCcb0Bal] = useState(null);
  const [ccb1Bal, setCcb1Bal] = useState(null);

  const [ccbPrice, setCcbPrice] = useState(null);
  const [ccsPrice, setCcsPrice] = useState(null);

  const [buyBondsAmount, setBuyBondsAmount] = useState('');
  const [sellBondsAmount, setSellBondsAmount] = useState('');
  const [buyShortsAmount, setBuyShortsAmount] = useState('');
  const [sellShortsAmount, setSellShortsAmount] = useState('');
  const wallet = useWallet();
  let ccPccb = '',ccbPcc = '',ccPccs = '',ccsPcc = '';

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  async function doFetchState() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );

    try {
      const state = await program.account.mintAuth.fetch(mintAuth);
      // console.log('state: ', state);
      setTimestamp(state.timestamp.toString());
      setPstate(state.maturityState.toString());
      setIma0(state.ima0.toString());
      setCcbPrice((Number(state.cc0Amount) / Number(state.ccbAmount))
        .toPrecision(5));
      setCcsPrice((Number(state.cc1Amount) / Number(state.ccsAmount))
        .toPrecision(5));
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function doInitAtas() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );
    console.log(`mintAuth ${mintAuthBump} ${mintAuth}`);

    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    console.log(`ccMint ${ccMintBump} ${ccMint}`);

    const cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      // owner: payer.publicKey
      owner: provider.wallet.publicKey
    });
    console.log(`cc_ata ${cc_ata}`);

    try {
      await program.methods.initOwnerAta(
        mintAuthBump
      ).accounts({
        mintAuthority: mintAuth,
        mintAccount: ccMint,
        tokenAccount: cc_ata,
        payer: provider.wallet.publicKey,
        // payer: payer.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      })
      // .signers([payer.payer])
      .rpc();
    } catch { console.log('failed init owner cc ata'); }

    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    console.log(`ccb0Mint ${ccb0MintBump} ${ccb0Mint}`);

    const ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`ccb0_ata ${ccb0_ata}`);

    try {
      await program.methods.initOwnerAta(
        mintAuthBump
      ).accounts({
        mintAuthority: mintAuth,
        mintAccount: ccb0Mint,
        tokenAccount: ccb0_ata,
        payer: provider.wallet.publicKey,
        // payer: payer.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      })
      // .signers([payer.payer])
      .rpc();
    } catch { console.log('failed init owner ccb0 ata'); }

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    console.log(`ccb1Mint ${ccb1MintBump} ${ccb1Mint}`);

    const ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`ccb1_ata ${ccb1_ata}`);

    try {
      await program.methods.initOwnerAta(
        mintAuthBump
      ).accounts({
        mintAuthority: mintAuth,
        mintAccount: ccb1Mint,
        tokenAccount: ccb1_ata,
        payer: provider.wallet.publicKey,
        // payer: payer.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      })
      // .signers([payer.payer])
      .rpc();
    } catch { console.log('failed init owner ccb1 ata'); }

    const [ ccs0Mint, ccs0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId
      );
    console.log(`ccs0Mint ${ccs0MintBump} ${ccs0Mint}`);

    const ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`ccs0_ata ${ccs0_ata}`);

    try {
      await program.methods.initOwnerAta(
        mintAuthBump
      ).accounts({
        mintAuthority: mintAuth,
        mintAccount: ccs0Mint,
        tokenAccount: ccs0_ata,
        // payer: payer.publicKey,
        payer: provider.wallet.publicKey,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: utils.token.ASSOCIATED_PROGRAM_ID,
      })
      // .signers([payer.payer])
      .rpc();
    } catch { console.log('failed init owner ccs0 ata'); }
    setNeedAtas('');
  }

  async function getOwnerBalances() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    const program = new Program(idl, programID, provider);
    let ccbA = 0;

    // cc bal
    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    const cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    try {
      const ccAccount = await getAccount(connection, cc_ata);
      setCcBal(ccAccount.amount.toString());
    } catch { setNeedAtas('1'); }

    // ccb bal
    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    const ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: provider.wallet.publicKey
    });
    try {
      const ccb0Account = await getAccount(connection, ccb0_ata);
      setCcb0Bal(ccb0Account.amount.toString());
      ccbA += Number(ccb0Account.amount);
    } catch { }

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    const ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: provider.wallet.publicKey
    });
    try {
      const ccb1Account = await getAccount(connection, ccb1_ata);
      setCcb1Bal(ccb1Account.amount.toString());
      ccbA += Number(ccb1Account.amount);
    } catch { }
    setCcbBal(ccbA.toString());
    console.log('ccbA ' + ccbA);

    // ccs bal
    const [ ccs0Mint, ccs0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId
      );
    const ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: provider.wallet.publicKey
    });
    const ccs0Account = await getAccount(connection, ccs0_ata);
    setCcsBal(ccs0Account.amount.toString())

    if (pstate == '0') {
      if (Number(ccb1Bal) > 0) {
        setRedeem('1');
      } else { setRedeem(''); }
    }
    if (pstate == '2') {
      if (Number(ccb0Bal) > 0) {
        setRedeem('1');
      } else { setRedeem(''); }
    }
  }

  async function doBuyBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);

    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );
    console.log(`mintAuth ${mintAuthBump} ${mintAuth}`);

    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    console.log(`ccMint ${ccMintBump} ${ccMint}`);

    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    console.log(`ccb0Mint ${ccb0MintBump} ${ccb0Mint}`);

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    console.log(`ccb1Mint ${ccb1MintBump} ${ccb1Mint}`);

    const [ ccs0Mint, ccs0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId
      );
    console.log(`ccs0Mint ${ccs0MintBump} ${ccs0Mint}`);

    const cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: mintAuth,
    });
    console.log(`cc_ata ${cc_ata}`);

    const ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: mintAuth,
    });
    console.log(`ccb0_ata ${ccb0_ata}`);

    const ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: mintAuth,
    });
    console.log(`ccb1_ata ${ccb1_ata}`);

    const ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: mintAuth,
    });
    console.log(`ccs0_ata ${ccs0_ata}`);

    const owner_cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_cc_ata ${owner_cc_ata}`);

    const owner_ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccb0_ata ${owner_ccb0_ata}`);

    const owner_ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccb1_ata ${owner_ccb1_ata}`);

    if (pstate == '0') {
      try {
        await program.methods.buyBonds0(
          new BN(buyBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb0MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb0MintAccount: ccb0Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb0Account: owner_ccb0_ata,

          ccAccount: cc_ata,
          ccb0Account: ccb0_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds0 failed'); }
    }
    if (pstate == '2') {
      try {
        await program.methods.buyBonds1(
          new BN(buyBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb1MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb1MintAccount: ccb1Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb1Account: owner_ccb1_ata,
          ccAccount: cc_ata,
          ccb1Account: ccb1_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds1 failed'); }
    }
  }

  async function doSellBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );
    console.log(`mintAuth ${mintAuthBump} ${mintAuth}`);

    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    console.log(`ccMint ${ccMintBump} ${ccMint}`);

    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    console.log(`ccb0Mint ${ccb0MintBump} ${ccb0Mint}`);

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    console.log(`ccb1Mint ${ccb1MintBump} ${ccb1Mint}`);

    const [ ccs0Mint, ccs0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId
      );
    console.log(`ccs0Mint ${ccs0MintBump} ${ccs0Mint}`);

    const cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: mintAuth,
    });
    console.log(`cc_ata ${cc_ata}`);

    const ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: mintAuth,
    });
    console.log(`ccb0_ata ${ccb0_ata}`);

    const ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: mintAuth,
    });
    console.log(`ccb1_ata ${ccb1_ata}`);

    const ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: mintAuth,
    });
    console.log(`ccs0_ata ${ccs0_ata}`);

    const owner_cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_cc_ata ${owner_cc_ata}`);

    const owner_ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccb0_ata ${owner_ccb0_ata}`);

    const owner_ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccb1_ata ${owner_ccb1_ata}`);

    if (pstate == '0') {
      try {
        await program.methods.sellBonds0(
          new BN(sellBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb0MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb0MintAccount: ccb0Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb0Account: owner_ccb0_ata,

          ccAccount: cc_ata,
          ccb0Account: ccb0_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellBonds0 failed'); }
    }
    if (pstate == '2') {
      try {
        await program.methods.sellBonds1(
          new BN(sellBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb1MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb1MintAccount: ccb1Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb1Account: owner_ccb1_ata,
          ccAccount: cc_ata,
          ccb1Account: ccb1_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellBonds1 failed'); }
    }
  }

  async function doBuyShorts() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);

    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );
    console.log(`mintAuth ${mintAuthBump} ${mintAuth}`);

    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    console.log(`ccMint ${ccMintBump} ${ccMint}`);

    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    console.log(`ccb0Mint ${ccb0MintBump} ${ccb0Mint}`);

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    console.log(`ccb1Mint ${ccb1MintBump} ${ccb1Mint}`);

    const [ ccs0Mint, ccs0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId
      );
    console.log(`ccs0Mint ${ccs0MintBump} ${ccs0Mint}`);

    const cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: mintAuth,
    });
    console.log(`cc_ata ${cc_ata}`);

    const ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: mintAuth,
    });
    console.log(`ccb0_ata ${ccb0_ata}`);

    const ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: mintAuth,
    });
    console.log(`ccb1_ata ${ccb1_ata}`);

    const ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: mintAuth,
    });
    console.log(`ccs0_ata ${ccs0_ata}`);

    const owner_cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_cc_ata ${owner_cc_ata}`);

    const owner_ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccs0_ata ${owner_ccs0_ata}`);

    if (pstate == '0') {
      try {
        await program.methods.buyShorts0(
          new BN(buyBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb0MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb0MintAccount: ccb0Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcs0Account: owner_ccs0_ata,

          ccAccount: cc_ata,
          ccb0Account: ccb0_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyShorts0 failed'); }
    }
    if (pstate == '2') {
      try {
        await program.methods.buyShorts1(
          new BN(buyBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb1MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb1MintAccount: ccb1Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcs0Account: owner_ccs0_ata,
          ccAccount: cc_ata,
          ccb1Account: ccb1_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds1 failed'); }
    }
  }

  async function doSellShorts() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );
    console.log(`mintAuth ${mintAuthBump} ${mintAuth}`);

    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    console.log(`ccMint ${ccMintBump} ${ccMint}`);

    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    console.log(`ccb0Mint ${ccb0MintBump} ${ccb0Mint}`);

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    console.log(`ccb1Mint ${ccb1MintBump} ${ccb1Mint}`);

    const [ ccs0Mint, ccs0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId
      );
    console.log(`ccs0Mint ${ccs0MintBump} ${ccs0Mint}`);

    const cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: mintAuth,
    });
    console.log(`cc_ata ${cc_ata}`);

    const ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: mintAuth,
    });
    console.log(`ccb0_ata ${ccb0_ata}`);

    const ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: mintAuth,
    });
    console.log(`ccb1_ata ${ccb1_ata}`);

    const ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: mintAuth,
    });
    console.log(`ccs0_ata ${ccs0_ata}`);

    const owner_cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_cc_ata ${owner_cc_ata}`);

    const owner_ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccs0_ata ${owner_ccs0_ata}`);

    if (pstate == '0') {
      try {
        await program.methods.sellShorts0(
          new BN(sellBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb0MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb0MintAccount: ccb0Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb0Account: owner_ccs0_ata,

          ccAccount: cc_ata,
          ccb0Account: ccb0_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellShorts0 failed'); }
    }
    if (pstate == '2') {
      try {
        await program.methods.sellShorts1(
          new BN(sellBondsAmount),
          mintAuthBump,
          ccMintBump,
          ccb1MintBump,
          ccs0MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb1MintAccount: ccb1Mint,
          ccs0MintAccount: ccs0Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcs0Account: owner_ccs0_ata,

          ccAccount: cc_ata,
          ccb1Account: ccb1_ata,
          ccs0Account: ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellShorts1 failed'); }
    }
  }


  async function doRedeemBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);

    const [ mintAuth, mintAuthBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId
      );
    console.log(`mintAuth ${mintAuthBump} ${mintAuth}`);

    const [ ccMint, ccMintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId
      );
    console.log(`ccMint ${ccMintBump} ${ccMint}`);

    const [ ccb0Mint, ccb0MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId
      );
    console.log(`ccb0Mint ${ccb0MintBump} ${ccb0Mint}`);

    const [ ccb1Mint, ccb1MintBump ] =
      await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId
      );
    console.log(`ccb1Mint ${ccb1MintBump} ${ccb1Mint}`);

    const owner_cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_cc_ata ${owner_cc_ata}`);

    const owner_ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccb0_ata ${owner_ccb0_ata}`);

    const owner_ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: provider.wallet.publicKey
    });
    console.log(`owner_ccb1_ata ${owner_ccb1_ata}`);

    if (pstate == '0') {
      try {
        await program.methods.redeemBonds1(
          mintAuthBump,
          ccMintBump,
          ccb0MintBump,
          ccb1MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb0MintAccount: ccb0Mint,
          ccb1MintAccount: ccb1Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb0Account: owner_ccb0_ata,
          ownerCcb1Account: owner_ccb1_ata,

          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('redeemBonds1 failed'); }
    }
    if (pstate == '2') {
      try {
        await program.methods.redeemBonds0(
          mintAuthBump,
          ccMintBump,
          ccb0MintBump,
          ccb1MintBump,
        ).accounts({
          mintAuthority: mintAuth,

          ccMintAccount: ccMint,
          ccb0MintAccount: ccb0Mint,
          ccb1MintAccount: ccb1Mint,

          ownerCcAccount: owner_cc_ata,
          ownerCcb0Account: owner_ccb0_ata,
          ownerCcb1Account: owner_ccb1_ata,

          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('redeemBonds0 failed'); }
    }
  }

  async function doSetSellBondsAmount() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
  }

  async function doSetSellBondsMaxAmount() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    doFetchState();
    getOwnerBalances();
    let ir = (Number(ima0)*60*60*24*365*100).toFixed(2);
    let spw = Number(60*60*24*7);
    let tleft = (spw - (Number(timestamp) % spw)).toString();
    return (
      <div className="App">
        <header className="App-header">
          <div className="header-left">
            <img src={logo} className="App-logo" alt="logo" />
            <h2>Currency Coin</h2>
          </div>
          <div className="header-right">
            <h2>{ir}%</h2>
          </div>
        </header>
        <div className="App-next">
          <div className="App-left">
            <h2>Bonds</h2>
            <div className="swap-row">
              <button className="swap-row-left" onClick={doBuyBonds}>Buy</button>
              <input
                onChange={e => setBuyBondsAmount(e.target.value)}
                value={buyBondsAmount}
              />
              <button className="swap-row-right"
                onClick={e => setBuyBondsAmount(ccBal)}>Max</button>
            </div>
            <div className="swap-row">
              <button className="swap-row-left" onClick={doSellBonds}>Sell</button>
              <input className="swap-row-sellBondsAmount"
                onChange={e => setSellBondsAmount(e.target.value)}
                value={sellBondsAmount}
              />
              <button className="swap-row-right"
                onClick={e => setSellBondsAmount(ccbBal)}>Max</button>
            </div>
            <h2>Shorts</h2>
            <div className="swap-row">
              <button className="swap-row-left" onClick={doBuyShorts}>Buy</button>
              <input className="swap-row-buyBondsAmount"
                onChange={e => setBuyShortsAmount(e.target.value)}
                value={buyShortsAmount}
              />
              <button className="swap-row-right"
                onClick={e => setBuyShortsAmount(ccBal)}>Max</button>
            </div>
            <div className="swap-row">
              <button className="swap-row-left" onClick={doSellShorts}>Sell</button>
              <input className="swap-row-sellBondsAmount"
                onChange={e => setSellShortsAmount(e.target.value)}
                value={sellShortsAmount}
              />
              <button className="swap-row-right"
                onClick={e => setSellShortsAmount(ccsBal)}>Max</button>
            </div>
            <div className="space-row"></div>
            <div className="data-row">Prices</div>
            <div className="data-row">CCB {ccbPrice}</div>
            <div className="data-row">CCS {ccsPrice}</div>
            <div className="data-row">Mints</div>
            <div className="data-row">CC {ccMintConst}</div>
            <div className="data-row">CCB1 {ccb1MintConst}</div>
          </div>
          <div className="App-right">
              <h2>Balances</h2>
              <h3>CC {ccBal}</h3>
              <h3>CCB {ccbBal}</h3>
              <h3>CCS {ccsBal}</h3>
              <div className="space-row"></div>
              {
                needAtas && (<button className="emergency-button"
                  onClick={doInitAtas}>Init Atas</button>)
              }

              {
                redeem ? (
                  <button className="emergency-button"
                    onClick={doRedeemBonds}>Redeem!</button>
                ) : (
                  <button className="time-button">Maturity in {tleft}s</button>

                )
              }

          </div>
        </div>
      </div>
    );
  }
}

              // <h2>Protocol State {pstate}</h2>
/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
