import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  TextField,
  Paper,
  CircularProgress,
  Grid,
  InputAdornment
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import BigNumber from "bignumber.js";
import { formatCurrency } from "../../utils";
import GasSpeed from "../gasSpeed";

import stores from "../../stores/index.js";
import {
  ERROR,
  APPROVE_LEND,
  APPROVE_LEND_RETURNED,
  WITHDRAW_LEND,
  WITHDRAW_LEND_RETURNED,
  DEPOSIT_LEND,
  DEPOSIT_LEND_RETURNED,
  ENABLE_COLLATERAL_LEND,
  ENABLE_COLLATERAL_LEND_RETURNED,
  DISABLE_COLLATERAL_LEND,
  DISABLE_COLLATERAL_LEND_RETURNED,
} from "../../stores/constants";

import classes from "./lendSupplyAssetRow.module.css";

const AntSwitch = withStyles(theme => ({
  root: {
    width: 28,
    height: 16,
    padding: 0,
    display: "flex"
  },
  switchBase: {
    padding: 2,
    color: theme.palette.grey[500],
    "&$checked": {
      transform: "translateX(12px)",
      color: theme.palette.common.white,
      "& + $track": {
        opacity: 1,
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.main
      }
    }
  },
  thumb: {
    width: 12,
    height: 12,
    boxShadow: "none"
  },
  track: {
    border: `1px solid ${theme.palette.grey[500]}`,
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.common.white
  },
  checked: {}
}))(Switch);

