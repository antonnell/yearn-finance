import React, { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  CircularProgress
} from "@material-ui/core";
import BigNumber from "bignumber.js";
import Skeleton from "@material-ui/lab/Skeleton";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";
import { formatCurrency } from "../../utils";
import GasSpeed from "../gasSpeed";

import classes from "./coverActionCard.module.css";

import stores from "../../stores";
import {
  ERROR,
  BUY_COVER,
  BUY_COVER_RETURNED,
  APPROVE_COVER,
  APPROVE_COVER_RETURNED,
  CONNECT_WALLET
} from "../../stores/constants";

export default function Buy({ coverProtocol }) {
  const storeAccount = stores.accountStore.getStore("account");

  const [account, /* setAccount */] = useState(storeAccount);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [gasSpeed, setGasSpeed] = useState("fast");

  const setAmountPercent = percent => {
    setAmountError(false);

    const value = BigNumber(coverProtocol.poolData[0].collateralAsset.balance)
      .times(percent)
      .div(100)
      .toFixed(
        coverProtocol.poolData[0].collateralAsset.decimals,
        BigNumber.ROUND_DOWN
      );
    setAmount(value);

    const claimPoolData = coverProtocol.poolData[0].claimPoolData;
    const receive = calculateReceiveAmount(
      value,
      claimPoolData.swapFee,
      claimPoolData.covTokenWeight,
      claimPoolData.daiInPool,
      claimPoolData.price
    );
    setReceiveAmount(receive);
  };
  3;
  const onAmountChanged = event => {
    setAmountError(false);

    setAmount(event.target.value);

    const claimPoolData = coverProtocol.poolData[0].claimPoolData;
    const receive = calculateReceiveAmount(
      event.target.value,
      claimPoolData.swapFee,
      claimPoolData.covTokenWeight,
      claimPoolData.daiInPool,
      claimPoolData.price
    );
    setReceiveAmount(receive);
  };

  const calculateReceiveAmount = (
    amount,
    feePercent,
    covTokenWeight,
    daiInPool,
    basePrice
  ) => {
    const slippage = (1 - feePercent) / (2 * daiInPool * covTokenWeight);
    const totalSlippage = amount * slippage;
    const endPrice = basePrice * (1 + totalSlippage);

    return (amount / endPrice) * 0.98;
  };

  const onBuy = () => {
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(coverProtocol.poolData[0].collateralAsset.balance)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: BUY_COVER,
      content: {
        asset: coverProtocol.poolData[0].claimAsset,
        collateral: coverProtocol.poolData[0].collateralAsset,
        amount: amount,
        amountOut: receiveAmount,
        pool: coverProtocol.poolData[0],
        gasSpeed: gasSpeed
      }
    });
  };

  const onApprove = () => {
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(coverProtocol.poolData[0].collateralAsset.balance)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_COVER,
      content: {
        poolAddress: coverProtocol.poolData[0].claimPoolData.address,
        asset: coverProtocol.poolData[0].collateralAsset,
        amount: amount,
        gasSpeed: gasSpeed
      }
    });
  };

  const onApproveMax = () => {
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(coverProtocol.poolData[0].collateralAsset.balance)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_COVER,
      content: {
        poolAddress: coverProtocol.poolData[0].claimPoolData.address,
        asset: coverProtocol.poolData[0].collateralAsset,
        amount: "max",
        gasSpeed: gasSpeed
      }
    });
  };

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  const setSpeed = speed => {
    setGasSpeed(speed);
  };

  useEffect(() => {
    const buyReturned = () => {
      setLoading(false);
    };

    const approveReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(BUY_COVER_RETURNED, buyReturned);
    stores.emitter.on(APPROVE_COVER_RETURNED, approveReturned);

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(BUY_COVER_RETURNED, buyReturned);
      stores.emitter.removeListener(APPROVE_COVER_RETURNED, approveReturned);
    };
  });

  if (
    !coverProtocol ||
    !coverProtocol.poolData[0] ||
    !coverProtocol.poolData[0].collateralAsset ||
    !coverProtocol.poolData[0].claimAsset
  ) {
    return <Skeleton style={{ width: "100%", height: "100%" }} />;
  }

  return (
    <div className={classes.buyContainer}>
      <div className={classes.textField}>
        <div className={classes.balances}>
          <Typography
            variant="h5"
            onClick={() => {
              setAmountPercent(100);
            }}
            className={classes.value}
            noWrap
          >
            Balance:{" "}
            {!coverProtocol.poolData[0].collateralAsset.balance ? (
              <Skeleton />
            ) : (
              formatCurrency(coverProtocol.poolData[0].collateralAsset.balance)
            )}
          </Typography>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={amount}
          error={amountError}
          onChange={onAmountChanged}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {coverProtocol.poolData[0].collateralAsset.symbol}
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <img
                  src={coverProtocol.poolData[0].collateralAsset.icon}
                  alt=""
                  width={30}
                  height={30}
                />
              </InputAdornment>
            )
          }}
        />
      </div>
      <div className={classes.scaleContainer}>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(25);
          }}
        >
          <Typography variant={"h5"}>25%</Typography>
        </Button>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(50);
          }}
        >
          <Typography variant={"h5"}>50%</Typography>
        </Button>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(75);
          }}
        >
          <Typography variant={"h5"}>75%</Typography>
        </Button>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(100);
          }}
        >
          <Typography variant={"h5"}>100%</Typography>
        </Button>
      </div>
      <ArrowDownwardIcon className={classes.arrowIcon} />
      <div className={classes.textField}>
        <Typography variant="h5" className={classes.title}>
          You will receive
        </Typography>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          value={receiveAmount}
          disabled={true}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">$ Cover</InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <img
                  src={coverProtocol.poolData[0].claimAsset.icon}
                  alt=""
                  width={30}
                  height={30}
                />
              </InputAdornment>
            )
          }}
        />
      </div>

      <div>
        <GasSpeed setParentSpeed={setSpeed} />
      </div>

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
        <div className={classes.actionButton}>
          {(amount === "" ||
            BigNumber(coverProtocol.poolData[0].collateralAsset.allowance).gte(
              amount
            )) && (
            <Button
              fullWidth
              disableElevation
              variant="contained"
              color="primary"
              size="large"
              onClick={onBuy}
              disabled={loading}
            >
              <Typography variant="h5">
                {loading ? <CircularProgress size={25} /> : "Buy"}
              </Typography>
            </Button>
          )}
          {amount !== "" &&
            (!coverProtocol.poolData[0].collateralAsset.allowance ||
              BigNumber(coverProtocol.poolData[0].collateralAsset.allowance).eq(
                0
              ) ||
              BigNumber(coverProtocol.poolData[0].collateralAsset.allowance).lt(
                amount
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
      )}
    </div>
  );
}
