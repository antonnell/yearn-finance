import { Typography, Paper } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';

import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';

import BigNumber from 'bignumber.js';

import { formatCurrency } from '../../utils';

import classes from './ycdpOverview.module.css';

export default function ycdpOverview() {
  return (
    <Paper elevation={0} className={classes.ycdpOverviewContainer}>
      <div className={classes.ycdpOverviewField}>
        <div className={classes.growthOutline}>
          <AccountBalanceWalletOutlinedIcon className={classes.growthIcon} />
        </div>
        <div>
          <Typography className={classes.mysubtitle} variant='h2'>
            Collateral Provided
          </Typography>
          <Typography variant="h1" className={ classes.headAmount }>${formatCurrency(1230)}</Typography>
        </div>
      </div>
      <div className={classes.ycdpOverviewField}>
        <div className={classes.growthOutline}>
          <TrendingUpIcon className={classes.growthIcon} />
        </div>
        <div>
          <Typography className={classes.mysubtitle} variant='h2'>
            Debt Minted
          </Typography>
          <Typography variant="h1" className={ classes.headAmount }>${formatCurrency(1230)}</Typography>
        </div>
      </div>
      <div className={classes.ycdpOverviewField}>
        <div className={classes.growthOutline}>
          <TrendingUpIcon className={classes.growthIcon} />
        </div>
        <div>
          <Typography className={classes.mysubtitle} variant='h2'>
            Available to Borrow
          </Typography>
          <Typography variant="h1" className={ classes.headAmount }>${formatCurrency(1230)}</Typography>
        </div>
      </div>
    </Paper>
  );
}
