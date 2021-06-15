import React, { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  InputAdornment,
  Button,
  CircularProgress
} from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";

import classes from "./cdpRepayAndWithdraw.module.css";

import { formatCurrency } from "../../utils";

import {
  ERROR,
  WITHDRAW_REPAY_CDP,
  WITHDRAW_REPAY_CDP_RETURNED,
  APPROVE_CDP,
  APPROVE_CDP_RETURNED
} from "../../stores/constants";
import stores from "../../stores";

export default function CDPRepayAndWithdraw({ cdp, borrowAsset }) {
  const [repayAmount, setRepayAmount] = useState("");
  const [repayAmountError, setRepayAmountError] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(function() {
    const withdrawAndRepayReturned = () => {
      setLoading(false);
    };

    const approveReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    stores.emitter.on(WITHDRAW_REPAY_CDP_RETURNED, withdrawAndRepayReturned);
    stores.emitter.on(APPROVE_CDP_RETURNED, approveReturned);
    stores.emitter.on(ERROR, errorReturned);

    return () => {
      stores.emitter.removeListener(
        WITHDRAW_REPAY_CDP_RETURNED,
        withdrawAndRepayReturned
      );
      stores.emitter.removeListener(APPROVE_CDP_RETURNED, approveReturned);
      stores.emitter.removeListener(ERROR, errorReturned);
    };
  }, []);

  const onRepayAmountChanged = event => {
    setRepayAmountError(false);
    setRepayAmount(event.target.value);
  };

  const onWithdrawAmountChanged = event => {
    setWithdrawAmountError(false);
    setWithdrawAmount(event.target.value);
  };

  const onRepay = () => {
    setRepayAmountError(false);
    setWithdrawAmountError(false);

    setLoading(true);
    stores.dispatcher.dispatch({
      type: WITHDRAW_REPAY_CDP,
      content: {
        cdp: cdp,
        withdrawAmount: withdrawAmount,
        repayAmount: repayAmount
      }
    });
  };

  const onApprove = () => {
    setLoading(true);
    let sendAsset = borrowAsset;
    sendAsset.tokenMetadata = borrowAsset;
    stores.dispatcher.dispatch({
      type: APPROVE_CDP,
      content: { asset: sendAsset, amount: repayAmount }
    });
  };

  const onApproveMax = () => {
    setLoading(true);
    let sendAsset = borrowAsset;
    sendAsset.tokenMetadata = borrowAsset;
    stores.dispatcher.dispatch({
      type: APPROVE_CDP,
      content: { asset: sendAsset, amount: "max" }
    });
  };

  const setRepayAmountPercent = percent => {
    if (loading) {
      return;
    }
    const amount = BigNumber(
      BigNumber(borrowAsset.balance).gt(cdp.debt)
        ? cdp.debt
        : borrowAsset.balance
    )
      .times(percent)
      .div(100)
      .toFixed(borrowAsset.decimals);
    setRepayAmount(amount);
  };

  const setWithdrawAmountPercent = percent => {
    if (loading) {
      return;
    }

    let repayUSDPAvailable = repayAmount && repayAmount > 0 ? repayAmount : 0;
    repayUSDPAvailable = BigNumber(repayUSDPAvailable)
      .times(1 / cdp.dolarPrice)
      .times(100)
      .div(cdp.liquidationRatio)
      .toNumber();

    let amount = BigNumber(
      BigNumber(cdp.collateral)
        .plus(repayUSDPAvailable)
        .minus(
          BigNumber(cdp.collateral)
            .times(cdp.utilizationRatio)
            .div(100)
        )
    )
      .times(percent)
      .div(100)
      .toFixed(cdp.tokenMetadata.decimals);

    if (amount > cdp.collateral) {
      amount = cdp.collateral;
    }

    setWithdrawAmount(amount);
  };

  return (
    <div className={classes.vaultActionContainer}>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Repay USDP
            </Typography>
          </div>
          <div className={classes.balances}>
            <Typography
              variant="h5"
              onClick={() => {
                setRepayAmountPercent(100);
              }}
              className={classes.value}
              noWrap
            >
              Balance:{" "}
              {!borrowAsset.balance && borrowAsset.balance !== 0 ? (
                <Skeleton />
              ) : (
                formatCurrency(borrowAsset.balance)
              )}
            </Typography>
          </div>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={repayAmount}
          error={repayAmountError}
          onChange={onRepayAmountChanged}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {borrowAsset.displayName}
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <img src={borrowAsset.icon} alt="" width={30} height={30} />
              </InputAdornment>
            )
          }}
        />
      </div>
      <Typography variant="h5" align="center" className={classes.betweenSpacer}>
        AND/OR
      </Typography>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Withdraw Collateral
            </Typography>
          </div>
          <div className={classes.balances}>
            <Typography
              variant="h5"
              onClick={() => {
                setWithdrawAmountPercent(100);
              }}
              className={classes.value}
              noWrap
            >
              Balance:{" "}
              {!cdp.collateral && cdp.collateral !== 0 ? (
                <Skeleton />
              ) : (
                formatCurrency(cdp.collateral)
              )}
            </Typography>
          </div>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={withdrawAmount}
          error={withdrawAmountError}
          onChange={onWithdrawAmountChanged}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {cdp.tokenMetadata.displayName}
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <img
                  src={cdp.tokenMetadata.icon}
                  alt=""
                  width={30}
                  height={30}
                />
              </InputAdornment>
            )
          }}
        />
      </div>
      <div className={classes.sliderPlaceholder}></div>
      <div className={classes.actionButton}>
        {(repayAmount === "" ||
          BigNumber(borrowAsset.allowance).gte(repayAmount)) && (
          <Button
            fullWidth
            disableElevation
            variant="contained"
            color="primary"
            size="large"
            onClick={onRepay}
            disabled={loading}
          >
            <Typography variant="h5">
              {loading ? <CircularProgress size={15} /> : "Repay AND Withdraw"}
            </Typography>
          </Button>
        )}
        {repayAmount !== "" &&
          BigNumber(repayAmount).gt(0) &&
          (!borrowAsset.allowance ||
            BigNumber(borrowAsset.allowance).eq(0) ||
            BigNumber(borrowAsset.allowance).lt(repayAmount)) && (
            <React.Fragment>
              <Button
                fullWidth
                disableElevation
                variant="contained"
                color="primary"
                size="large"
                onClick={onApprove}
                disabled={loading}
                className={classes.marginRight}
              >
                <Typography variant="h5">
                  {loading ? <CircularProgress size={15} /> : "Approve Exact"}
                </Typography>
              </Button>
              <Button
                fullWidth
                disableElevation
                variant="contained"
                color="primary"
                size="large"
                onClick={onApproveMax}
                disabled={loading}
                className={classes.marginLeft}
              >
                <Typography variant="h5">
                  {loading ? <CircularProgress size={15} /> : "Approve Max"}
                </Typography>
              </Button>
            </React.Fragment>
          )}
      </div>
    </div>
  );
}
