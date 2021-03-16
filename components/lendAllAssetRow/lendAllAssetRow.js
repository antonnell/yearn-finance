import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  TextField,
  Paper,
  CircularProgress,
  Grid,
  InputAdornment
} from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles';
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'
import { formatCurrency } from '../../utils'
import GasSpeed from '../gasSpeed'

import stores from '../../stores/index.js'
import {
  ERROR,
  APPROVE_LEND,
  APPROVE_LEND_RETURNED,
  BORROW_LEND,
  BORROW_LEND_RETURNED,
  DEPOSIT_LEND,
  DEPOSIT_LEND_RETURNED,
  ENABLE_COLLATERAL_LEND,
  ENABLE_COLLATERAL_LEND_RETURNED,
  DISABLE_COLLATERAL_LEND,
  DISABLE_COLLATERAL_LEND_RETURNED,
  CONNECT_WALLET
} from '../../stores/constants'


import classes from './lendAllAssetRow.module.css'

const AntSwitch = withStyles((theme) => ({
  root: {
    width: 28,
    height: 16,
    padding: 0,
    display: 'flex',
  },
  switchBase: {
    padding: 2,
    color: theme.palette.grey[500],
    '&$checked': {
      transform: 'translateX(12px)',
      color: theme.palette.common.white,
      '& + $track': {
        opacity: 1,
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main,
      },
    },
  },
  thumb: {
    width: 12,
    height: 12,
    boxShadow: 'none',
  },
  track: {
    border: `1px solid ${theme.palette.grey[500]}`,
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.common.white,
  },
  checked: {},
}))(Switch);


