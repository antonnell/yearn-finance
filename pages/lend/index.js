import React, { useState, useEffect } from 'react';

import {
  Typography,
  Paper,
} from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import classes from './lend.module.css'

import stores from '../../stores/index.js'
import { LEND_UPDATED } from '../../stores/constants'
import { formatCurrency } from '../../utils'

import LendSupplyAssetRow from '../../components/lendSupplyAssetRow'
import LendBorrowAssetRow from '../../components/lendBorrowAssetRow'
import LendAllAssetRow from '../../components/lendAllAssetRow'

function Lend({ changeTheme }) {
  const tvl = null

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const account = stores.accountStore.getStore('account')
  const storeLendingAssets = stores.lendStore.getStore('lendingAssets')
  const storeLendingSupply = stores.lendStore.getStore('lendingSupply')
  const storeLendingBorrow = stores.lendStore.getStore('lendingBorrow')
  const storeLendingBorrowLimit = stores.lendStore.getStore('lendingBorrowLimit')


  const [ lendingAssets, setLendingAssets ] = useState(storeLendingAssets)
  const [ lendingSupply, setLendingSupply ] = useState(storeLendingSupply)
  const [ lendingBorrow, setLendingBorrow ] = useState(storeLendingBorrow)
  const [ lendingBorrowLimit, setLendingBorrowLimit ] = useState(storeLendingBorrowLimit)

  const lendingUpdated = () => {
    setLendingAssets(stores.coverStore.getStore('lendingAssets'))
    setLendingSupply(stores.coverStore.getStore('lendingSupply'))
    setLendingBorrow(stores.coverStore.getStore('lendingBorrow'))
    setLendingBorrowLimit(stores.coverStore.getStore('lendingBorrowLimit'))
    forceUpdate()
  }

  useEffect(function() {
    stores.emitter.on(LEND_UPDATED, lendingUpdated)

    return () => {
      stores.emitter.removeListener(LEND_UPDATED, lendingUpdated)
    }
  },[]);

  const filterSupplied = (a) => {
    return BigNumber(a.supplyBalance).gt(0)
  }

  const filterBorrowed = (a) => {
    return BigNumber(a.borrowBalance).gt(0)
  }

  const sortSupply = (a, b) => {
    if(BigNumber(a.supplyBalance).gt(b.supplyBalance)) {
      return -1
    } else if (BigNumber(a.supplyBalance).lt(b.supplyBalance)) {
      return 1
    } else if (BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
      return -1
    } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
      return 1
    } else {
      return 0
    }
  }

  const sortBorrow = (a, b) => {
    if(BigNumber(a.borrowBalance).gt(b.borrowBalance)) {
      return -1
    } else if (BigNumber(a.borrowBalance).lt(b.borrowBalance)) {
      return 1
    } else if (BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
      return -1
    } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
      return 1
    } else {
      return 0
    }
  }

  const sortAll = (a, b) => {
    if(BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
      return -1
    } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
      return 1
    } else {
      return 0
    }
  }

  const renderSupplyHeaders = () => {
    return (
      <div className={ classes.lendingRow} >
        <div className={ classes.lendTitleCell}><Typography variant='h5'>Name</Typography></div>
        <div className={ classes.lendValueCell}><Typography variant='h5'>Supplied</Typography></div>
        <div className={ classes.lendBalanceCell}><Typography variant='h5'>Balance</Typography></div>
        <div className={ classes.lendValueCell}><Typography variant='h5'>APY</Typography></div>
      </div>
    )
  }

  const renderBorrowHeaders = () => {
    return (
      <div className={ classes.lendingRow} >
        <div className={ classes.lendTitleCell}><Typography variant='h5'>Name</Typography></div>
        <div className={ classes.lendValueCell}><Typography variant='h5'>Borrowed</Typography></div>
        <div className={ classes.lendBalanceCell}><Typography variant='h5'>Balance</Typography></div>
        <div className={ classes.lendValueCell}><Typography variant='h5'>APY</Typography></div>
      </div>
    )
  }

  const renderAllHeaders = () => {
    return (
      <div className={ classes.lendingRow} >
        <div className={ classes.lendTitleCell}><Typography variant='h5'>Name</Typography></div>
        <div className={ classes.lendBalanceCell}><Typography variant='h5'>Balance</Typography></div>
        <div className={ classes.lendValueCell}><Typography variant='h5'>Borrow APY</Typography></div>
        <div className={ classes.lendValueCell}><Typography variant='h5'>Supply APY</Typography></div>
      </div>
    )
  }

  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Lend</title>
      </Head>
      <div className={ classes.lendingOverviewContainer }>
        <Paper elevation={0} className={ classes.overviewCard }>
          <Typography variant='h2'  color='textSecondary'>Total Supplied</Typography>
          <Typography variant='h1'>{ !lendingSupply ? <Skeleton /> : `$ ${formatCurrency(lendingSupply)}` }</Typography>
        </Paper>
        <Paper elevation={0} className={ classes.overviewCard }>
          <Typography variant='h2'  color='textSecondary'>Total Borrowed</Typography>
          <Typography variant='h1'>{ !lendingBorrow ? <Skeleton /> : `$ ${formatCurrency(lendingBorrow)}` }</Typography>
        </Paper>
        <Paper elevation={0} className={ classes.overviewCard }>
          <Typography variant='h2'  color='textSecondary'>Borrow Limit Used</Typography>
          <Typography variant='h1'>{ !lendingBorrowLimit ? <Skeleton /> : `${formatCurrency(lendingBorrowLimit > 0 ? lendingBorrow*100/lendingBorrowLimit : 0)} %` }</Typography>
        </Paper>
      </div>
      <div className={ classes.lendingContainer }>
        <Typography variant='h6' className={ classes.tableHeader }>Supplied Assets</Typography>
        <Paper elevation={0} className={ classes.lendingTable }>
          { renderSupplyHeaders() }
          {
            lendingAssets && lendingAssets.filter(filterSupplied).sort(sortSupply).map((asset) => {
              return (
                <LendSupplyAssetRow key={ asset.address } lendingAsset={ asset } lendingBorrow={ lendingBorrow } lendingSupply={ lendingSupply } lendingBorrowLimit={ lendingBorrowLimit } />
              )
            })
          }
        </Paper>
        <Typography variant='h6' className={ classes.tableHeader }>Borrowed Assets</Typography>
        <Paper elevation={0} className={ classes.lendingTable }>
          { renderBorrowHeaders() }
          {
            lendingAssets && lendingAssets.filter(filterBorrowed).sort(sortBorrow).map((asset) => {
              return (
                <LendBorrowAssetRow key={ asset.address } lendingAsset={ asset } lendingBorrow={ lendingBorrow } lendingSupply={ lendingSupply } lendingBorrowLimit={ lendingBorrowLimit } />
              )
            })
          }
        </Paper>
        <Typography variant='h6' className={ classes.tableHeader }>All Assets</Typography>
        <Paper elevation={0} className={ classes.lendingTable }>
          { renderAllHeaders() }
          {
            lendingAssets && lendingAssets.sort(sortAll).map((asset) => {
              return (
                <LendAllAssetRow key={ asset.address } lendingAsset={ asset } lendingBorrow={ lendingBorrow } lendingSupply={ lendingSupply } lendingBorrowLimit={ lendingBorrowLimit } />
              )
            })
          }
        </Paper>
      </div>
    </Layout>
  )
}

export default Lend
