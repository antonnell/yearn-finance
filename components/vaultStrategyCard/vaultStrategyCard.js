import { Typography, Paper } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'
import { useRouter } from 'next/router'

import classes from './vaultStrategyCard.module.css'

export default function vaultStrategyCard({ strategy }) {

  return (
    <Paper elevation={0} className={ classes.strategyContainer }>
      <div className={ classes.strategyName }>
        <Typography variant='subtitle1'>Currently Active</Typography>
        <Typography variant='h5' className={ classes.strategyNameText }>{ !strategy ? <Skeleton /> : strategy.name }</Typography>
      </div>
    </Paper>
  )
}
