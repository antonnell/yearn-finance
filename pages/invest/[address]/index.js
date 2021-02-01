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
import VaultTransactions from '../../../components/vaultTransactions'

import stores from '../../../stores'
import {
  VAULTS_UPDATED,
  GET_VAULT_PERFORMANCE,
  VAULT_PERFORMANCE_RETURNED,
  GET_VAULT_TRANSACTIONS,
  VAULT_TRANSACTIONS_RETURNED,
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
    stores.emitter.on(VAULT_TRANSACTIONS_RETURNED, vaultsUpdated)

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated)
      stores.emitter.removeListener(VAULT_PERFORMANCE_RETURNED, vaultsUpdated)
      stores.emitter.removeListener(VAULT_TRANSACTIONS_RETURNED, vaultsUpdated)
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
    stores.dispatcher.dispatch({ type: GET_VAULT_TRANSACTIONS, content: { address: router.query.address } })
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
                { !vault ? <Skeleton /> : <img src={ vault.icon ? vault.icon : '/tokens/unknown-logo.png' } className={ classes.vaultIcon } alt='' width={ 50 } height={ 50 } /> }
              </div>
            </div>
            <div className={ classes.vaultTitle }>
              <div className={ classes.vaultVersionContainer}>
                <Typography  className={ classes.vaultVersionText }>{ (vault.type === 'v2' && !vault.endorsed) ? 'Experimental' : vault.type } Vault</Typography>
              </div>
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
        <div className={ classes.vaultTransactionsContainer }>
          { account && account.address && <VaultTransactions vault={ vault } /> }
        </div>
      </div>
    </Layout>
  )
}

export default Vault
