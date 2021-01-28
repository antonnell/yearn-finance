import React, { useState, useEffect } from 'react';

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import {
  Typography,
  Paper,
  TextField,
  InputAdornment,
} from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import classes from './invest.module.css'
import VaultCard from '../../components/vaultCard'
import VaultGrowthNumbers from '../../components/vaultGrowthNumbers'
import VaultSplitGraph from '../../components/vaultSplitGraph'
import VaultPerformanceGraph from '../../components/vaultPerformanceGraph'

import BigNumber from 'bignumber.js'

import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import SearchIcon from '@material-ui/icons/Search';
import PieChartIcon from '@material-ui/icons/PieChart';

import { formatCurrency } from '../../utils'

import stores from '../../stores/index.js'
import { VAULTS_UPDATED } from '../../stores/constants'

function Invest({ changeTheme }) {

  const storeVaults = stores.investStore.getStore('vaults')
  const storePortfolioBalance = stores.investStore.getStore('portfolioBalanceUSD')
  const storePortfolioGrowth = stores.investStore.getStore('portfolioGrowth')
  const storeHighestHoldings = stores.investStore.getStore('highestHoldings')
  const account = stores.accountStore.getStore('account')

  const [ vaults, setVaults ] = useState(storeVaults)
  const [ porfolioBalance, setPorfolioBalance ] = useState(storePortfolioBalance)
  const [ porfolioGrowth, setPorfolioGrowth ] = useState(storePortfolioGrowth)
  const [ highestHoldings, setHighestHoldings ] = useState(storeHighestHoldings)
  const [ search, setSearch ] = useState('')

  const vaultsUpdated = () => {
    setVaults(stores.investStore.getStore('vaults'))
    setPorfolioBalance(stores.investStore.getStore('portfolioBalanceUSD'))
    setPorfolioGrowth(stores.investStore.getStore('portfolioGrowth'))
    setHighestHoldings(stores.investStore.getStore('highestHoldings'))
  }

  useEffect(function() {
    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated)

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated)
    }
  },[]);

  const filteredVaults = vaults.filter((vault) => {
    if(search && search !== '') {
      return vault.displayName.toLowerCase().includes(search.toLowerCase()) ||
            vault.name.toLowerCase().includes(search.toLowerCase()) ||
            vault.symbol.toLowerCase().includes(search.toLowerCase()) ||
            vault.address.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.displayName.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.name.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.symbol.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.address.toLowerCase().includes(search.toLowerCase())
    } else {
      return true
    }
  }).sort((a, b) => {
    if(BigNumber(a.balance).gt(BigNumber(b.balance))) {
      return -1
    } else if (BigNumber(a.balance).lt(BigNumber(b.balance))) {
      return 1
    } else if(BigNumber(a.tokenMetadata.balance).gt(BigNumber(b.tokenMetadata.balance))) {
      return -1
    } else if (BigNumber(a.tokenMetadata.balance).lt(BigNumber(b.tokenMetadata.balance))) {
      return 1
    } else {
      return 0
    }
  })

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Invest</title>
      </Head>
      <div className={ classes.investContainer }>

        { account && account.address && (
          <div className={ classes.portfolioStatsContainer }>
            <div className={ classes.portfolioBalanceCombined}>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.portfolioOutline } >
                  <AccountBalanceWalletOutlinedIcon className={ classes.portfolioIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Portfolio Balance</Typography>
                  <Typography variant='h1'>{ (!porfolioBalance || porfolioBalance === '') ? <Skeleton /> : '$ '+formatCurrency(porfolioBalance) }</Typography>
                </div>
              </div>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.growthOutline } >
                  <AttachMoneyIcon className={ classes.growthIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Highest Holdings</Typography>
                  <Typography variant='h6'>{ highestHoldings.displayName }</Typography>
                </div>
              </div>
            </div>
            <div className={ classes.spllitContainer }>
              <VaultSplitGraph vaults={ vaults } />
            </div>
            <div className={ classes.portfolioBalanceCombined}>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.portfolioOutline } >
                  <TrendingUpIcon className={ classes.portfolioIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Yearly Growth</Typography>
                  <Typography variant='h1'>{ (!porfolioBalance || porfolioBalance === '') ? <Skeleton /> : '$ '+formatCurrency(BigNumber(porfolioBalance).times(porfolioGrowth).div(100)) }</Typography>
                </div>
              </div>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.growthOutline } >
                  <TrendingUpIcon className={ classes.growthIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Yearly Growth</Typography>
                  <Typography variant='h6'>{ (!porfolioGrowth || porfolioGrowth === '') ? <Skeleton /> : formatCurrency(porfolioGrowth)+'%' }</Typography>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className={ classes.vaultsContainer }>
          <Typography variant='h5' className={ classes.vaultSectionTitle }>Find Investment Opportunities</Typography>
          <TextField
            className={ classes.searchContainer }
            variant="outlined"
            fullWidth
            placeholder="ETH, CRV, ..."
            value={ search }
            onChange={ onSearchChanged }
            InputProps={{
              startAdornment: <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>,
            }}
          />
          {
            filteredVaults && filteredVaults.length > 0 && (
              filteredVaults.map((vault, index) => {
                return <VaultCard key={ index } vault={vault} account={ account } />
              })
            )
          }
        </div>
      </div>
    </Layout>
  )
}

export default Invest
