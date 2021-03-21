import React, { useState, useEffect } from "react";
import { Typography, Tooltip, Paper } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import { withTheme } from "@material-ui/core/styles";
import BigNumber from "bignumber.js";
import InfoIcon from "@material-ui/icons/Info";

import classes from "./cdpInformation.module.css";

import { formatCurrency } from "../../utils";

function CDPInformation({ cdp, theme }) {
  return (
    <Paper
      elevation={0}
      className={
        theme.palette.type === "dark"
          ? classes.vaultActionContainerDark
          : classes.vaultActionContainer
      }
    >
      <div className={classes.cdpTitleContainer}>
        <img
          src={cdp.tokenMetadata.icon}
          alt=""
          width={30}
          height={30}
          className={classes.cdpIcon}
        />
        <Typography variant="h2">
          {cdp.tokenMetadata.symbol} CDP Vault
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="Initial collateral ratio(ICR) - debt/collateral ratio represents the maximum amount of debt a user can borrow when opening CDP with a selected collateral token. As an example: 40% means for every $1000 collateral value initially a user can borrow $400 USDP.">
          <Typography color="textSecondary">
            Initial Collateral Ratio <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          {formatCurrency(cdp.initialCollateralRatio)}%
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="Liquidation ratio(LR) - debt/collateral ratio represents the limit after which the CDP can be liquidated by anyone. As an example: 50% means that if the debt/collateral ratio will be >50% the position can be triggered for liquidation. LR>ICR to create some safety reserve to avoid fast liquidation.">
          <Typography color="textSecondary">
            Liquidation Ratio <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          {formatCurrency(cdp.liquidationRatio)}%
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="Stability fee - represents the cost of USDP debt per year. It capitalizes during every action, which reduces debt/collateral ratio like withdrawing collateral and borrowing more USDP.">
          <Typography color="textSecondary">
            Stability Fee <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          {formatCurrency(cdp.stabilityFee)}%
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="Liquidation fee - fee in % from the loan, which will be deducted from collateral if liquidation will occur.">
          <Typography color="textSecondary">
            Liquidation Fee <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          {formatCurrency(cdp.liquidationFee)}%
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="USDP available to borrow - the maximum amount of USDP which can be borrowed for selected collateral token.">
          <Typography color="textSecondary">
            Total USDP Available <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          {formatCurrency(cdp.tokenDebtAvailable)} of{" "}
          {formatCurrency(cdp.tokenDebtLimit)}
        </Typography>
      </div>
    </Paper>
  );
}

export default withTheme(CDPInformation);
