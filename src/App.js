import logo from './cc.png';
import './App.css';
import React from 'react';
import { useState } from 'react';
import {
  Transaction,
  Connection,
  PublicKey,
  clusterApiUrl
} from '@solana/web3.js';
import {
  Program,
  AnchorProvider,
  web3, utils, BN
} from '@project-serum/anchor';
import idl from './idl.json';
import { Buffer } from 'buffer';
import {
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';

import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
  useWallet,
  WalletProvider,
  ConnectionProvider
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';


require('@solana/wallet-adapter-react-ui/styles.css');
const sleep = require('sleep');

const spw = 60*60*24*7;
const BN_60 = new BN(60);
const BN_24 = new BN(24);
const BN_7 = new BN(7);
const BN_0 = new BN(0);

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter()
]

// const { SystemProgram, Keypair } = web3;
/* create an account  */
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);
// const ccMintConst = "5jGmQSUMvQ5dKrLXuh3oUjczWWLefUEQHX3EGKXnLjjS";
// const ccb0MintConst = "GVWmAjaond6PrChG4bPZRWRbQAs2gwFbHE5t3NfUhbft";
// const ccb1MintConst = "7c72g38GCvGyNqBL7zEdQS7nHq9DfiRAUQcRiSDH5FDx";
// const ccs0MintConst = "EBj4FTsN2BHbNtbctvzCX96JS3ksB8z1ukWcZQjqCujr";

// const mintAuthConst = "5Ju8Dax7SgVsygfwkkuDX1eoJHwCQFgjpiCSctjrPZoC";

const network = clusterApiUrl('devnet');

const gAddrs = {
  mintAuth: "",
  mintAuthBump: 0,
  ccMint: "",
  ccMintBump: 0,
  ccb0Mint: "",
  ccb0MintBump: 0,
  ccb1Mint: "",
  ccb1MintBump: 0,
  ccs0Mint: "",
  ccs0MintBump: 0,
  owner_cc_ata: "",
  owner_ccb0_ata: "",
  owner_ccb1_ata: "",
  owner_ccs0_ata: "",
  cc_ata: "",
  ccb0_ata: "",
  ccb1_ata: "",
  ccs0_ata: "",
}
const gState = {
  timestamp: 0,
  ima0: 0,
  smod: 1,
  pstate: 0,
  tleft: 0,
  redeem: 0,

  ccBal: 0,
  ccsBal: 0,
  ccb0Bal: 0,
  ccb1Bal: 0,

  ccProgBal: 0,
  ccsProgBal: 0,
  ccbProgBal: 0,
}
let fetchTimer,clockTimer,otimestamp = 0;

class AppHeader extends React.Component {
  render() {
    return (
      <header className="App-header">
        <div className="header-left">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Currency Coin</h2>
        </div>
        <div className="header-right">
          <h2>{this.props.ir}</h2>
        </div>
      </header>
    );
  }
}

