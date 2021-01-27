import { Typography, Paper } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import BigNumber from 'bignumber.js'

import { formatCurrency } from '../../utils'

import classes from './vaultGrowthNumbers.module.css'

export default function VaultGrowthNumbers({ vault }) {

  return (
    <div className={ classes.vaultGrowthContainer }>
      <div className={ classes.portfolioGrowthContainer }>
        <div className={ classes.growthOutline } >
          <TrendingUpIcon className={ classes.growthIcon } />
        </div>
        <div>
          <Typography variant='subtitle1' color='textSecondary'>Holdings</Typography>
          <Typography variant='h6'>{ !vault ? <Skeleton /> : ( formatCurrency(vault.balance)+' '+vault.displayName ) }</Typography>
        </div>
      </div>
      <div className={ classes.portfolioGrowthContainer }>
        <div className={ classes.growthOutline } >
          <TrendingUpIcon className={ classes.growthIcon } />
        </div>
        <div>
          <Typography variant='subtitle1' color='textSecondary'>Yearly Growth</Typography>
          <Typography variant='h6'>{ !vault ? <Skeleton /> : BigNumber(vault.apy.oneMonthSample).times(100).toFixed(2)+'%' }</Typography>
        </div>
      </div>
    </div>
  )
}
