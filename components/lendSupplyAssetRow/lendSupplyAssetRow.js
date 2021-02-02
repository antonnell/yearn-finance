import { Typography, Paper, Button } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'
import { formatCurrency } from '../../utils'

import classes from './lendSupplyAssetRow.module.css'

export default function LendSupplyAssetRow({ lendingAsset, account }) {

  return (
    <div className={ classes.lendingRow }>
      <div className={ classes.lendTitleCell }>
        <div className={ classes.logo }>
          <img src={ lendingAsset.tokenMetadata.icon ? lendingAsset.tokenMetadata.icon : '/tokens/unknown-logo.png' } alt='' width={ 30 } height={ 30 } />
        </div>
        <div className={ classes.name}>
          <Typography variant='h5' className={ classes.fontWeightBold }>{ lendingAsset.tokenMetadata.displayName }</Typography>
        </div>
      </div>
      <div className={ classes.lendValueCell}>
        <Typography variant='h5' className={ classes.balance } noWrap>{ formatCurrency(lendingAsset.supplyBalance) } { lendingAsset.tokenMetadata.symbol }</Typography>
      </div>
      <div className={ classes.lendBalanceCell}>
        <Typography variant='h5' className={ classes.balance } noWrap>{ formatCurrency(lendingAsset.tokenMetadata.balance) } { lendingAsset.tokenMetadata.symbol }</Typography>
      </div>
      <div className={ classes.lendValueCell}>
          <Typography variant='h5'>{ formatCurrency(lendingAsset.supplyAPY) } %</Typography>
      </div>
      <div className={ classes.lendActionsCell}>
        <Button
          size='small'
          variant='outlined'>
          Supply
        </Button>
        <Button
          size='small'
          variant='outlined'>
          Withdraw
        </Button>
      </div>
    </div>
  )
}
