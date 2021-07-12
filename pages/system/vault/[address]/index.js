import React, { useState, useEffect } from 'react';
import { useRouter } from "next/router";

import { Typography, Paper } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import Head from 'next/head';
import Layout from '../../../../components/layout/layout.js';
import Token from '../../../../components/exploreVaultStrategy/exploreVaultToken.js'
import classes from './system.module.css';
import BigNumber from 'bignumber.js';

import stores from '../../../../stores/index.js';
import { SYSTEM_UPDATED } from '../../../../stores/constants';

import { formatCurrency } from '../../../../utils';

import ExploreVaultStrategy from '../../../../components/exploreVaultStrategy';

function System({ changeTheme }) {

  const router = useRouter();

  const [ vault, setVault ] = useState(null);

  useEffect(function () {

  const systemUpdated = () => {
      const systemJson = stores.investStore.getStore('systemJSON')

      const theVault = systemJson.filter((vault) => {
        return router.query.address === vault.address
      })

      if(theVault && theVault.length > 0) {
        setVault(theVault[0])
      }
    };

    systemUpdated()

    stores.emitter.on(SYSTEM_UPDATED, systemUpdated);

    return () => {
      stores.emitter.removeListener(SYSTEM_UPDATED, systemUpdated);
    };
  }, []);

  const backClicked = () => {
    router.push('/system')
  }

  const vaultType = vault ? (vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type) : '';

  let vaultTypeClass = null;
  switch (vaultType) {
    case 'v1':
      vaultTypeClass = classes.vaultV1VersionContainer;
      break;
    case 'v2':
      vaultTypeClass = classes.vaultV2VersionContainer;
      break;
    case 'Exp':
      vaultTypeClass = classes.vaultExpVersionContainer;
      break;
    case 'Earn':
      vaultTypeClass = classes.vaultEarnVersionContainer;
      break;
    case 'Lockup':
      vaultTypeClass = classes.vaultLockupVersionContainer;
      break;
    default:
      vaultTypeClass = classes.vaultVersionContainer;
      break;
  }

  const renderStrategies = () => {
    if(vault && vault.strategies) {
      return vault.strategies.map((strat) => {
        return <ExploreVaultStrategy strategy={ strat } />
      })
    }

    return null
  }

  return (
    <Layout changeTheme={changeTheme} backClicked={ backClicked }>
      <Head>
        <title>System</title>
      </Head>
      <div className={ classes.vaultContainer }>
        <Paper elevation={0} className={ classes.vaultInfoContainer }>
          <img src={(vault && vault.icon) ? vault.icon : '/tokens/unknown-logo.png'} className={classes.vaultIcon} alt="" width={50} height={50} />
          <div className={classes.vaultTitle}>
            <Typography variant="h1">{!vault ? <Skeleton /> : vault.displayName}</Typography>
            <div className={vaultTypeClass}>
              <Typography className={classes.vaultVersionText}>{vaultType} Vault</Typography>
            </div>
          </div>
          { vault &&
            <>
              <div className={ classes.depositTokenContainer }>
                <Typography>Total Value Locked</Typography>
                <Typography variant='h1'>${ formatCurrency(vault.tvl.tvl) }</Typography>
              </div>
              <div className={ classes.depositTokenContainer }>
                <Typography>Strategies in play</Typography>
                <Typography variant='h1'>{ vault.strategies.length }</Typography>
              </div>
            </>
          }
        </Paper>
        <div className={ classes.strategiesContainer }>
          { renderStrategies() }
        </div>
      </div>
    </Layout>
  );
}

export default System;
