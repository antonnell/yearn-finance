import React, { useState, useEffect } from 'react';

import {
  Typography,
  Paper,
} from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import classes from './stats.module.css'
import BigNumber from 'bignumber.js'

import stores from '../../stores/index.js'
import { VAULTS_UPDATED, ETHERSCAN_URL } from '../../stores/constants'

import { formatCurrency, formatAddress } from '../../utils'


function StatsHeader() {
  return (
    <div className={ classes.txRow }>
      <div className={ classes.txCellDescription}>
        <Typography variant='h5'>Vault</Typography>
      </div>
      <div className={ classes.txCell }>
        <Typography variant='h5'>Version</Typography>
      </div>
      <div className={ classes.txCellAddress }>
        <Typography variant='h5'>Strategies</Typography>
      </div>
      <div className={ classes.txCell }>
        <Typography variant='h5' align='right'>Last 30 days APY</Typography>
      </div>
      <div className={ classes.txCell }>
        <Typography variant='h5' align='right'>APY since Inception</Typography>
      </div>
    </div>
  )
}


function StatsData({ vault }) {

  const onVaultClicked = () => {
    window.open(`${ETHERSCAN_URL}address/${vault.address}`, "_blank")
  }

  const onStrategyClicked = (strat) => {
    window.open(`${ETHERSCAN_URL}address/${strat.address}`, "_blank")
  }

  return (
    <div className={ classes.txRow }>
      <div className={ classes.txCellDescription} onClick={ onVaultClicked }>
        <div className={ classes.descriptionCell }>
          <div className={ classes.vaultLogo }>
            <img src={ vault.tokenMetadata.icon ? vault.tokenMetadata.icon : '/tokens/unknown-logo.png' } alt='' width={ 30 } height={ 30 } />
          </div>
          <div>
            <Typography variant='h5'>{ vault.displayName }</Typography>
            <Typography variant='subtitle1' className={ classes.subTitle } color='textSecondary'>{ vault.name}</Typography>
          </div>
        </div>
      </div>
      <div className={ classes.txCell}>
        <Typography variant='h5'>{ (vault.type === 'v2' && !vault.endorsed) ? 'Experimental' : vault.type } Vault</Typography>
      </div>
      <div className={ classes.txCellAddress} >
        { vault && vault.strategies && vault.strategies.map((strategy) => {
          return <Typography key={ strategy.address } variant='h5' onClick={ () => { onStrategyClicked(strategy) } } className={ classes.strategy }>{ strategy.name ? strategy.name.replace(/^Strategy/, '') : '' }</Typography>
        }) }
      </div>
      <div className={ classes.txCell}>
        <Typography variant='h5' align='right' className={ classes.fontWeightBold }>{ vault.apy.oneMonthSample ? formatCurrency(BigNumber(vault.apy.oneMonthSample).times(100)) : '0.00' }%</Typography>
      </div>
      <div className={ classes.txCell}>
        <Typography variant='h5' align='right' className={ classes.fontWeightBold }>{ vault.apy.inceptionSample ? formatCurrency(BigNumber(vault.apy.inceptionSample).times(100)) : '0.00' }%</Typography>
      </div>
    </div>
  )
}

function Stats({ changeTheme }) {
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const storeVaults = stores.investStore.getStore('vaults')
  const storeTvl = stores.investStore.getStore('tvlInfo')

  const [ vaults, setVaults ] = useState(storeVaults)
  const [ tvl, setTvl ] = useState(storeTvl)

  useEffect(function() {
    const vaultsUpdated = () => {
      setVaults(stores.investStore.getStore('vaults'))
      setTvl(stores.investStore.getStore('tvlInfo'))
      forceUpdate()
    }

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated)

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated)
    }
  },[]);

  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Stats</title>
      </Head>
      <Paper elevation={ 0 } className={ classes.overviewContainer }>
        <div className={ classes.overviewCard }>
          <div>
            <Typography variant='h2'>Total Value Locked</Typography>
            <Typography variant='h1'>{ !tvl ? <Skeleton style={{ minWidth: '200px '}} /> : `$ ${formatCurrency(tvl.TvlUSD)}` }</Typography>
          </div>
        </div>
        <div className={ classes.separator }></div>
        <div className={ classes.overviewCard }>
          <div>
            <Typography variant='h2'>Total Vault Balance</Typography>
            <Typography variant='h1'>{ !tvl ? <Skeleton style={{ minWidth: '200px '}} /> : `$ ${formatCurrency(tvl.totalVaultHoldingsUSD)}` }</Typography>
          </div>
        </div>
        <div className={ classes.separator }></div>
        <div className={ classes.overviewCard }>
          <div>
            <Typography variant='h2'>Total Earn Balance</Typography>
            <Typography variant='h1'>{ !tvl ? <Skeleton style={{ minWidth: '200px '}} /> : `$ ${formatCurrency(tvl.totalEarnHoldingsUSD)}` }</Typography>
          </div>
        </div>
      </Paper>
      <div className={ classes.statsContainer }>
        <StatsHeader />
        { vaults && (
          vaults.map((vault) => {
            return <StatsData key={ vault.address }vault={ vault } />
          })
        )}
      </div>
    </Layout>
  )
}

export default Stats
