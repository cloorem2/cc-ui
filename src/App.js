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

let mintAuth, mintAuthBump;
let ccMint, ccMintBump;
let ccb0Mint, ccb0MintBump;
let ccb1Mint, ccb1MintBump;
let ccs0Mint, ccs0MintBump;
let owner_cc_ata,owner_ccb0_ata,owner_ccb1_ata,owner_ccs0_ata;
let cc_ata,ccb0_ata,ccb1_ata,ccs0_ata;

class AppHeader extends React.Component {
  render() {
    return (
      <header className="App-header">
        <div className="header-left">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Currency Coin</h2>
        </div>
        <div className="header-right">
          <h2>{this.props.ir}%</h2>
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

  async function initAddrs() {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    const program = new Program(idl, programID, provider);

    [ mintAuth, mintAuthBump ] = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("mint_auth_") ], program.programId );

    [ ccMint, ccMintBump ] = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("cc_mint_") ], program.programId );
    [ ccb0Mint, ccb0MintBump ] = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb0_mint_") ], program.programId );
    [ ccb1Mint, ccb1MintBump ] = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccb1_mint_") ], program.programId );
    [ ccs0Mint, ccs0MintBump ] = await web3.PublicKey.findProgramAddress(
        [ Buffer.from("ccs0_mint_") ], program.programId );

    owner_cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: provider.wallet.publicKey
    });
    owner_ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: provider.wallet.publicKey
    });
    owner_ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: provider.wallet.publicKey
    });
    owner_ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: provider.wallet.publicKey
    });

    cc_ata = await utils.token.associatedAddress({
      mint: ccMint,
      owner: mintAuth
    });
    ccb0_ata = await utils.token.associatedAddress({
      mint: ccb0Mint,
      owner: mintAuth
    });
    ccb1_ata = await utils.token.associatedAddress({
      mint: ccb1Mint,
      owner: mintAuth
    });
    ccs0_ata = await utils.token.associatedAddress({
      mint: ccs0Mint,
      owner: mintAuth
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
    await initAddrs();
    try {
      const state = await program.account.mintAuth.fetch(mintAuth);
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
    await initAddrs();

    // cc bal
    try {
      const ccAccount = await getAccount(connection, owner_cc_ata);
      setCcBal(ccAccount.amount.toString());
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            owner_cc_ata,
            provider.wallet.publicKey,
            ccMint
          ));
          // const connection = new Connection(network, opts.preflightCommitment);
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccAccount = await getAccount(connection, owner_cc_ata);
          setCcBal(ccAccount.amount.toString());
        } catch {}
      }
    }

    // ccb bal
    try {
      const ccb0Account = await getAccount(connection, owner_ccb0_ata);
      setCcb0Bal(ccb0Account.amount.toString());
      ccbA += Number(ccb0Account.amount);
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            owner_ccb0_ata,
            provider.wallet.publicKey,
            ccb0Mint
          ));
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccb0Account = await getAccount(connection, owner_ccb0_ata);
          setCcb0Bal(ccb0Account.amount.toString());
          ccbA += Number(ccb0Account.amount);
        } catch {}
      }
    }

    try {
      const ccb1Account = await getAccount(connection, owner_ccb1_ata);
      setCcb1Bal(ccb1Account.amount.toString());
      ccbA += Number(ccb1Account.amount);
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            owner_ccb1_ata,
            provider.wallet.publicKey,
            ccb1Mint
          ));
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccb1Account = await getAccount(connection, owner_ccb1_ata);
          setCcb1Bal(ccb1Account.amount.toString());
          ccbA += Number(ccb1Account.amount);
        } catch {}
      }
    }

    // ccs bal
    try {
      const ccs0Account = await getAccount(connection, owner_ccs0_ata);
      setCcsBal(ccs0Account.amount.toString())
    } catch (err) {
      if (err.message === 'TokenAccountNotFoundError'
        || err.message === 'TokenInvalidAccountOwnerError') {
        try {
          const tx = new Transaction();
          tx.add(createAssociatedTokenAccountInstruction(
            provider.wallet.publicKey,
            owner_ccs0_ata,
            provider.wallet.publicKey,
            ccs0Mint
          ));
          tx.feePayer = provider.wallet.publicKey;
          const blockHash = await provider.connection.getRecentBlockhash();
          tx.recentBlockhash = await blockHash.blockhash;
          const signed = await signTransaction(tx);
          await provider.connection.sendRawTransaction(signed.serialize());
          await sleep.sleep(2);

          const ccs0Account = await getAccount(connection, owner_ccs0_ata);
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
    await initAddrs();
    // cc bal
    try {
      const ccAccount = await getAccount(connection, cc_ata);
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
    await initAddrs();

    // ccb bal
    try {
      const ccb0Account = await getAccount(connection, ccb0_ata);
      ccbA += Number(ccb0Account.amount);
    } catch { }

    try {
      const ccb1Account = await getAccount(connection, ccb1_ata);
      ccbA += Number(ccb1Account.amount);
    } catch { }
    setCcbProgBal(ccbA.toString());

    // ccs bal
    try {
      const ccs0Account = await getAccount(connection, ccs0_ata);
      setCcsProgBal(ccs0Account.amount.toString())
    } catch { }
  }

  async function doBuyBonds() {
    const provider = await getProvider()
    const program = new Program(idl, programID, provider);
    await initAddrs();

    if (pstate === '0') {
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
    if (pstate === '2') {
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
    await initAddrs();

    if (pstate === '0') {
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
    if (pstate === '2') {
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
    await initAddrs();

    if (pstate === '0') {
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
    if (pstate === '2') {
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
    await initAddrs();

    if (pstate === '0') {
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
    if (pstate === '2') {
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
    await initAddrs();

    if (pstate === '0') {
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
    if (pstate === '2') {
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

  function doMain() {
    doFetchState();
    getProgCcBalance();
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
    setInterval(doMain,10000);
    const ir = (Number(ima0)*60*60*24*365*100).toFixed(2) + ' APY';
    /*
    let tt = spw - new BN(timestamp) % spw;
    let tleft = (tt % BN_60).toString() + 's'; tt /= BN_60;
    if (tt > BN_0) {
      tleft = (tt % BN_60).toString() + 'm' + tleft; tt /= BN_60;
      if (tt > BN_0) {
        tleft = (tt % BN_24).toString() + 'h' + tleft; tt /= BN_24;
        if (tt > BN_0) {
          tleft = (tt % BN_7).toString() + 'd' +  tleft;
        }
      }
    }
    */
    const nspw = Number(60*60*24*7);
    const tleft = (nspw - (Number(timestamp) % nspw)).toString();
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
