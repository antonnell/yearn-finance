import { useRouter } from "next/router";
import { Typography, Paper, Grid } from '@material-ui/core';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import classes from './about.module.css';

function About({ changeTheme }) {
  const router = useRouter();

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>Yearn.Fi</title>
      </Head>
        <div className={classes.landingContainer}>
        <Grid container spacing={3}>
          <Grid item lg={4} md={12} xs={12}>
            <Paper elevation={0} className={classes.intro}>
              <Typography variant="h1">Welcome to Yearn.Fi</Typography>
              <Typography variant="body2">Yearn Finance is a suite of products in Decentralized Finance (DeFi) that provides lending aggregation, yield generation, and insurance on the Ethereum blockchain. The protocol is maintained by various independent developers and is governed by YFI holders.</Typography>
            </Paper>
          </Grid>
          <Grid item lg={4} md={6} sm={6} xs={12}>
            <a onClick={() => router.push('/invest')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconvaults}></div>
                </div>
                <Typography variant="h6">Investment Vaults</Typography>
                <Typography variant="body2">
                  Vaults follow unique strategies that are designed to maximize the yield of the deposited asset and minimize risk.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item lg={4} md={6} sm={6} xs={12}>
            <a onClick={() => router.push('/lend')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconlend}></div>
                </div>
                <Typography variant="h6">Lend &amp; Borrow</Typography>
                <Typography variant="body2">
                  Supply assets to the Iron Bank to get your share of the lending fees. Borrow against your provided collateral.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item lg={4} md={6} sm={6} xs={12}>
            <a onClick={() => router.push('/cdp')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconcdp}></div>
                </div>
                <Typography variant="h6">Collateral Staking</Typography>
                <Typography variant="body2">
                  Unit Protocol is a decentralized protocol that allows you to mint stablecoin $USDP using a variety of tokens as collateral.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item lg={4} md={6} sm={6} xs={12}>
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
          <Grid item lg={4} md={6} sm={6} xs={12}>
            <a onClick={() => router.push('/system')} className={classes.linkz}>
              <Paper elevation={0}  className={classes.paper}>
                <div className={classes.icon}>
                  <div className={classes.iconstats}></div>
                </div>
                <Typography variant="h6">Statistics</Typography>
                <Typography variant="body2">
                  An overview of the Yearn ecosystem. Get a quick glance at the performance of all of Yearn's vaults.
                </Typography>
              </Paper>
            </a>
          </Grid>
          <Grid item lg={3} md={6} xs={12} onClick={() => { window.open('https://multichain.xyz', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Multichain</Typography>
            </Paper>
          </Grid>
          <Grid item lg={3} md={6} xs={12} onClick={() => { window.open('https://chainlist.org/', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Chainlist</Typography>
            </Paper>
          </Grid>
          <Grid item lg={3} md={6} xs={12} onClick={() => { window.open('https://feeds.sushiquote.finance/', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">Feeds</Typography>
            </Paper>
          </Grid>
          <Grid item lg={3} md={6} xs={12} onClick={() => { window.open('https://ve-token-voting.vercel.app/', '_blank') }}>
            <Paper elevation={0}  className={classes.sublinks}>
              <Typography variant="h2">veAssets</Typography>
            </Paper>
          </Grid>
        </Grid>
        </div>
    </Layout>
  );
}

export default About;
