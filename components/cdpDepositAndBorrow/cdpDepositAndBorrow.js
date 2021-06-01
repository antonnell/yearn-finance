import React, { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Slider,
  CircularProgress
} from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";

import classes from "./cdpDepositAndBorrow.module.css";

import { formatCurrency } from "../../utils";

import {
  DEPOSIT_BORROW_CDP,
  DEPOSIT_BORROW_CDP_RETURNED,
  APPROVE_CDP,
  APPROVE_CDP_RETURNED,
  ERROR
} from "../../stores/constants";
import stores from "../../stores";

export default function CDPDepositAndBorrow({ cdp, borrowAsset }) {
  const marks = [
    {
      value: 0,
      label: "0%"
    },
    {
      value: 50,
      label: "50%"
    },
    {
      value: 100,
      label: "100%"
    }
  ];

  const [depositAmount, setDepositAmount] = useState("");
  const [depositAmountError, setDepositAmountError] = useState(false);

  const [borrowAmountPerc, setBorrowAmountPerc] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState("");
  const [borrowAmountError, setBorrowAmountError] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(function() {
    const depositBorrowReturned = () => {
      setLoading(false);
    };

    const approveReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    stores.emitter.on(DEPOSIT_BORROW_CDP_RETURNED, depositBorrowReturned);
    stores.emitter.on(APPROVE_CDP_RETURNED, approveReturned);
    stores.emitter.on(ERROR, errorReturned);

    return () => {
      stores.emitter.removeListener(
        DEPOSIT_BORROW_CDP_RETURNED,
        depositBorrowReturned
      );
      stores.emitter.removeListener(APPROVE_CDP_RETURNED, approveReturned);
      stores.emitter.removeListener(ERROR, errorReturned);
    };
  }, []);

  const onDepositAmountChanged = event => {
    setDepositAmountError(false);
    setDepositAmount(event.target.value);

    handleSliderChange(null, borrowAmountPerc, event.target.value);
  };

  const onBorrowAmountChanged = event => {
    setBorrowAmountError(false);
    setBorrowAmount(event.target.value);

    let depositUSDPAvailable =
      depositAmount && depositAmount > 0 ? depositAmount : 0;
    depositUSDPAvailable = BigNumber(depositUSDPAvailable)
      .times(cdp.dolarPrice)
      .times(cdp.initialCollateralRatio)
      .div(100)
      .toNumber();
    const debtAvailable = BigNumber(cdp.maxUSDPAvailable)
      .plus(depositUSDPAvailable)
      .minus(cdp.debt)
      .toNumber();

    let borrowAmountPercentage = BigNumber(event.target.value)
      .times(100)
      .div(debtAvailable);
    setBorrowAmountPerc(borrowAmountPercentage);
  };

  const onDeposit = () => {
    setDepositAmountError(false);
    setBorrowAmountError(false);

    setLoading(true);
    stores.dispatcher.dispatch({
      type: DEPOSIT_BORROW_CDP,
      content: {
        cdp: cdp,
        depositAmount: depositAmount,
        borrowAmount: borrowAmount
      }
    });
  };

  const onApprove = () => {
    if (
      !depositAmount ||
      isNaN(depositAmount) ||
      depositAmount <= 0 ||
      BigNumber(depositAmount).gt(cdp.tokenMetadata.balance)
    ) {
      setDepositAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_CDP,
      content: { asset: cdp, amount: depositAmount }
    });
  };

  const onApproveMax = () => {
    if (
      !depositAmount ||
      isNaN(depositAmount) ||
      depositAmount <= 0 ||
      BigNumber(depositAmount).gt(cdp.tokenMetadata.balance)
    ) {
      setDepositAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_CDP,
      content: { asset: cdp, amount: "max" }
    });
  };

  const setDepositAmountPercent = percent => {
    if (loading) {
      return;
    }
    const amount = BigNumber(cdp.tokenMetadata.balance)
      .times(percent)
      .div(100)
      .toFixed(cdp.tokenMetadata.decimals);
    setDepositAmount(amount);

    handleSliderChange(null, borrowAmountPerc, amount);
  };

  const handleSliderChange = (event, percent, deposittedAmount) => {
    if (loading) {
      return;
    }
    setBorrowAmountPerc(percent);

    let dep = depositAmount;
    if (deposittedAmount) {
      dep = deposittedAmount;
    }

    let depositUSDPAvailable = dep && dep > 0 ? dep : 0;
    depositUSDPAvailable = BigNumber(depositUSDPAvailable)
      .times(cdp.dolarPrice)
      .times(cdp.initialCollateralRatio)
      .div(100)
      .toNumber();

    const amount = BigNumber(
      BigNumber(cdp.maxUSDPAvailable)
        .plus(depositUSDPAvailable)
        .minus(cdp.debt)
        .toNumber()
    )
      .times(percent)
      .div(100)
      .toFixed(cdp.tokenMetadata.decimals);
    setBorrowAmount(amount);
  };

  return (
    <div className={classes.vaultActionContainer}>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Supply Collateral
            </Typography>
          </div>
          <div className={classes.balances}>
            <Typography
              variant="h5"
              onClick={() => {
                setDepositAmountPercent(100);
              }}
              className={classes.value}
              noWrap
            >
              Balance:{" "}
              {!cdp.tokenMetadata.balance && cdp.tokenMetadata.balance !== 0 ? (
                <Skeleton />
              ) : (
                formatCurrency(cdp.tokenMetadata.balance)
              )}
            </Typography>
          </div>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={depositAmount}
          error={depositAmountError}
          onChange={onDepositAmountChanged}
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
      <Typography variant="h5" align="center" className={classes.betweenSpacer}>
        AND/OR
      </Typography>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Borrow USDP
            </Typography>
          </div>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={borrowAmount}
          error={borrowAmountError}
          onChange={onBorrowAmountChanged}
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
      <div className={classes.textField}>
        <Grid container spacing={2} className={classes.sliderContainer}>
          <Grid item className={classes.sliderItem}>
            <Typography variant="h5">Safer</Typography>
          </Grid>
          <Grid item xs className={classes.sliderItem}>
            <Slider
              value={borrowAmountPerc}
              onChange={handleSliderChange}
              aria-labelledby="continuous-slider"
              marks={marks}
            />
          </Grid>
          <Grid item className={classes.sliderItem}>
            <Typography variant="h5">Riskier</Typography>
          </Grid>
        </Grid>
      </div>
      <div className={classes.actionButton}>
        {(depositAmount === "" ||
          BigNumber(cdp.tokenMetadata.allowance).gte(depositAmount)) && (
          <Button
            fullWidth
            disableElevation
            variant="contained"
            color="primary"
            size="large"
            onClick={onDeposit}
            disabled={loading}
          >
            <Typography variant="h5">
              {loading ? (
                <CircularProgress size={25} />
              ) : BigNumber(cdp.collateral).gt(0) ? (
                "Supply And Borrow"
              ) : (
                "Open CDP"
              )}
            </Typography>
          </Button>
        )}
        {depositAmount !== "" &&
          BigNumber(depositAmount).gt(0) &&
          (!cdp.tokenMetadata.allowance ||
            BigNumber(cdp.tokenMetadata.allowance).eq(0) ||
            BigNumber(cdp.tokenMetadata.allowance).lt(depositAmount)) && (
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
                  {loading ? <CircularProgress size={25} /> : "Approve Exact"}
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
                  {loading ? <CircularProgress size={25} /> : "Approve Max"}
                </Typography>
              </Button>
            </React.Fragment>
          )}
      </div>
    </div>
  );
}