function LendAllAssetRowDetails({ lendingAsset, account, lendingBorrow, lendingSupply, lendingBorrowLimit }) {

  const [ loading, setLoading ] = useState(false)
  const [ supplyAmount, setSupplyAmount ] = useState('')
  const [ supplyAmountError, setSupplyAmountError ] = useState(false)
  const [ borrowAmount, setBorrowAmount ] = useState('')
  const [ borrowAmountError, setBorrowAmountError ] = useState(false)
  const [ gasSpeed, setGasSpeed ] = useState('')

  const setSpeed = (speed) => {
    setGasSpeed(speed)
  }

  useEffect(() => {
    const stopLoading = () => {
      setLoading(false)
    }

    stores.emitter.on(ERROR, stopLoading)

    return () => {
      stores.emitter.removeListener(ERROR, stopLoading)
    }
  }, [])

  const supplyReturned = () => {
    stores.emitter.removeListener(LENDING_SUPPLY_RETURNED, supplyReturned);
    setLoading(false)
    setSupplyAmount('')
  };

  const borrowReturned = () => {
    stores.emitter.removeListener(LENDING_BORROW_RETURNED, borrowReturned);
    setLoading(false)
    setBorrowAmount('')
  };

  const approveReturned = () => {
    stores.emitter.removeListener(APPROVE_LEND_RETURNED, approveReturned);
    setLoading(false)
  };

  const changeCollateralReturned = () => {
    stores.emitter.removeListener(ENABLE_COLLATERAL_LEND_RETURNED, changeCollateralReturned);
    stores.emitter.removeListener(DISABLE_COLLATERAL_LEND_RETURNED, changeCollateralReturned);
    setLoading(false)
  };


  const handleCollateralChange = (event, newValue) => {
    setLoading(true)
    if(newValue === true) {
      stores.emitter.on(ENABLE_COLLATERAL_LEND_RETURNED, changeCollateralReturned)
      stores.dispatcher.dispatch({ type: ENABLE_COLLATERAL_LEND, content: { lendingAsset: lendingAsset, gasSpeed: gasSpeed } })
    } else {
      stores.emitter.on(DISABLE_COLLATERAL_LEND_RETURNED, changeCollateralReturned)
      stores.dispatcher.dispatch({ type: DISABLE_COLLATERAL_LEND, content: { lendingAsset: lendingAsset, gasSpeed: gasSpeed } })
    }
  }

  const onSupplyAmountChange = (event) => {
    setSupplyAmount(event.target.value)
  }

  const onBorrowAmountChanged = (event) => {
    setBorrowAmount(event.target.value)
  }

  const onSupply = () => {
    setSupplyAmountError(false)

    if(!supplyAmount || isNaN(supplyAmount) || supplyAmount <= 0) {
      setSupplyAmountError(true)
      return false
    }

    setLoading(true)

    stores.emitter.on(DEPOSIT_LEND_RETURNED, supplyReturned);
    stores.dispatcher.dispatch({ type: DEPOSIT_LEND, content: { amount: supplyAmount, lendingAsset: lendingAsset, gasSpeed: gasSpeed } })
  }

  const onBorrow = () => {
    setBorrowAmountError(false)

    if(!borrowAmount || isNaN(borrowAmount) || borrowAmount <= 0) {
      setBorrowAmountError(true)
      return false
    }

    setLoading(true)

    stores.emitter.on(BORROW_LEND_RETURNED, borrowReturned);
    stores.dispatcher.dispatch({ type: BORROW_LEND, content: { amount: borrowAmount, lendingAsset: lendingAsset, gasSpeed: gasSpeed } })
  }

  const onApprove = () => {
    setLoading(true)
    stores.emitter.on(APPROVE_LEND_RETURNED, approveReturned);
    stores.dispatcher.dispatch({ type: APPROVE_LEND, content: { lendingAsset: lendingAsset, amount: supplyAmount, gasSpeed: gasSpeed } })
  }

  const onApproveMax = () => {
    setLoading(true)
    stores.emitter.on(APPROVE_LEND_RETURNED, approveReturned);
    stores.dispatcher.dispatch({ type: APPROVE_LEND, content: { lendingAsset: lendingAsset, amount: 'max', gasSpeed: gasSpeed } })
  }

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET)
  }

  const setSupplyAmountPercent = (percent) => {
    if(loading) {
      return
    }

    const amount = BigNumber(lendingAsset.tokenMetadata.balance).times(percent).div(100).toFixed(lendingAsset.tokenMetadata.decimals)

    setSupplyAmount(amount)
  }

  const setBorrowAmountPercent = (percent) => {
    if(loading) {
      return
    }

    const amount = BigNumber(lendingAsset.supplyBalance).times(percent).div(100).toFixed(lendingAsset.tokenMetadata.decimals)

    setBorrowAmount(amount)
  }

  let theLimitUsed = (lendingBorrow)*100/lendingBorrowLimit || 0

  if(lendingAsset.collateralEnabled) {
    if(supplyAmount && supplyAmount !== '' && lendingBorrowLimit !== 0) {
      theLimitUsed = lendingBorrow*100/(lendingBorrowLimit+(supplyAmount*lendingAsset.price*lendingAsset.collateralPercent/100))
    }
  }

  if(borrowAmount && borrowAmount !== '') {
    theLimitUsed = (lendingBorrow+(borrowAmount*lendingAsset.price))*100/lendingBorrowLimit
  }

  return (
    <Paper elevation={ 0 } square className={ classes.assetActions }>
      <div className={ BigNumber(theLimitUsed).gt(100) ? classes.assetInfoError : classes.assetInfo }>
        <div className={ classes.infoField }>
          <Typography variant={ 'h5' } color='textSecondary'>Borrow limit:</Typography>
          <div className={ classes.flexy }>
            <Typography variant={ 'h6' } noWrap>$ { formatCurrency(lendingBorrowLimit) }</Typography>
          </div>
        </div>
        <div className={ classes.infoField }>
          <Typography variant={ 'h5' } color='textSecondary'>Borrow limit used:</Typography>
          <div className={ classes.flexy }>
            <Typography variant={ 'h6' } noWrap>{ formatCurrency(theLimitUsed) }%</Typography>
          </div>
        </div>
        <div>
          <Typography variant={ 'h5' } color='textSecondary'>Collateral:</Typography>
          <Typography component="div" variant='h6'>
            <Grid component="label" container alignItems="center" spacing={1}>
              <Grid item>Off</Grid>
              <Grid item>
                <AntSwitch checked={ lendingAsset.collateralEnabled } onChange={ handleCollateralChange } />
              </Grid>
              <Grid item>On</Grid>
            </Grid>
          </Typography>
        </div>
      </div>
      <div className={ classes.actionsContainer }>
        <div className={ classes.tradeContainer }>
          <div className={ classes.inputTitleContainer }>
            <div className={ classes.inputTitle }>
              <Typography variant='h5' noWrap>Supply</Typography>
            </div>
            <div className={ classes.balances }>
              <Typography variant='h5' onClick={ () => { setSupplyAmountPercent(100) } } className={ classes.value } noWrap>{ 'Wallet: '+ formatCurrency(lendingAsset.tokenMetadata.balance) } { lendingAsset.tokenMetadata.symbol }</Typography>
            </div>
          </div>
          <TextField
            fullWidth
            className={ classes.actionInput }
            value={ supplyAmount }
            error={ supplyAmountError }
            onChange={ onSupplyAmountChange }
            disabled={ loading }
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">
                { lendingAsset.tokenMetadata.displayName }
              </InputAdornment>,
              startAdornment: <InputAdornment position="start">
                <img src={ lendingAsset.tokenMetadata.icon } alt='' width={ 30 } height={ 30 } />
              </InputAdornment>,
            }}
          />
          <div className={ classes.scaleContainer }>
            <Button
              className={ classes.scale }
              variant='outlined'
              disabled={ loading }
              color="primary"
              onClick={ () => { setSupplyAmountPercent(25) } }>
              <Typography variant={'h5'}>25%</Typography>
            </Button>
            <Button
              className={ classes.scale }
              variant='outlined'
              disabled={ loading }
              color="primary"
              onClick={ () => { setSupplyAmountPercent(50) } }>
              <Typography variant={'h5'}>50%</Typography>
            </Button>
            <Button
              className={ classes.scale }
              variant='outlined'
              disabled={ loading }
              color="primary"
              onClick={ () => { setSupplyAmountPercent(75) } }>
              <Typography variant={'h5'}>75%</Typography>
            </Button>
            <Button
              className={ classes.scale }
              variant='outlined'
              disabled={ loading }
              color="primary"
              onClick={ () => { setSupplyAmountPercent(100) } }>
              <Typography variant={'h5'}>100%</Typography>
            </Button>
          </div>
          <div className={ classes.gasSpeedContainer }>
            <GasSpeed setParentSpeed={ setSpeed } />
          </div>
          <div className={ classes.buttons }>
            { (supplyAmount !=='' && BigNumber(supplyAmount).gt(0) && (!lendingAsset.tokenMetadata.allowance || BigNumber(lendingAsset.tokenMetadata.allowance).eq(0) || BigNumber(lendingAsset.tokenMetadata.allowance).lt(supplyAmount))) && (
              <React.Fragment>
                <Button
                  fullWidth
                  disableElevation
                  variant='contained'
                  color='primary'
                  size='large'
                  onClick={ onApprove }
                  disabled={ loading }
                  className={ classes.marginRight }
                  >
                  <Typography variant='h5'>{ loading ? <CircularProgress size={25} /> : 'Approve Exact' }</Typography>
                </Button>
                <Button
                  fullWidth
                  disableElevation
                  variant='contained'
                  color='primary'
                  size='large'
                  onClick={ onApproveMax }
                  disabled={ loading }
                  className={ classes.marginLeft }
                  >
                  <Typography variant='h5'>{ loading ? <CircularProgress size={25} /> : 'Approve Max' }</Typography>
                </Button>
              </React.Fragment>
            )}
            { (supplyAmount === '' || BigNumber(lendingAsset.tokenMetadata.allowance).gte(supplyAmount)) && (
              <Button
                fullWidth
                disableElevation
                variant='contained'
                color='primary'
                size='large'
                disabled={ loading || !supplyAmount || isNaN(supplyAmount) || BigNumber(lendingAsset.tokenMetadata.balance).eq(0) || BigNumber(supplyAmount).gt(BigNumber(lendingAsset.tokenMetadata.balance)) }
                onClick={ onSupply }
                >
                { loading && <CircularProgress size={20} /> }
                { !loading && <Typography className={ classes.buttonText } variant={ 'h5'}>
                  { BigNumber(lendingAsset.tokenMetadata.balance).eq(0) && 'No Balance to Supply' }
                  { BigNumber(lendingAsset.tokenMetadata.balance).gt(0) && supplyAmount && BigNumber(supplyAmount).gt(BigNumber(lendingAsset.tokenMetadata.balance)) && 'Insufficient Balance' }
                  { BigNumber(lendingAsset.tokenMetadata.balance).gt(0) && (!supplyAmount || BigNumber(supplyAmount).lte(BigNumber(lendingAsset.tokenMetadata.balance))) && 'Supply' }
                </Typography> }
              </Button>
            )}
          </div>
        </div>
        <div className={ classes.separator }></div>
        <div className={classes.tradeContainer}>
          <div className={ classes.inputTitleContainer }>
            <div className={ classes.inputTitle }>
              <Typography variant='h5' noWrap>Borrow</Typography>
            </div>
            <div className={ classes.balances }>
              <Typography variant='h5' onClick={ () => {  } } className={ classes.value } noWrap>{ '~' }</Typography>
            </div>
          </div>
          <TextField
            fullWidth
            className={ classes.actionInput }
            value={ borrowAmount }
            error={ borrowAmountError }
            onChange={ onBorrowAmountChanged }
            disabled={ loading }
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">
                { lendingAsset.tokenMetadata.displayName }
              </InputAdornment>,
              startAdornment: <InputAdornment position="start">
                <img src={ lendingAsset.tokenMetadata.icon } alt='' width={ 30 } height={ 30 } />
              </InputAdornment>,
            }}
          />
          <div className={ classes.scaleContainer }>
            <div className={ classes.emptyScale }></div>
          </div>
          <div className={ classes.gasSpeedContainer }>
            <GasSpeed setParentSpeed={ setSpeed } />
          </div>
          <div className={ classes.buttons }>
            <Button
              fullWidth
              disableElevation
              variant='contained'
              color='primary'
              size='large'
              disabled={ loading || BigNumber(theLimitUsed).gt(100) || !borrowAmount || BigNumber(lendingBorrowLimit).eq(0) }
              onClick={ onBorrow }
              >
              { loading && <CircularProgress size={20} /> }
              { !loading && <Typography className={ classes.buttonText } variant={ 'h5'}>
                { (BigNumber(theLimitUsed).gt(100) || BigNumber(lendingBorrowLimit).eq(0)) && 'Insufficient collateral' }
                { (BigNumber(theLimitUsed).lte(100) && BigNumber(lendingBorrowLimit).gt(0)) && 'Borrow' }
              </Typography> }
            </Button>
          </div>
        </div>
      </div>
    </Paper>
  )
}

