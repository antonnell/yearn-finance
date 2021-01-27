import React, { useState, useEffect } from 'react';
import { TextField, Typography, InputAdornment, Button, CircularProgress } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from '../../utils'
import GasSpeed from '../gasSpeed'

import classes from './vaultActionCard.module.css'

import stores from '../../stores'
import {
  WITHDRAW_VAULT,
  WITHDRAW_VAULT_RETURNED,
} from '../../stores/constants'

export default function Withdraw({ vault }) {

  const [ loading, setLoading ] = useState(false)
  const [ amount, setAmount ] = useState('')
  const [ gasSpeed, setGasSpeed ] = useState('')

  const setAmountPercent = (percent) => {
    setAmount(BigNumber(vault.balance).times(percent).div(100).toFixed(vault.decimals, BigNumber.ROUND_DOWN))
  }

  const onAmountChanged = (event) => {
    setAmount(event.target.value)
  }

  const onWithdraw = () => {
    setLoading(true)
    stores.dispatcher.dispatch({ type: WITHDRAW_VAULT, content: { vault: vault, amount: amount, gasSpeed: gasSpeed } })
  }

  const onApprove = () => {
    setLoading(true)
    stores.dispatcher.dispatch({ type: APPROVE_VAULT, content: { vault: vault, amount: amount, gasSpeed: gasSpeed } })
  }

  const setSpeed = (speed) => {
    setGasSpeed(speed)
  }

  useEffect(() => {
    const withdrawReturned = () => {
      setLoading(false)
    }


    stores.emitter.on(WITHDRAW_VAULT_RETURNED, withdrawReturned)

    return () => {
      stores.emitter.removeListener(WITHDRAW_VAULT_RETURNED, withdrawReturned)
    }
  })

  return (
    <div className={ classes.depositContainer }>

      <div className={ classes.textField }>
        <div className={ classes.balances }>
          <Typography variant='h5' onClick={ () => { setAmountPercent(100) } } className={ classes.value } noWrap>Balance: { !vault.balance ? <Skeleton /> : formatCurrency(vault.balance) }</Typography>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={ amount }
          onChange={ onAmountChanged }
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { vault.tokenMetadata.displayName }
            </InputAdornment>,
          }}
        />
      </div>
      <div className={ classes.scaleContainer }>
        <Button
          className={ classes.scale }
          variant='outlined'
          color="primary"
          onClick={ () => { setAmountPercent(25) } }>
          <Typography variant={'h5'}>25%</Typography>
        </Button>
        <Button
          className={ classes.scale }
          variant='outlined'
          color="primary"
          onClick={ () => { setAmountPercent(50) } }>
          <Typography variant={'h5'}>50%</Typography>
        </Button>
        <Button
          className={ classes.scale }
          variant='outlined'
          color="primary"
          onClick={ () => { setAmountPercent(75) } }>
          <Typography variant={'h5'}>75%</Typography>
        </Button>
        <Button
          className={ classes.scale }
          variant='outlined'
          color="primary"
          onClick={ () => { setAmountPercent(100) } }>
          <Typography variant={'h5'}>100%</Typography>
        </Button>
      </div>
      <div >
        <GasSpeed setParentSpeed={ setSpeed } />
      </div>
      <div className={ classes.actionButton } >
        <Button
          fullWidth
          disableElevation
          variant='contained'
          color='primary'
          size='large'
          onClick={ onWithdraw }
          disabled={ loading }
          >
          <Typography variant='h5'>{ loading ? <CircularProgress size={30} /> : 'Withdraw' }</Typography>
        </Button>
      </div>
    </div>
  )
}
