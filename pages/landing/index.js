import React, { useEffect } from 'react';
import { useRouter } from "next/router";
import { Typography, Paper, Grid } from '@material-ui/core';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import classes from './landing.module.css';

import stores from '../../stores/index.js';
import { MAX_RETURNED } from '../../stores/constants';


function Landing({ changeTheme }) {
  const router = useRouter();

  useEffect(function () {
    const maxReturned = (maxVals) => {
      console.log(maxVals);
    };

    stores.emitter.on(MAX_RETURNED, maxReturned);

    return () => {
      stores.emitter.removeListener(MAX_RETURNED, maxReturned);
    };
  }, []);

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
          <Grid item xs={3} onClick={() => { window.open('https://multichain.xyz', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Multichain</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3} onClick={() => { window.open('https://chainlist.org/', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Chainlist</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3} onClick={() => { window.open('https://feeds.sushiquote.finance/', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Feeds</Typography>
            </Paper>
          </Grid>
          <Grid item xs={3} onClick={() => { window.open('https://ve-token-voting.vercel.app/', '_blank') }}>
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
