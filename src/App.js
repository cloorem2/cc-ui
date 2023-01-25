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

const spw = new BN(60*60*24*7);
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
const ccMintConst = "5jGmQSUMvQ5dKrLXuh3oUjczWWLefUEQHX3EGKXnLjjS";
const ccb0MintConst = "GVWmAjaond6PrChG4bPZRWRbQAs2gwFbHE5t3NfUhbft";
const ccb1MintConst = "7c72g38GCvGyNqBL7zEdQS7nHq9DfiRAUQcRiSDH5FDx";
const ccs0MintConst = "EBj4FTsN2BHbNtbctvzCX96JS3ksB8z1ukWcZQjqCujr";

const mintAuthConst = "5Ju8Dax7SgVsygfwkkuDX1eoJHwCQFgjpiCSctjrPZoC";

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
let timer;

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
  // const [value, setValue] = useState(null);
  // state vars
  const [ima0, setIma0] = useState(null);
  const [pstate, setPstate] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [redeem, setRedeem] = useState('');

  const [ccBal, setCcBal] = useState(null);
  const [ccsBal, setCcsBal] = useState(null);
  const [ccb0Bal, setCcb0Bal] = useState(null);
  const [ccb1Bal, setCcb1Bal] = useState(null);

  const [ccProgBal, setCcProgBal] = useState(null);
  const [ccsProgBal, setCcsProgBal] = useState(null);
  const [ccbProgBal, setCcbProgBal] = useState(null);

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
        console.log('mintAuth ' + gAddrs.mintAuth);

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
      // console.log('state: ', state);
      setTimestamp(state.timestamp.toString());
      setPstate(state.maturityState.toString());
      setIma0(state.ima0.toString());
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
    let ccbA = 0;
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    // cc bal
    try {
      const ccAccount = await getAccount(connection, gAddrs.owner_cc_ata);
      setCcBal(ccAccount.amount.toString());
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
          setCcBal(ccAccount.amount.toString());
        } catch {}
      }
    }

    // ccb bal
    try {
      const ccb0Account = await getAccount(connection, gAddrs.owner_ccb0_ata);
      setCcb0Bal(ccb0Account.amount.toString());
      ccbA += Number(ccb0Account.amount);
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
          setCcb0Bal(ccb0Account.amount.toString());
          ccbA += Number(ccb0Account.amount);
        } catch {}
      }
    }

    try {
      const ccb1Account = await getAccount(connection, gAddrs.owner_ccb1_ata);
      setCcb1Bal(ccb1Account.amount.toString());
      ccbA += Number(ccb1Account.amount);
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
          setCcb1Bal(ccb1Account.amount.toString());
          ccbA += Number(ccb1Account.amount);
        } catch {}
      }
    }

    // ccs bal
    try {
      const ccs0Account = await getAccount(connection, gAddrs.owner_ccs0_ata);
      setCcsBal(ccs0Account.amount.toString())
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
          setCcsBal(ccs0Account.amount.toString())
        } catch {}
      }
    }

    if (pstate === '0') {
      if (Number(ccb1Bal) > 0) {
        setRedeem('1');
      } else { setRedeem(''); }
    }
    if (pstate === '2') {
      if (Number(ccb0Bal) > 0) {
        setRedeem('1');
      } else { setRedeem(''); }
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
      setCcProgBal(ccAccount.amount.toString());
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
    let ccbA = 0;
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    // ccb bal
    try {
      const ccb0Account = await getAccount(connection, gAddrs.ccb0_ata);
      ccbA += Number(ccb0Account.amount);
    } catch { }

    try {
      const ccb1Account = await getAccount(connection, gAddrs.ccb1_ata);
      ccbA += Number(ccb1Account.amount);
    } catch { }
    setCcbProgBal(ccbA.toString());

    // ccs bal
    try {
      const ccs0Account = await getAccount(connection, gAddrs.ccs0_ata);
      setCcsProgBal(ccs0Account.amount.toString())
    } catch { }
  }

  async function doBuyBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    if (!gAddrs.mintAuth) await initAddrs(provider,program);

    if (pstate === '0') {
      try {
        await program.methods.buyBonds0(
          new BN(buyBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb0MintAccount: gAddrs.ccb0Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb0Account: gAddrs.owner_ccb0_ata,

          ccAccount: gAddrs.cc_ata,
          ccb0Account: gAddrs.ccb0_ata,
          ccs0Account: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyBonds0 failed'); }
    }
    if (pstate === '2') {
      try {
        await program.methods.buyBonds1(
          new BN(buyBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb1MintAccount: gAddrs.ccb1Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb1Account: gAddrs.owner_ccb1_ata,
          ccAccount: gAddrs.cc_ata,
          ccb1Account: gAddrs.ccb1_ata,
          ccs0Account: gAddrs.ccs0_ata,
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

    if (pstate === '0') {
      try {
        await program.methods.sellBonds0(
          new BN(sellBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb0MintAccount: gAddrs.ccb0Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb0Account: gAddrs.owner_ccb0_ata,

          ccAccount: gAddrs.cc_ata,
          ccb0Account: gAddrs.ccb0_ata,
          ccs0Account: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellBonds0 failed'); }
    }
    if (pstate === '2') {
      try {
        await program.methods.sellBonds1(
          new BN(sellBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb1MintAccount: gAddrs.ccb1Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb1Account: gAddrs.owner_ccb1_ata,
          ccAccount: gAddrs.cc_ata,
          ccb1Account: gAddrs.ccb1_ata,
          ccs0Account: gAddrs.ccs0_ata,
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

    if (pstate === '0') {
      try {
        await program.methods.buyShorts0(
          new BN(buyBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb0MintAccount: gAddrs.ccb0Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcs0Account: gAddrs.owner_ccs0_ata,

          ccAccount: gAddrs.cc_ata,
          ccb0Account: gAddrs.ccb0_ata,
          ccs0Account: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('buyShorts0 failed'); }
    }
    if (pstate === '2') {
      try {
        await program.methods.buyShorts1(
          new BN(buyBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb1MintAccount: gAddrs.ccb1Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcs0Account: gAddrs.owner_ccs0_ata,
          ccAccount: gAddrs.cc_ata,
          ccb1Account: gAddrs.ccb1_ata,
          ccs0Account: gAddrs.ccs0_ata,
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

    if (pstate === '0') {
      try {
        await program.methods.sellShorts0(
          new BN(sellBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb0MintAccount: gAddrs.ccb0Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb0Account: gAddrs.owner_ccs0_ata,

          ccAccount: gAddrs.cc_ata,
          ccb0Account: gAddrs.ccb0_ata,
          ccs0Account: gAddrs.ccs0_ata,
          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('sellShorts0 failed'); }
    }
    if (pstate === '2') {
      try {
        await program.methods.sellShorts1(
          new BN(sellBondsAmount),
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb1MintBump,
          gAddrs.ccs0MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb1MintAccount: gAddrs.ccb1Mint,
          ccs0MintAccount: gAddrs.ccs0Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcs0Account: gAddrs.owner_ccs0_ata,

          ccAccount: gAddrs.cc_ata,
          ccb1Account: gAddrs.ccb1_ata,
          ccs0Account: gAddrs.ccs0_ata,
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

    if (pstate === '0') {
      try {
        await program.methods.redeemBonds1(
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccb1MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb0MintAccount: gAddrs.ccb0Mint,
          ccb1MintAccount: gAddrs.ccb1Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb0Account: gAddrs.owner_ccb0_ata,
          ownerCcb1Account: gAddrs.owner_ccb1_ata,

          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('redeemBonds1 failed'); }
    }
    if (pstate === '2') {
      try {
        await program.methods.redeemBonds0(
          gAddrs.mintAuthBump,
          gAddrs.ccMintBump,
          gAddrs.ccb0MintBump,
          gAddrs.ccb1MintBump,
        ).accounts({
          mintAuthority: gAddrs.mintAuth,

          ccMintAccount: gAddrs.ccMint,
          ccb0MintAccount: gAddrs.ccb0Mint,
          ccb1MintAccount: gAddrs.ccb1Mint,

          ownerCcAccount: gAddrs.owner_cc_ata,
          ownerCcb0Account: gAddrs.owner_ccb0_ata,
          ownerCcb1Account: gAddrs.owner_ccb1_ata,

          owner: provider.wallet.publicKey,
          tokenProgram: utils.token.TOKEN_PROGRAM_ID,
        }).rpc();
      } catch { console.log('redeemBonds0 failed'); }
    }
  }

  async function doMain() {
    await doFetchState();
    await getProgCcBalance();
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
    getProgCcBalance();
    getOwnerBalances();
    getProgBalances();
    // if (!timer) timer = setInterval(doMain,10000);
    const ir = (Number(ima0)*60*60*24*365*100).toFixed(2) + '% APY';
    const nspw = Number(60*60*24*7);
    let tt = nspw - Number(timestamp) % nspw;
    let ttleft = (tt % 60).toString() + 's';
    tt = Number((tt/60).toFixed());
    if (tt > 0) {
      ttleft = (tt % 60).toString() + 'm' + ttleft;
      tt = Number((tt/60).toFixed());
      if (tt > 0) {
        ttleft = (tt % 24).toString() + 'h' + ttleft;
        tt = Number((tt/24).toFixed());
        if (tt > 0) {
          ttleft = (tt % 7).toString() + 'd' +  ttleft;
        }
      }
    }
    const tleft = ttleft;
    // const nspw = Number(60*60*24*7);
    // const tleft = (nspw - (Number(timestamp) % nspw)).toString();
    const ccbBal = (Number(ccb0Bal) + Number(ccb1Bal)).toString();

    const ccbA = Number(ccbProgBal);
    const cc0Amount = (Number(ccProgBal) - ccbA).toString();
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
            <div className="data-row">CC0 {cc0Amount}</div>
            <div className="data-row">CCB {ccbProgBal}</div>
            <div className="data-row">CC1 {ccbProgBal}</div>
            <div className="data-row">CCS {ccsProgBal}</div>
            <div className="small-space-row"></div>
            <div className="data-row">Mints</div>
            <div className="data-row">CC {ccMintConst}</div>
            <div className="data-row">CCB0 {ccb0MintConst}</div>
            <div className="data-row">CCB1 {ccb1MintConst}</div>
            <div className="data-row">CCS0 {ccs0MintConst}</div>
          </div>
          <div className="App-right">
            <div className="small-space-row"></div>
              <h2>Balances</h2>
              <h3>CC {ccBal}</h3>
              <h3>CCB {ccbBal}</h3>
              <h3>CCS {ccsBal}</h3>
              <div className="space-row"></div>
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