function LendSupplyAssetDetails({
  lendingAsset,
  lendingBorrow,
  lendingBorrowLimit
}) {
  const [loading, setLoading] = useState(false);
  const [supplyAmount, setSupplyAmount] = useState("");
  const [supplyAmountError, setSupplyAmountError] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState(false);
  const [gasSpeed, setGasSpeed] = useState("");

  const setSpeed = speed => {
    setGasSpeed(speed);
  };

  useEffect(() => {
    const stopLoading = () => {
      setLoading(false);
    };

    stores.emitter.on(ERROR, stopLoading);

    return () => {
      stores.emitter.removeListener(ERROR, stopLoading);
    };
  }, []);

  const supplyReturned = () => {
    stores.emitter.removeListener(DEPOSIT_LEND_RETURNED, supplyReturned);
    setLoading(false);
    setSupplyAmount("");
  };

  const withdrawReturned = () => {
    stores.emitter.removeListener(WITHDRAW_LEND_RETURNED, withdrawReturned);
    setLoading(false);
    setWithdrawAmount("");
  };

  const approveReturned = () => {
    stores.emitter.removeListener(APPROVE_LEND_RETURNED, approveReturned);
    setLoading(false);
  };

  const changeCollateralReturned = () => {
    stores.emitter.removeListener(
      ENABLE_COLLATERAL_LEND_RETURNED,
      changeCollateralReturned
    );
    stores.emitter.removeListener(
      DISABLE_COLLATERAL_LEND_RETURNED,
      changeCollateralReturned
    );
    setLoading(false);
  };

  const handleCollateralChange = (event, newValue) => {
    setLoading(true);
    if (newValue === true) {
      stores.emitter.on(
        ENABLE_COLLATERAL_LEND_RETURNED,
        changeCollateralReturned
      );
      stores.dispatcher.dispatch({
        type: ENABLE_COLLATERAL_LEND,
        content: { lendingAsset: lendingAsset, gasSpeed: gasSpeed }
      });
    } else {
      stores.emitter.on(
        DISABLE_COLLATERAL_LEND_RETURNED,
        changeCollateralReturned
      );
      stores.dispatcher.dispatch({
        type: DISABLE_COLLATERAL_LEND,
        content: { lendingAsset: lendingAsset, gasSpeed: gasSpeed }
      });
    }
  };

  const onSupplyAmountChange = event => {
    setSupplyAmount(event.target.value);
  };

  const onWithdrawAmountChanged = event => {
    setWithdrawAmount(event.target.value);
  };

  const onSupply = () => {
    setSupplyAmountError(false);

    if (!supplyAmount || isNaN(supplyAmount) || supplyAmount <= 0) {
      setSupplyAmountError(true);
      return false;
    }

    setLoading(true);

    stores.emitter.on(DEPOSIT_LEND_RETURNED, supplyReturned);
    stores.dispatcher.dispatch({
      type: DEPOSIT_LEND,
      content: {
        amount: supplyAmount,
        lendingAsset: lendingAsset,
        gasSpeed: gasSpeed
      }
    });
  };

  const onWithdraw = () => {
    setWithdrawAmountError(false);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setWithdrawAmountError(true);
      return false;
    }

    setLoading(true);

    stores.emitter.on(WITHDRAW_LEND_RETURNED, withdrawReturned);
    stores.dispatcher.dispatch({
      type: WITHDRAW_LEND,
      content: {
        amount: withdrawAmount,
        lendingAsset: lendingAsset,
        gasSpeed: gasSpeed
      }
    });
  };

  const onApprove = () => {
    setLoading(true);
    stores.emitter.on(APPROVE_LEND_RETURNED, approveReturned);
    stores.dispatcher.dispatch({
      type: APPROVE_LEND,
      content: {
        lendingAsset: lendingAsset,
        amount: supplyAmount,
        gasSpeed: gasSpeed
      }
    });
  };

  const onApproveMax = () => {
    setLoading(true);
    stores.emitter.on(APPROVE_LEND_RETURNED, approveReturned);
    stores.dispatcher.dispatch({
      type: APPROVE_LEND,
      content: { lendingAsset: lendingAsset, amount: "max", gasSpeed: gasSpeed }
    });
  };

  const setSupplyAmountPercent = percent => {
    if (loading) {
      return;
    }

    const amount = BigNumber(lendingAsset.tokenMetadata.balance)
      .times(percent)
      .div(100)
      .toFixed(lendingAsset.tokenMetadata.decimals);

    setSupplyAmount(amount);
  };

  const setWithdrawAmountPercent = percent => {
    if (loading) {
      return;
    }

    const amount = BigNumber(lendingAsset.supplyBalance)
      .times(percent)
      .div(100)
      .toFixed(lendingAsset.tokenMetadata.decimals);

    setWithdrawAmount(amount);
  };

  let theLimitUsed = (lendingBorrow * 100) / lendingBorrowLimit || 0;

  if (lendingAsset.collateralEnabled) {
    if (supplyAmount && supplyAmount !== "" && lendingBorrowLimit !== 0) {
      theLimitUsed =
        (lendingBorrow * 100) /
        (lendingBorrowLimit +
          (supplyAmount * lendingAsset.price * lendingAsset.collateralPercent) /
            100);
    }
    if (withdrawAmount && withdrawAmount !== "") {
      const wa =
        (withdrawAmount * lendingAsset.price * lendingAsset.collateralPercent) /
        100;
      if (BigNumber(wa).gt(lendingBorrowLimit)) {
        theLimitUsed = "infinite";
      } else {
        theLimitUsed = (lendingBorrow * 100) / (lendingBorrowLimit - wa);
      }
    }
  }

  return (
    <Paper elevation={0} square className={classes.assetActions}>
      <div
        className={
          theLimitUsed === "infinite" || BigNumber(theLimitUsed).gt(100)
            ? classes.assetInfoError
            : classes.assetInfo
        }
      >
        <div className={classes.infoField}>
          <Typography variant={"h5"} color="textSecondary">
            Borrow limit:
          </Typography>
          <div className={classes.flexy}>
            <Typography variant={"h6"} noWrap>
              $ {formatCurrency(lendingBorrowLimit)}
            </Typography>
          </div>
        </div>
        <div className={classes.infoField}>
          <Typography variant={"h5"} color="textSecondary">
            Borrow limit used:
          </Typography>
          <div className={classes.flexy}>
            <Typography variant={"h6"} noWrap>
              {theLimitUsed !== "infinite"
                ? `${formatCurrency(theLimitUsed)} %`
                : theLimitUsed}
            </Typography>
          </div>
        </div>
        <div>
          <Typography variant={"h5"} color="textSecondary">
            Collateral:
          </Typography>
          <Typography component="div" variant="h6">
            <Grid component="label" container alignItems="center" spacing={1}>
              <Grid item>Off</Grid>
              <Grid item>
                <AntSwitch
                  checked={lendingAsset.collateralEnabled}
                  onChange={handleCollateralChange}
                />
              </Grid>
              <Grid item>On</Grid>
            </Grid>
          </Typography>
        </div>
      </div>
      <div className={classes.actionsContainer}>
        <div className={classes.tradeContainer}>
          <div className={classes.inputTitleContainer}>
            <div className={classes.inputTitle}>
              <Typography variant="h5" noWrap>
                Supply
              </Typography>
            </div>
            <div className={classes.balances}>
              <Typography
                variant="h5"
                onClick={() => {
                  setSupplyAmountPercent(100);
                }}
                className={classes.value}
                noWrap
              >
                {"Wallet: " +
                  formatCurrency(lendingAsset.tokenMetadata.balance)}{" "}
                {lendingAsset.tokenMetadata.symbol}
              </Typography>
            </div>
          </div>
          <TextField
            fullWidth
            className={classes.actionInput}
            id="supplyAmount"
            value={supplyAmount}
            error={supplyAmountError}
            onChange={onSupplyAmountChange}
            disabled={loading}
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {lendingAsset.tokenMetadata.displayName}
                </InputAdornment>
              ),
              startAdornment: (
                <InputAdornment position="start">
                  <img
                    src={lendingAsset.tokenMetadata.icon}
                    alt=""
                    width={30}
                    height={30}
                  />
                </InputAdornment>
              )
            }}
          />
          <div className={classes.scaleContainer}>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setSupplyAmountPercent(25);
              }}
            >
              <Typography variant={"h5"}>25%</Typography>
            </Button>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setSupplyAmountPercent(50);
              }}
            >
              <Typography variant={"h5"}>50%</Typography>
            </Button>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setSupplyAmountPercent(75);
              }}
            >
              <Typography variant={"h5"}>75%</Typography>
            </Button>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setSupplyAmountPercent(100);
              }}
            >
              <Typography variant={"h5"}>100%</Typography>
            </Button>
          </div>
          <div className={classes.gasSpeedContainer}>
            <GasSpeed setParentSpeed={setSpeed} />
          </div>
          <div className={classes.buttons}>
            {supplyAmount !== "" &&
              BigNumber(supplyAmount).gt(0) &&
              (!lendingAsset.tokenMetadata.allowance ||
                BigNumber(lendingAsset.tokenMetadata.allowance).eq(0) ||
                BigNumber(lendingAsset.tokenMetadata.allowance).lt(
                  supplyAmount
                )) && (
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
                      {loading ? (
                        <CircularProgress size={15} />
                      ) : (
                        "Approve Exact"
                      )}
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
            {(supplyAmount === "" ||
              BigNumber(lendingAsset.tokenMetadata.allowance).gte(
                supplyAmount
              )) && (
              <Button
                fullWidth
                disableElevation
                variant="contained"
                color="primary"
                size="large"
                disabled={
                  loading ||
                  !supplyAmount ||
                  isNaN(supplyAmount) ||
                  BigNumber(lendingAsset.tokenMetadata.balance).eq(0) ||
                  BigNumber(supplyAmount).gt(
                    BigNumber(lendingAsset.tokenMetadata.balance)
                  )
                }
                onClick={onSupply}
              >
                {loading && <CircularProgress size={20} />}
                {!loading && (
                  <Typography className={classes.buttonText} variant={"h5"}>
                    {BigNumber(lendingAsset.tokenMetadata.balance).eq(0) &&
                      "No Balance to Supply"}
                    {BigNumber(lendingAsset.tokenMetadata.balance).gt(0) &&
                      supplyAmount &&
                      BigNumber(supplyAmount).gt(
                        BigNumber(lendingAsset.tokenMetadata.balance)
                      ) &&
                      "Insufficient Balance"}
                    {BigNumber(lendingAsset.tokenMetadata.balance).gt(0) &&
                      (!supplyAmount ||
                        BigNumber(supplyAmount).lte(
                          BigNumber(lendingAsset.tokenMetadata.balance)
                        )) &&
                      "Supply"}
                  </Typography>
                )}
              </Button>
            )}
          </div>
        </div>
        <div className={classes.separator}></div>
        <div className={classes.tradeContainer}>
          <div className={classes.inputTitleContainer}>
            <div className={classes.inputTitle}>
              <Typography variant="h5" noWrap>
                Withdraw
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
                {"Protocol: " + formatCurrency(lendingAsset.supplyBalance)}{" "}
                {lendingAsset.tokenMetadata.symbol}
              </Typography>
            </div>
          </div>
          <TextField
            fullWidth
            className={classes.actionInput}
            id="withdrawAmount"
            value={withdrawAmount}
            error={withdrawAmountError}
            onChange={onWithdrawAmountChanged}
            disabled={loading}
            placeholder="0.00"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {lendingAsset.tokenMetadata.displayName}
                </InputAdornment>
              ),
              startAdornment: (
                <InputAdornment position="start">
                  <img
                    src={lendingAsset.tokenMetadata.icon}
                    alt=""
                    width={30}
                    height={30}
                  />
                </InputAdornment>
              )
            }}
          />
          <div className={classes.scaleContainer}>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setWithdrawAmountPercent(25);
              }}
            >
              <Typography variant={"h5"}>25%</Typography>
            </Button>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setWithdrawAmountPercent(50);
              }}
            >
              <Typography variant={"h5"}>50%</Typography>
            </Button>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setWithdrawAmountPercent(75);
              }}
            >
              <Typography variant={"h5"}>75%</Typography>
            </Button>
            <Button
              className={classes.scale}
              variant="outlined"
              disabled={loading}
              color="primary"
              onClick={() => {
                setWithdrawAmountPercent(100);
              }}
            >
              <Typography variant={"h5"}>100%</Typography>
            </Button>
          </div>
          <div className={classes.gasSpeedContainer}>
            <GasSpeed setParentSpeed={setSpeed} />
          </div>
          <div className={classes.buttons}>
            <Button
              fullWidth
              disableElevation
              variant="contained"
              color="primary"
              size="large"
              disabled={
                loading ||
                !withdrawAmount ||
                isNaN(withdrawAmount) ||
                BigNumber(withdrawAmount).eq(0) ||
                BigNumber(lendingAsset.supplyBalance).eq(0) ||
                BigNumber(withdrawAmount).gt(lendingAsset.supplyBalance)
              }
              onClick={onWithdraw}
            >
              {loading && <CircularProgress size={20} />}
              {!loading && (
                <Typography className={classes.buttonText} variant={"h5"}>
                  {BigNumber(lendingAsset.supplyBalance).eq(0) ||
                    (BigNumber(withdrawAmount).eq(0) &&
                      "No Balance to Withdraw")}
                  {BigNumber(lendingAsset.supplyBalance).gt(0) &&
                    BigNumber(withdrawAmount).gt(
                      BigNumber(lendingAsset.supplyBalance)
                    ) &&
                    "Insufficient Balance"}
                  {BigNumber(lendingAsset.supplyBalance).gt(0) &&
                    (!withdrawAmount ||
                      BigNumber(withdrawAmount).lte(
                        BigNumber(lendingAsset.supplyBalance)
                      )) &&
                    "Withdraw"}
                </Typography>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Paper>
  );
}

