import React, { useState, useEffect } from 'react';
import { useRouter } from "next/router";
import { Typography, Paper, TextField, MenuItem, Grid, InputAdornment } from '@material-ui/core';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import classes from './landing.module.css';
import BigNumber from 'bignumber.js';

import stores from '../../stores/index.js';
import { GET_MAX, MAX_RETURNED, ERROR } from '../../stores/constants';

import { formatCurrency, formatAddress } from '../../utils';

function Landing({ changeTheme }) {
  const router = useRouter();

  const [asset, setAsset] = useState('');
  const [loading, setLoading] = useState(false);
  const [web3, setWeb3] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetDetails, setAssetDetails] = useState(null);

  useEffect(async function () {
    setWeb3(await stores.accountStore.getWeb3Provider());
    setAssets(stores.ltvStore.getStore('assets'));
  }, []);

  useEffect(function () {
    const maxReturned = (maxVals) => {
      console.log(maxVals);
      setAssetDetails(maxVals);
      setLoading(false);
    };

    stores.emitter.on(MAX_RETURNED, maxReturned);

    return () => {
      stores.emitter.removeListener(MAX_RETURNED, maxReturned);
    };
  }, []);

  const onPoolSelectChange = (event, theOption) => {
    setAsset(theOption);

    setLoading(true);
    stores.dispatcher.dispatch({
      type: GET_MAX,
      content: { address: theOption.address },
    });
  };

  const renderAssetOption = (web3, option) => {
    return (
      <MenuItem key={option.id} value={option.symbol} className={classes.assetSelectMenu}>
        <div className={classes.poolSelectOption}>
          <img
            className={classes.poolIcon}
            src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3.utils.toChecksumAddress(
              option.address,
            )}/logo.png`}
            width={30}
            height={30}
          />
          <Typography variant="h5">{option.symbol}</Typography>
        </div>
      </MenuItem>
    );
  };

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>Yearn.Fi</title>
      </Head>
        <div className={classes.landingContainer}>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            <Paper elevation={0} className={classes.intro}>
              <Typography variant="h1">Welcome to Yearn.Fi</Typography>
              <Typography variant="body2">Yearn Finance is a suite of products in Decentralized Finance (DeFi) that provides lending aggregation, yield generation, and insurance on the Ethereum blockchain. The protocol is maintained by various independent developers and is governed by YFI holders.</Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <a onClick={() => router.push('/invest')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconvaults}></div>
                </div>
                <Typography variant="h6">Investment Vaults</Typography>
                <Typography variant="body2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item xs={4}>
            <a onClick={() => router.push('/lend')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconlend}></div>
                </div>
                <Typography variant="h6">Lend &amp; Borrow</Typography>
                <Typography variant="body2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item xs={4}>
            <a onClick={() => router.push('/cdp')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconcdp}></div>
                </div>
                <Typography variant="h6">Collateral Staking</Typography>
                <Typography variant="body2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item xs={4}>
            <a onClick={() => router.push('/ltv')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconltv}></div>
                </div>
                <Typography variant="h6">LTV Lookup</Typography>
                <Typography variant="body2">
                  LTV Lookup displays how much you can borrow per $1 worth of the asset provided to the different protocols.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item xs={4}>
            <a onClick={() => router.push('/stats')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconstats}></div>
                </div>
                <Typography variant="h6">Statistics</Typography>
                <Typography variant="body2">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item xs={3}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Multichain</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Chainlist</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Feeds</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">veAssets</Typography>
            </Paper>
          </Grid>
        </Grid>
        </div>
    </Layout>
  );
}

export default Landing;
