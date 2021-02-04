import React, { useState, useEffect } from 'react';

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import {
  Typography,
  Paper,
  TextField,
  InputAdornment,
} from '@material-ui/core'
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Skeleton from '@material-ui/lab/Skeleton';
import classes from './invest.module.css'
import VaultAssetRow from '../../components/vaultAssetRow'
import VaultCard from '../../components/vaultCard'
import VaultGrowthNumbers from '../../components/vaultGrowthNumbers'
import VaultSplitGraph from '../../components/vaultSplitGraph'

import BigNumber from 'bignumber.js'

import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import SearchIcon from '@material-ui/icons/Search';
import PieChartIcon from '@material-ui/icons/PieChart';
import AppsIcon from '@material-ui/icons/Apps';
import ListIcon from '@material-ui/icons/List';

import { formatCurrency } from '../../utils'

import stores from '../../stores/index.js'
import { VAULTS_UPDATED } from '../../stores/constants'

function Invest({ changeTheme }) {
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const storeVaults = stores.investStore.getStore('vaults')
  const storePortfolioBalance = stores.investStore.getStore('portfolioBalanceUSD')
  const storePortfolioGrowth = stores.investStore.getStore('portfolioGrowth')
  const storeHighestHoldings = stores.investStore.getStore('highestHoldings')
  const account = stores.accountStore.getStore('account')

  const localStorageCoinTypes = localStorage.getItem('yearn.finance-invest-coin-types')
  const localStoragelayout = localStorage.getItem('yearn.finance-invest-layout')
  const localStorageversions = localStorage.getItem('yearn.finance-invest-versions')


  const [ vaults, setVaults ] = useState(storeVaults)
  const [ porfolioBalance, setPorfolioBalance ] = useState(storePortfolioBalance)
  const [ portfolioGrowth, setPortfolioGrowth ] = useState(storePortfolioGrowth)
  const [ highestHoldings, setHighestHoldings ] = useState(storeHighestHoldings)
  const [ search, setSearch ] = useState('')
  const [ versions, setVersions ] = useState(JSON.parse(localStorageversions ? localStorageversions : '[]'))
  const [ coinTypes, setCoinTypes ] = useState(JSON.parse(localStorageCoinTypes ? localStorageCoinTypes : '[]'))
  const [ layout, setLayout ] = useState(localStoragelayout ? localStoragelayout : 'grid')

  const vaultsUpdated = () => {
    setVaults(stores.investStore.getStore('vaults'))
    setPorfolioBalance(stores.investStore.getStore('portfolioBalanceUSD'))
    setPortfolioGrowth(stores.investStore.getStore('portfolioGrowth'))
    setHighestHoldings(stores.investStore.getStore('highestHoldings'))
    forceUpdate()
  }

  useEffect(function() {

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated)

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated)
    }
  },[]);

  const filteredVaults = vaults.filter((vault) => {

    let returnValue = true

    if(versions && versions.length > 0) {
      if(versions.includes('Active')) {
        const vaultType = (vault.type === 'v2' && !vault.endorsed) ? 'Exp' : vault.type

        returnValue = BigNumber(vault.balance).gt(0) && (versions.length > 1 ? versions.includes(vaultType) : true)
      } else {
        const vaultType = (vault.type === 'v2' && !vault.endorsed) ? 'Exp' : vault.type
        returnValue = versions.includes(vaultType)
      }
    }

    if(returnValue === true && search && search !== '') {
      returnValue = vault.displayName.toLowerCase().includes(search.toLowerCase()) ||
            vault.name.toLowerCase().includes(search.toLowerCase()) ||
            vault.symbol.toLowerCase().includes(search.toLowerCase()) ||
            vault.address.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.displayName.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.name.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.symbol.toLowerCase().includes(search.toLowerCase()) ||
            vault.tokenMetadata.address.toLowerCase().includes(search.toLowerCase())
    }

    return returnValue
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
      const aType = (a.type === 'v2' && !a.endorsed) ? 'Exp' : a.type
      const bType = (b.type === 'v2' && !b.endorsed) ? 'Exp' : b.type
      if(aType > bType) {
        return -1
      } else if(bType > aType) {
        return 1
      } else {
        return 0
      }
    }
  })

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  const handleVersionsChanged = (event, newVals) => {
    setVersions(newVals)
    localStorage.setItem('yearn.finance-invest-versions', newVals && newVals.length ? JSON.stringify(newVals) : '')
  }

  const handeCoinTypesChanged = (event, newVals) => {
    setCoinTypes(newVals)
    localStorage.setItem('yearn.finance-invest-coin-types', newVals && newVals.length ? JSON.stringify(newVals) : '')
  }

  const handleLayoutChanged = (event, newVal) => {
    if(newVal !== null) {
      setLayout(newVal)
      localStorage.setItem('yearn.finance-invest-layout', newVal ? newVal : '')
    }
  }

  const renderVaultHeaders = () => {
    return (
      <div className={ classes.vaultRow} >
        <div className={ classes.vaultTitleCell}><Typography variant='h5'>Name</Typography></div>
        <div className={ classes.vaultVersionCell}><Typography variant='h5'>Version</Typography></div>
        <div className={ classes.vaultBalanceCell}><Typography variant='h5'>Invested Balance</Typography></div>
        <div className={ classes.vaultBalanceCell}><Typography variant='h5'>Available To Deposit</Typography></div>
        <div className={ classes.vaultBalanceCell}><Typography variant='h5'>APY</Typography></div>
      </div>
    )
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
                  { <Typography variant='h1'>{ porfolioBalance === null ? <Skeleton style={{ minWidth: '200px '}} /> : ('$ '+formatCurrency(porfolioBalance)) }</Typography> }
                </div>
              </div>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.growthOutline } >
                  <AttachMoneyIcon className={ classes.growthIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Highest Holdings</Typography>
                  <Typography variant='h6'>{ highestHoldings === null ? <Skeleton style={{ minWidth: '200px '}} /> : (highestHoldings === 'None' ? highestHoldings : highestHoldings.displayName) }</Typography>
                </div>
              </div>
            </div>
            <div className={ classes.spllitContainer }>
              { porfolioBalance === null ? <Skeleton variant='circle' width={ 150 } height={ 150 } style={{ marginLeft: '200px', marginRight:'200px', marginTop: '75px' }} /> : <VaultSplitGraph vaults={ vaults } /> }
            </div>
            <div className={ classes.portfolioBalanceCombined}>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.portfolioOutline } >
                  <TrendingUpIcon className={ classes.portfolioIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Yearly Growth</Typography>
                  <Typography variant='h1'>{ porfolioBalance === null ? <Skeleton style={{ minWidth: '200px '}} /> : ('$ '+formatCurrency(BigNumber(porfolioBalance).times(portfolioGrowth).div(100))) }</Typography>
                </div>
              </div>
              <div className={ classes.portfolioBalanceContainer }>
                <div className={ classes.growthOutline } >
                  <TrendingUpIcon className={ classes.growthIcon } />
                </div>
                <div>
                  <Typography variant='subtitle1' color='textSecondary'>Yearly Growth</Typography>
                  <Typography variant='h6'>{ portfolioGrowth === null ? <Skeleton style={{ minWidth: '100px '}} /> : (formatCurrency(portfolioGrowth)+'%') }</Typography>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className={ classes.vaultsContainer }>
          <div className={ classes.vaultFilters }>
            <ToggleButtonGroup className={ classes.vaultTypeButtons } value={ versions } onChange={ handleVersionsChanged } >
              <ToggleButton className={ `${classes.vaultTypeButton} ${ versions.includes('Lockup') ? classes.lockupSelected : classes.lockup }` } value='Lockup' ><Typography variant='body1'>Lockup</Typography></ToggleButton>
              <ToggleButton className={ `${classes.vaultTypeButton} ${ versions.includes('v2') ? classes.v2Selected : classes.v2 }` } value='v2' ><Typography variant='body1'>V2</Typography></ToggleButton>
              <ToggleButton className={ `${classes.vaultTypeButton} ${ versions.includes('v1') ? classes.v1Selected : classes.v1 }` } value='v1' ><Typography variant='body1'>V1</Typography></ToggleButton>
              <ToggleButton className={ `${classes.vaultTypeButton} ${ versions.includes('Exp') ? classes.expSelected : classes.exp }` } value='Exp' ><Typography variant='body1'>Exp</Typography></ToggleButton>
              <ToggleButton className={ `${classes.vaultTypeButton} ${ versions.includes('Earn') ? classes.earnSelected : classes.earn }` } value='Earn' ><Typography variant='body1'>Earn</Typography></ToggleButton>
              <ToggleButton className={ `${classes.vaultTypeButton} ${ versions.includes('Active') ? classes.activeSelected : classes.active }` } value='Active' ><Typography variant='body1'>Active</Typography></ToggleButton>
            </ToggleButtonGroup>
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
            <ToggleButtonGroup className={ classes.layoutToggleButtons } value={ layout } onChange={ handleLayoutChanged } exclusive >
              <ToggleButton className={ classes.layoutToggleButton } value={ 'grid' }>
                <AppsIcon />
              </ToggleButton>
              <ToggleButton className={ classes.layoutToggleButton } value={ 'list' }>
                <ListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          {
            layout === 'grid' && filteredVaults && filteredVaults.length > 0 && (
              filteredVaults.map((vault, index) => {
                return <VaultCard key={ index } vault={vault} account={ account } />
              })
            )
          }
          { layout === 'list' &&
            <Paper elevation={0} className={ classes.vaultsTable }>
              { renderVaultHeaders() }
              {
                filteredVaults && filteredVaults.length > 0 && (
                  filteredVaults.map((vault, index) => {
                    return <VaultAssetRow key={ index } vault={vault} account={ account } />
                  })
                )
              }
            </Paper>
          }
        </div>
      </div>
    </Layout>
  )
}

/*

<ToggleButtonGroup className={ classes.vaultTypeButtons } value={ coinTypes } onChange={ handeCoinTypesChanged } >
  <ToggleButton className={ `${classes.vaultTypeButton} ${ coinTypes.includes('Stablecoins') ? classes.typeSelected : classes.type }` } value='Stablecoins' >Stable</ToggleButton>
  <ToggleButton className={ `${classes.vaultTypeButton} ${ coinTypes.includes('BTC') ? classes.typeSelected : classes.type }` } value='BTC' >BTC</ToggleButton>
  <ToggleButton className={ `${classes.vaultTypeButton} ${ coinTypes.includes('Eth') ? classes.typeSelected : classes.type }` } value='Eth' >ETH</ToggleButton>
</ToggleButtonGroup>

*/

export default Invest
