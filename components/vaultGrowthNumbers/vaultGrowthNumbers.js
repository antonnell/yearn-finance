import { Typography, Grid } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";

import AccountBalanceWalletOutlinedIcon from "@material-ui/icons/AccountBalanceWalletOutlined";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";

import BigNumber from "bignumber.js";

import { formatCurrency } from "../../utils";

import classes from "./vaultGrowthNumbers.module.css";

export default function VaultGrowthNumbers({ vault }) {

  return (
    <div className={classes.extraContainer}>
      <div className={classes.vaultGrowthContainer}>
        <Grid container spacing={2}>
          <Grid item lg={4} md={12} sm={12}>
            <div className={classes.portfolioGrowthContainer}>
              <div className={classes.growthOutline}>
                <AccountBalanceWalletOutlinedIcon className={classes.growthIcon} />
              </div>
              <div>
                <Typography className={classes.mysubtitle} variant="subtitle1" color="textSecondary">
                  Your Balance
                </Typography>
                <Typography variant="h6">
                  {!vault || !vault.balanceInToken ? (
                    <Skeleton style={{ minWidth: "200px " }} />
                  ) : (
                    formatCurrency(vault.balanceInToken) +
                    " " +
                    vault.tokenMetadata.displayName
                  )}
                </Typography>
                <Typography variant="h2" className={classes.balanceUSD}>
                  {!(vault && vault.balance) && <Skeleton />}
                  {vault && vault.balanceUSD && vault.type !== 'Lockup' && '$ ' + formatCurrency(vault.balanceUSD)}
                </Typography>
              </div>
            </div>
          </Grid>
          <Grid item lg={4} md={12} sm={12}>
            {vault.type !== "Lockup" && (
              <div className={classes.portfolioGrowthContainer}>
                <div className={classes.growthOutline}>
                  <TrendingUpIcon className={classes.growthIcon} />
                </div>
                <div>
                  <Typography className={classes.mysubtitle} variant="subtitle1" color="textSecondary">
                    Yearly Growth
                  </Typography>
                  <Typography variant="h6">
                    {!vault ? (
                      <Skeleton />
                    ) : (
                      vault.apy.net_apy === 'New' ? 'New' :
                      BigNumber(vault.apy.net_apy)
                        .times(100)
                        .toFixed(2) + "%"
                    )}
                  </Typography>
                </div>
              </div>
            )}
          </Grid>
          <Grid item lg={4} md={12} sm={12}>
            {vault.type !== "Lockup" && vault.tvl && (
              <div className={classes.portfolioGrowthContainer}>
                <div className={classes.growthOutline}>
                  <TrendingUpIcon className={classes.growthIcon} />
                </div>
                <div>
                  <Typography className={classes.mysubtitle} variant="subtitle1" color="textSecondary">
                    Total Locked in Vault
                  </Typography>
                  <Typography variant="h6">
                    {!vault ? <Skeleton /> : "$ " + formatCurrency(vault.tvl.tvl)}
                  </Typography>
                </div>
              </div>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  );
}
