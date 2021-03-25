import { Typography, Paper, Button } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";
import { useRouter } from "next/router";
import * as moment from "moment";
import React, { useState, useEffect } from "react";

import { formatCurrency } from "../../utils";
import ReportProblemOutlinedIcon from "@material-ui/icons/ReportProblemOutlined";
import GasSpeed from "../gasSpeed";

import classes from "./vaultLockupNotice.module.css";

import stores from "../../stores";
import {
  CONNECT_WALLET,
  ERROR,
  CLAIM_VAULT,
  CLAIM_VAULT_RETURNED
} from "../../stores/constants";

export default function VaultLockupNotice({ vault, account }) {
  const [loading, setLoading] = useState(false);
  const [gasSpeed, setGasSpeed] = useState("");

  const onClaim = () => {
    setLoading(true);
    stores.dispatcher.dispatch({
      type: CLAIM_VAULT,
      content: { vault: vault, gasSpeed: gasSpeed }
    });
  };

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  const setSpeed = speed => {
    setGasSpeed(speed);
  };

  useEffect(() => {
    const claimReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(CLAIM_VAULT_RETURNED, claimReturned);

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(CLAIM_VAULT_RETURNED, claimReturned);
    };
  });

  return (
    <div className={classes.noticeContainer}>
      <ReportProblemOutlinedIcon className={classes.warningIcon} />
      <div className={classes.textContainer}>
        <div className={classes.head}>
          <ReportProblemOutlinedIcon className={classes.warningMobile} />
          <Typography variant="h6" className={classes.warning}>
            Warning
          </Typography>
        </div>
        <div className={classes.notice}>
          <Typography className={classes.paragraph}>
            This vault accepts CRV in exchange for perpetual claim on Curve DAO
            admin fees across all Yearn products.
          </Typography>
          <Typography className={classes.paragraph}>
            Since it locks CRV in Curve Voting Escrow for 4 years and regularly
            prolongs the lock, this vault doesn't have withdrawal functionality.
          </Typography>
          <Typography className={classes.paragraph} variant="h5">
            You will NOT get your CRV back. Ever.
          </Typography>
        </div>
        <div>
          {account && account.address && (
            <div className={classes.vaultInfoField}>
              <Typography variant="subtitle1" color="textSecondary">
                Vault vs Solo
              </Typography>
              <Typography variant="h6">
                {!(vault && vault.lockupMetadata) ? (
                  <Skeleton style={{ minWidth: "100px " }} />
                ) : (
                  BigNumber(vault.lockupMetadata.vaultVsSolo).toFixed(3) + "x"
                )}
              </Typography>
            </div>
          )}
          {account && account.address && (
            <div className={classes.vaultInfoField}>
              <Typography variant="subtitle1" color="textSecondary">
                Claimable
              </Typography>
              <Typography variant="h6">
                {!(vault && vault.lockupMetadata) ? (
                  <Skeleton style={{ minWidth: "100px " }} />
                ) : (
                  `${formatCurrency(vault.lockupMetadata.claimable)} ${
                    vault.tokenMetadata.symbol
                  }`
                )}
              </Typography>
            </div>
          )}

          {(!account || !account.address) && (
            <div className={classes.actionButton}>
              <Button
                fullWidth
                disableElevation
                variant="contained"
                color="primary"
                size="large"
                onClick={onConnectWallet}
                disabled={loading}
              >
                <Typography variant="h5">Connect Wallet</Typography>
              </Button>
            </div>
          )}
          {account && account.address && (
            <Paper elevation={2} className={classes.claimActionContainer}>
              <GasSpeed setParentSpeed={setSpeed} />
              <div className={classes.actionButton}>
                <Button
                  fullWidth
                  disableElevation
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onClaim}
                  disabled={loading}
                >
                  <Typography variant="h5">Claim</Typography>
                </Button>
              </div>
            </Paper>
          )}
        </div>
      </div>
    </div>
  );
}