export default function LendAllAssetRow({ lendingAsset, account, lendingBorrow, lendingSupply, lendingBorrowLimit }) {

  const [ expanded, setExpanded ] = useState(false)

  const handleExpand = () => {
    setExpanded(!expanded)
  }

  return (
    <Accordion className={ classes.removePaper } elevation={0} square expanded={ expanded } onChange={ () => { handleExpand() } }>
      <AccordionSummary  elevation={0} className={ classes.lendingRow }>
        <div className={ classes.lendTitleCell }>
          <div className={ classes.logo }>
            <img src={ lendingAsset.tokenMetadata.icon ? lendingAsset.tokenMetadata.icon : '/tokens/unknown-logo.png' } alt='' width={ 30 } height={ 30 } />
          </div>
          <div className={ classes.name}>
            <Typography variant='h5' className={ classes.fontWeightBold }>{ lendingAsset.tokenMetadata.displayName }</Typography>
          </div>
        </div>
        <div className={ classes.lendBalanceCell}>
          <Typography variant='h5' className={ classes.balance } noWrap>{ formatCurrency(lendingAsset.tokenMetadata.balance) } { lendingAsset.tokenMetadata.symbol }</Typography>
        </div>
        <div className={ classes.lendValueCell}>
            <Typography variant='h5'>{ formatCurrency(lendingAsset.borrowAPY) } %</Typography>
        </div>
        <div className={ classes.lendValueCell}>
            <Typography variant='h5'>{ formatCurrency(lendingAsset.supplyAPY) } %</Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <LendAllAssetRowDetails lendingAsset={ lendingAsset } lendingBorrow={ lendingBorrow } lendingSupply={ lendingSupply } lendingBorrowLimit={ lendingBorrowLimit } />
      </AccordionDetails>
    </Accordion>
  )
}
