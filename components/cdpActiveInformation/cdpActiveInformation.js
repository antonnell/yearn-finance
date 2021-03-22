import React, { useState, useEffect } from "react";
import { Typography, Tooltip, Paper } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import { withTheme } from "@material-ui/core/styles";
import BigNumber from "bignumber.js";
import InfoIcon from "@material-ui/icons/Info";

import classes from "./cdpActiveInformation.module.css";

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
          Your {cdp.tokenMetadata.symbol} CDP Vault
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="The current price of the asset as provided by the Oracle.">
          <Typography color="textSecondary">
            Supplied <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          $ {formatCurrency(cdp.collateralDolar, 2)}
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="The current price of the asset as provided by the Oracle.">
          <Typography color="textSecondary">
            Borrowed <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          $ {formatCurrency(cdp.debt, 2)}
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="The current price of the asset as provided by the Oracle.">
          <Typography color="textSecondary">
            Oracle Price <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          $ {formatCurrency(cdp.dolarPrice, 4)}
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="Below the collateral price the position can be liquidated.">
          <Typography color="textSecondary">
            Liquidation Price <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography variant="h5" className={classes.valueLineHeight}>
          $ {formatCurrency(cdp.liquidationPrice, 4)}
        </Typography>
      </div>
      <div className={classes.cdpInformationContainer}>
        <Tooltip title="Utilization - % of borrowed USDP compare to maximum USDP which is possible to borrow for the CDP..">
          <Typography color="textSecondary">
            Utilization Ratio <InfoIcon className={classes.infoIcon} />
          </Typography>
        </Tooltip>
        <Typography
          variant="h5"
          className={`${classes.valueLineHeight} ${
            cdp.status === "Liquidatable"
              ? classes.statusLiquid
              : ["Dangerous", "Moderate"].includes(cdp.status)
              ? classes.statusWarning
              : classes.statusSafe
          }`}
        >
          {formatCurrency(cdp.utilizationRatio)}%
        </Typography>
      </div>
    </Paper>
  );
}

export default withTheme(CDPInformation);