function App() {
  const [redraw, setRedraw] = useState(null);

  const [buyBondsAmount, setBuyBondsAmount] = useState('');
  const [sellBondsAmount, setSellBondsAmount] = useState('');
  const [buyShortsAmount, setBuyShortsAmount] = useState('');
  const [sellShortsAmount, setSellShortsAmount] = useState('');
  const wallet = useWallet();
  const { signTransaction } = useWallet();

  async function initAddrs(provider,program) {
    console.log('initAddrs');
    [ gAddrs.mintAuth, gAddrs.mintAuthBump ]
      = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId );
        console.log('mintAuth ',gAddrs.mintAuth);

    [ gAddrs.ccMint, gAddrs.ccMintBump ]
      = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId );
    [ gAddrs.ccb0Mint, gAddrs.ccb0MintBump ]
      = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId );
    [ gAddrs.ccb1Mint, gAddrs.ccb1MintBump ]
      = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId );
    [ gAddrs.ccs0Mint, gAddrs.ccs0MintBump ]
      = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId );

    gAddrs.owner_cc_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccMint,
      owner: provider.wallet.publicKey
    });
    gAddrs.owner_ccb0_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccb0Mint,
      owner: provider.wallet.publicKey
    });
    gAddrs.owner_ccb1_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccb1Mint,
      owner: provider.wallet.publicKey
    });
    gAddrs.owner_ccs0_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccs0Mint,
      owner: provider.wallet.publicKey
    });

    gAddrs.cc_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccMint,
      owner: gAddrs.mintAuth
    });
    gAddrs.ccb0_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccb0Mint,
      owner: gAddrs.mintAuth
    });
    gAddrs.ccb1_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccb1Mint,
      owner: gAddrs.mintAuth
    });
    gAddrs.ccs0_ata = await utils.token.associatedAddress({
      mint: gAddrs.ccs0Mint,
      owner: gAddrs.mintAuth
    });
  }

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    // const network = "http://127.0.0.1:8899";
    // const network = clusterApiUrl('devnet');
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  async function doFetchState() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);
    try {
      const state = await program.account.mintAuth.fetch(gAddrs.mintAuth);
      gState.pstate = Number(state.maturityState);
      gState.ima0 = Number(state.ima0);
      gState.smod = Number(state.smod);
      if (state.timestamp !== otimestamp) {
        gState.timestamp = Number(state.timestamp);
        otimestamp = Number(state.timestamp);
        doUpdateClock();
      }
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function getOwnerBalances() {
    // const network = "http://127.0.0.1:8899";
    // const network = clusterApiUrl('devnet');
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    // cc bal
    try {
      const ccAccount = await getAccount(connection, gAddrs.owner_cc_ata);
      gState.ccBal = Number(ccAccount.amount);
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            gAddrs.owner_cc_ata,
            provider.wallet.publicKey,
            gAddrs.ccMint
          ));
          // const connection = new Connection(network, opts.preflightCommitment);
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccAccount = await getAccount(connection, gAddrs.owner_cc_ata);
          gState.ccBal = Number(ccAccount.amount);
        } catch {}
      }
    }

    // ccb bal
    try {
      const ccb0Account = await getAccount(connection, gAddrs.owner_ccb0_ata);
      gState.ccb0Bal = Number(ccb0Account.amount);
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            gAddrs.owner_ccb0_ata,
            provider.wallet.publicKey,
            gAddrs.ccb0Mint
          ));
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccb0Account = await getAccount(connection, gAddrs.owner_ccb0_ata);
          gState.ccb0Bal = Number(ccb0Account.amount);
        } catch {}
      }
    }

    try {
      const ccb1Account = await getAccount(connection, gAddrs.owner_ccb1_ata);
      gState.ccb1Bal = Number(ccb1Account.amount);
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            gAddrs.owner_ccb1_ata,
            provider.wallet.publicKey,
            gAddrs.ccb1Mint
          ));
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccb1Account = await getAccount(connection, gAddrs.owner_ccb1_ata);
          gState.ccb1Bal = Number(ccb1Account.amount);
        } catch {}
      }
    }

    // ccs bal
    try {
      const ccs0Account = await getAccount(connection, gAddrs.owner_ccs0_ata);
      gState.ccsBal = Number(ccs0Account.amount);
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            gAddrs.owner_ccs0_ata,
            provider.wallet.publicKey,
            gAddrs.ccs0Mint
          ));
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccs0Account = await getAccount(connection, gAddrs.owner_ccs0_ata);
          gState.ccsBal = Number(ccs0Account.amount);
        } catch {}
      }
    }
  }

  async function getProgCcBalance() {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);
    // cc bal
    try {
      const ccAccount = await getAccount(connection, gAddrs.cc_ata);
      gState.ccProgBal = Number(ccAccount.amount);
    } catch { }
  }

  async function getProgBalances() {
    // const network = "http://127.0.0.1:8899";
    // const network = clusterApiUrl('devnet');
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);
    let ccbA = 0;

    // ccb bal
    try {
      const ccb0Account = await getAccount(connection, gAddrs.ccb0_ata);
      ccbA += Number(ccb0Account.amount);
    } catch { }

    try {
      const ccb1Account = await getAccount(connection, gAddrs.ccb1_ata);
      ccbA += Number(ccb1Account.amount);
    } catch { }
    gState.ccbProgBal = ccbA;

    // ccs bal
    try {
      const ccs0Account = await getAccount(connection, gAddrs.ccs0_ata);
      gState.ccsProgBal = Number(ccs0Account.amount);
    } catch { }
  }

  async function doBuyBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    if (gState.pstate === 0) {
      try {
        await program.methods.buyBonds0(
          new BN(buyBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb0Mint: gAddrs.ccb0Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcb0Token: gAddrs.owner_ccb0_ata,

          ccToken: gAddrs.cc_ata,
          ccb0Token: gAddrs.ccb0_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds0 failed'); }
    }
    if (gState.pstate === 2) {
      try {
        await program.methods.buyBonds1(
          new BN(buyBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb1Mint: gAddrs.ccb1Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcb1Token: gAddrs.owner_ccb1_ata,
          ccToken: gAddrs.cc_ata,
          ccb1Token: gAddrs.ccb1_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds1 failed'); }
    }
  }

  async function doSellBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    if (gState.pstate === 0) {
      try {
        await program.methods.sellBonds0(
          new BN(sellBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb0Mint: gAddrs.ccb0Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcb0Token: gAddrs.owner_ccb0_ata,

          ccToken: gAddrs.cc_ata,
          ccb0Token: gAddrs.ccb0_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellBonds0 failed'); }
    }
    if (gState.pstate === 2) {
      try {
        await program.methods.sellBonds1(
          new BN(sellBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb1Mint: gAddrs.ccb1Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcb1Token: gAddrs.owner_ccb1_ata,
          ccToken: gAddrs.cc_ata,
          ccb1Token: gAddrs.ccb1_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellBonds1 failed'); }
    }
  }

  async function doBuyShorts() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    if (gState.pstate === 0) {
      try {
        await program.methods.buyShorts0(
          new BN(buyShortsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb0Mint: gAddrs.ccb0Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcs0Token: gAddrs.owner_ccs0_ata,

          ccToken: gAddrs.cc_ata,
          ccb0Token: gAddrs.ccb0_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyShorts0 failed'); }
    }
    if (gState.pstate === 2) {
      try {
        await program.methods.buyShorts1(
          new BN(buyShortsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb1Mint: gAddrs.ccb1Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcs0Token: gAddrs.owner_ccs0_ata,
          ccToken: gAddrs.cc_ata,
          ccb1Token: gAddrs.ccb1_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds1 failed'); }
    }
  }

  async function doSellShorts() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    if (gState.pstate === 0) {
      try {
        await program.methods.sellShorts0(
          new BN(sellShortsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb0Mint: gAddrs.ccb0Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcs0Token: gAddrs.owner_ccs0_ata,

          ccToken: gAddrs.cc_ata,
          ccb0Token: gAddrs.ccb0_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch (err) {
        console.log(err);
        console.log('sellShorts0 failed'); }
    }
    if (gState.pstate === 2) {
      try {
        await program.methods.sellShorts1(
          new BN(sellShortsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb1Mint: gAddrs.ccb1Mint,
          ccs0Mint: gAddrs.ccs0Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcs0Token: gAddrs.owner_ccs0_ata,

          ccToken: gAddrs.cc_ata,
          ccb1Token: gAddrs.ccb1_ata,
          ccs0Token: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellShorts1 failed'); }
    }
  }


  async function doRedeemBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    if (gState.pstate === 0) {
      try {
        await program.methods.redeemBonds1(
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccb1MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb0Mint: gAddrs.ccb0Mint,
          ccb1Mint: gAddrs.ccb1Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcb0Token: gAddrs.owner_ccb0_ata,
          ownerCcb1Token: gAddrs.owner_ccb1_ata,

          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('redeemBonds1 failed'); }
    }
    if (gState.pstate === 2) {
      try {
        await program.methods.redeemBonds0(
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccb1MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMint: gAddrs.ccMint,
          ccb0Mint: gAddrs.ccb0Mint,
          ccb1Mint: gAddrs.ccb1Mint,

          ownerCcToken: gAddrs.owner_cc_ata,
          ownerCcb0Token: gAddrs.owner_ccb0_ata,
          ownerCcb1Token: gAddrs.owner_ccb1_ata,

          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('redeemBonds0 failed'); }
    }
  }

  function doUpdateClock() {
    let tt = spw - gState.timestamp % spw;
    let ttleft,tstr = (tt % 60).toString();
    tt = Math.floor(tt / 60);
    if (tt > 0) {
      while (tstr.length < 2) tstr = '0' + tstr;
      ttleft = tstr;
      tstr = (tt % 60).toString();
      tt = Math.floor(tt / 60);
      if (tt > 0) {
        while (tstr.length < 2) tstr = '0' + tstr;
        ttleft = tstr + ':' + ttleft;
        tstr = (tt % 24).toString();
        tt = Math.floor(tt / 24);
        if (tt > 0) {
          while (tstr.length < 2) tstr = '0' + tstr;
          ttleft = tstr + ':' + ttleft;
          ttleft = (tt % 7).toString() + ':' +  ttleft;
        } else {
          ttleft = tstr + ':' + ttleft;
        }
      } else {
        ttleft = tstr + ':' + ttleft;
      }
    } else {
      ttleft = tstr;
    }
    gState.tleft = ttleft;
    setRedraw(gState.timestamp);
  }

  async function doMultiple() {
    await doFetchState();
    await getProgCcBalance();
    await getProgBalances();
    await getOwnerBalances();
    if (gState.pstate === 0) {
      if (gState.redeem === 0) {
        if (gState.ccb1Bal > 0) gState.redeem = 1;
      } else if (gState.ccb1Bal === 0) {
        gState.redeem = 0;
      }
    }
    if (gState.pstate === 2) {
      if (gState.redeem === 0) {
        if (gState.ccb0Bal > 0) gState.redeem = 1;
      } else if (gState.ccb0Bal === 0) {
        gState.redeem = 0;
      }
    }
  }

  if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    if (!fetchTimer) {
      doMultiple();
      fetchTimer = setInterval(doMultiple,10000);
    }
    if (!clockTimer && gState.timestamp > 0) {
      clockTimer = setInterval(() => {
        gState.timestamp++;
        doUpdateClock();
      },1000);
    }
    const ir = (gState.ima0*60*60*24*365*100).toFixed(2) + '% APY';
    // const ccbBal = (Number(ccb0Bal) + Number(ccb1Bal)).toString();
    const ccBal = gState.ccBal.toString();
    const ccbBal = (gState.ccb0Bal + gState.ccb1Bal).toString();
    const ccsBal = gState.ccsBal.toString();

    // const ccbA = Number(ccbProgBal);
    const cc0Amount = (gState.ccProgBal - gState.ccbProgBal).toString();
    const ccbAmount = gState.ccbProgBal.toString();
    const ccsAmount = gState.ccsProgBal.toString();

    const ccbPrice = (Number(cc0Amount) / Number(ccbAmount)).toFixed(4);
    const ccsPrice = (Number(ccbAmount) / Number(ccsAmount) / gState.smod)
      .toFixed(4);


    const tleft = gState.tleft;
    return (
      <div className="App">
        <AppHeader ir={ir} />
        <div className="App-next">
          <div className="App-left">
            <div className="small-space-row"></div>
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
            <div className="small-space-row"></div>
            <div className="data-row">Reserves</div>
            <div className="data-row">CC0 {cc0Amount}</div>
            <div className="data-row">CCB {ccbAmount}</div>
            <div className="data-row">CC1 {ccbAmount}</div>
            <div className="data-row">CCS {ccsAmount}</div>
            <div className="small-space-row"></div>
            <div className="data-row">Mints</div>
            <div className="data-row">CC {gAddrs.ccMint.toString()}</div>
            <div className="data-row">CCB0 {gAddrs.ccb0Mint.toString()}</div>
            <div className="data-row">CCB1 {gAddrs.ccb1Mint.toString()}</div>
            <div className="data-row">CCS0 {gAddrs.ccs0Mint.toString()}</div>
          </div>
          <div className="App-right">
            <div className="small-space-row"></div>
              <h2>Balances</h2>
              <h3>CC {ccBal}</h3>
              <h3>CCB {ccbBal}</h3>
              <h3>CCS {ccsBal}</h3>
              <div className="space-row"></div>
              {
                gState.redeem === 0 ? (
                  <button className="time-button">Maturity in {tleft}</button>
                ) : (
                  <button className="emergency-button"
                    onClick={doRedeemBonds}>Redeem!</button>
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
  // <ConnectionProvider endpoint="http://127.0.0.1:8899">
const AppWithProvider = () => (
      <ConnectionProvider endpoint={network}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <App />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
)

export default AppWithProvider;
