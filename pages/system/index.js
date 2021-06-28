import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, InputAdornment, Grid } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import classes from './system.module.css';
import BigNumber from 'bignumber.js';

import SystemFilters from '../../components/systemFilters';
import SystemProtocolsGraph from '../../components/systemProtocolsGraph';
import SystemStrategiesGraph from '../../components/systemStrategiesGraph';
import SystemVaultsGraph from '../../components/systemVaultsGraph';
import SystemAssetsGraph from '../../components/systemAssetsGraph';

import stores from '../../stores/index.js';
import { VAULTS_UPDATED, ETHERSCAN_URL, LEND_UPDATED } from '../../stores/constants';

import { formatCurrency } from '../../utils';

function System({ changeTheme }) {

  const [tvl, setTvl] = useState(null);
  const [ironBankTVL, setIronBankTVL] = useState(null);

  const [ filters, setFilters ] = useState({
    versions: [],
    search: '',
    layout: 'pie'
  });

  const [ assets, setAssets ] = useState([]);
  const [ protocols, setProtocols] = useState([]);
  const [ strategies, setStrategies] = useState([]);
  const [ vaults, setVaults ] = useState([]);

  useEffect(function () {
    const vaultsUpdated = () => {
      setTvl(stores.investStore.getStore('tvlInfo'));
    };

    const lendUpdated = () => {
      setIronBankTVL(stores.lendStore.getStore('ironBankTVL'));
    };

    setTvl(stores.investStore.getStore('tvlInfo'));
    setIronBankTVL(stores.lendStore.getStore('ironBankTVL'));

    setAssets(stores.systemStore.getStore('assets'));
    setProtocols(stores.systemStore.getStore('protocols'));
    setStrategies(stores.systemStore.getStore('strategies'));
    setVaults(stores.systemStore.getStore('vaults'));

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);
    stores.emitter.on(LEND_UPDATED, lendUpdated);

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
      stores.emitter.removeListener(LEND_UPDATED, lendUpdated);
    };
  }, []);

  const onFiltersChanged = (versions, search, layout) => {
    setFilters({
      versions,
      search,
      layout
    })
  }

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>System</title>
      </Head>
      <Paper elevation={0} className={classes.overviewContainer2}>
        <Grid container center spacing={0}>
          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Value Locked</Typography>
                <Typography variant="h1">
                  {!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(BigNumber(tvl.tvlUSD).plus(ironBankTVL), 0)}`}
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Vault Balance</Typography>
                <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalVaultHoldingsUSD, 0)}`}</Typography>
              </div>
            </div>
          </Grid>

          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Earn Balance</Typography>
                <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalEarnHoldingsUSD, 0)}`}</Typography>
              </div>
            </div>
          </Grid>

          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Iron Bank Balance</Typography>
                <Typography variant="h1">{!ironBankTVL ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(ironBankTVL, 0)}`}</Typography>
              </div>
            </div>
          </Grid>
        </Grid>
      </Paper>
      <SystemFilters onFiltersChanged={ onFiltersChanged } />
      <div className={classes.graphsContainer}>
        <SystemProtocolsGraph protocols={ protocols } filters={ filters } />
        <SystemStrategiesGraph strategies={ strategies } filters={ filters } />
        <SystemVaultsGraph vaults={ vaults } filters={ filters } />
        <SystemAssetsGraph assets={ assets } filters={ filters } />
      </div>
    </Layout>
  );
}

export default System;
