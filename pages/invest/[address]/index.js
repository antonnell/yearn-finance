import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../../../components/layout/layout.js'
import {
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button
} from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';

import classes from './vault.module.css'

import TrendingUpIcon from '@material-ui/icons/TrendingUp';

import VaultStrategyCard from '../../../components/vaultStrategyCard'
import VaultActionCard from '../../../components/vaultActionCard'
import VaultGrowthNumbers from '../../../components/vaultGrowthNumbers'
import VaultPerformanceGraph from '../../../components/vaultPerformanceGraph'

import stores from '../../../stores'
import {
  VAULTS_UPDATED,
  GET_VAULT_PERFORMANCE,
  VAULT_PERFORMANCE_RETURNED,
  ACCOUNT_CHANGED
} from '../../../stores/constants'

function Vault(props) {
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const router = useRouter()

  const storeAccount = stores.accountStore.getStore('account')
  const [ account, setAccount ] = useState(storeAccount)

  const storeVault = stores.investStore.getVault(router.query.address)
  const [ vault, setVault ] = useState(storeVault)

  const backClicked = () => {
    router.push('/invest')
  }

  useEffect(() => {
    function vaultsUpdated() {
      const v = stores.investStore.getVault(router.query.address)
      setVault(v)
      forceUpdate()
    }

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated)
    stores.emitter.on(VAULT_PERFORMANCE_RETURNED, vaultsUpdated)

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated)
      stores.emitter.removeListener(VAULT_PERFORMANCE_RETURNED, vaultsUpdated)
    }
  }, [])

  useEffect(() => {
    const accountChanged = () => {
      const storeAccount = stores.accountStore.getStore('account')
      setAccount(storeAccount)
    }

    stores.emitter.on(ACCOUNT_CHANGED, accountChanged)
    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged)
    }
  }, [])

  useEffect(() => {
    stores.dispatcher.dispatch({ type: GET_VAULT_PERFORMANCE, content: { address: router.query.address, duration: 'Month' } })
  }, [])

  return (
    <Layout changeTheme={ props.changeTheme } backClicked={ backClicked }>
      <Head>
        <title>Invest</title>
      </Head>
      <div className={ classes.vaultContainer }>
        <div className={ classes.vaultStatsContainer }>
          <div className={ classes.vaultBalanceContainer }>
            <div className={ classes.vaultOutline } >
              <div className={ classes.vaultLogo }>
                { !vault ? <Skeleton /> : <img src={ vault.tokenMetadata.icon } className={ classes.vaultIcon } alt='' width={ 50 } height={ 50 } /> }
              </div>
            </div>
            <div className={ classes.vaultTitle }>
              <Typography variant='subtitle1' color='textSecondary'>
                { !vault ? <Skeleton /> : ((vault.type === 'v2' && !vault.endorsed) ? 'Exp' : vault.type) }
              </Typography>
              <Typography variant='h1'>
                { !vault ? <Skeleton /> : vault.displayName }
              </Typography>
            </div>
          </div>
        </div>
        <div className={ classes.vaultInfo }>
          <div className={ classes.cardSeparation }>
            {
              vault && vault.strategies && vault.strategies.map((strategy) => {
                return <VaultStrategyCard strategy={ strategy } />
              })
            }
            <VaultActionCard vault={ vault } />
          </div>
          <div className={ classes.cardSeparation }>
            { account && account.address && <VaultGrowthNumbers vault={ vault } />}
            <VaultPerformanceGraph vault={ vault } />
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Vault