export default function LendSupplyAssetRow({
  lendingAsset,
  lendingBorrow,
  lendingBorrowLimit
}) {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Accordion
      className={classes.removePaper}
      elevation={0}
      square
      expanded={expanded}
      onChange={() => {
        handleExpand();
      }}
    >
      <AccordionSummary elevation={0} className={classes.lendingRow}>
        <div className={classes.lendTitleCell}>
          <div className={classes.logo}>
            <img
              src={
                lendingAsset.tokenMetadata.icon
                  ? lendingAsset.tokenMetadata.icon
                  : "/tokens/unknown-logo.png"
              }
              alt=""
              width={30}
              height={30}
            />
          </div>
          <div className={classes.name}>
            <Typography variant="h5" className={classes.fontWeightBold}>
              {lendingAsset.tokenMetadata.displayName}
            </Typography>
          </div>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5" className={classes.balance} noWrap>
            {formatCurrency(lendingAsset.supplyBalance)}{" "}
            {lendingAsset.tokenMetadata.symbol}
          </Typography>
        </div>
        <div className={classes.lendBalanceCell}>
          <Typography variant="h5" className={classes.balance} noWrap>
            {formatCurrency(lendingAsset.tokenMetadata.balance)}{" "}
            {lendingAsset.tokenMetadata.symbol}
          </Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">
            {formatCurrency(lendingAsset.supplyAPY)} %
          </Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">
            { lendingAsset.collateralPercent } %
          </Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">
            {formatCurrency(lendingAsset.liquidity)}{" "}
            {lendingAsset.tokenMetadata.symbol}
          </Typography>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <LendSupplyAssetDetails
          lendingAsset={lendingAsset}
          lendingBorrow={lendingBorrow}
          lendingBorrowLimit={lendingBorrowLimit}
        />
      </AccordionDetails>
    </Accordion>
  );
}
