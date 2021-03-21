import { Typography, Paper } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';

import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';

import BigNumber from 'bignumber.js'

import { formatCurrency } from '../../utils'

import classes from './vaultGrowthNumbers.module.css'

export default function VaultGrowthNumbers({ vault }) {

  return (
    <div className={ classes.extraContainer }>
      <div className={ classes.vaultGrowthContainer }>
        <div className={ classes.portfolioGrowthContainer }>
          <div className={ classes.growthOutline } >
            <AccountBalanceWalletOutlinedIcon className={ classes.growthIcon } />
          </div>
          <div>
            <Typography variant='subtitle1' color='textSecondary'>Your Balance</Typography>
            <Typography variant='h6'>{ (!vault || !vault.balanceInToken) ? <Skeleton style={{ minWidth: '200px '}} /> : ( formatCurrency(vault.balanceInToken)+' '+vault.tokenMetadata.displayName ) }</Typography>
          </div>
        </div>
        { vault.type !== 'Lockup' && (
          <div className={ classes.portfolioGrowthContainer }>
            <div className={ classes.growthOutline } >
              <TrendingUpIcon className={ classes.growthIcon } />
            </div>
            <div>
              <Typography variant='subtitle1' color='textSecondary'>Yearly Growth</Typography>
              <Typography variant='h6'>{ !vault ? <Skeleton /> : BigNumber(vault.apy.recommended).times(100).toFixed(2)+'%' }</Typography>
            </div>
          </div>
        )}
        { vault.type !== 'Lockup' && vault.tvl && (
          <div className={ classes.portfolioGrowthContainer }>
            <div className={ classes.growthOutline } >
              <TrendingUpIcon className={ classes.growthIcon } />
            </div>
            <div>
              <Typography variant='subtitle1' color='textSecondary'>Total Locked in Vault</Typography>
              <Typography variant='h6'>{ !vault ? <Skeleton /> : '$ '+formatCurrency(vault.tvl.value) }</Typography>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
