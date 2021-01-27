import React, { useState } from 'react';
import { TextField, Typography, InputAdornment, Button } from '@material-ui/core'
import BigNumber from 'bignumber.js'
import { formatCurrency } from '../../utils'

import classes from './vaultActionCard.module.css'

export default function Withdraw({ vault }) {

  const [ amount, setAmount ] = useState('')

  const setAmountPercent = (percent) => {
    setAmount(BigNumber(vault.balance).times(percent).div(100).toFixed(vault.decimals, BigNumber.ROUND_DOWN))
  }

  const onAmountChanged = (event) => {
    setAmount(event.target.value)
  }

  return (
    <div className={ classes.depositContainer }>

      <div className={ classes.textField }>
        <div className={ classes.balances }>
          <Typography variant='h5' onClick={ () => { setAmountPercent(100) } } className={ classes.value } noWrap>Balance: { !vault.balance ? <Skeleton /> : formatCurrency(vault.balance) }</Typography>
        </div>
        <TextField
          value={ amount }
          variant="outlined"
          fullWidth
          placeholder=""
          onChange={ onAmountChanged }
          InputProps={{
            endAdornment: <InputAdornment position="end">
              { vault.displayName }
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
      <div className={ classes.actionButton } >
        <Button
          disableElevation
          variant='contained'
          color='primary'
          size='large'
          >
          <Typography variant='h5'>Withdraw</Typography>
        </Button>
      </div>
    </div>
  )
}
