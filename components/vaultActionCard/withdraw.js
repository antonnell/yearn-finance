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
import { formatCurrency } from "../../utils";
import GasSpeed from "../gasSpeed";

import classes from "./vaultActionCard.module.css";

import stores from "../../stores";
import {
  ERROR,
  WITHDRAW_VAULT,
  WITHDRAW_VAULT_RETURNED,
  CONNECT_WALLET
} from "../../stores/constants";

export default function Withdraw({ vault }) {
  const storeAccount = stores.accountStore.getStore("account");

  const [account, setAccount] = useState(storeAccount);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);
  const [gasSpeed, setGasSpeed] = useState("");

  const setAmountPercent = percent => {
    setAmountError(false);

    setAmount(
      BigNumber(vault.balanceInToken)
        .times(percent)
        .div(100)
        .toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN)
    );
  };

  const onAmountChanged = event => {
    setAmountError(false);

    setAmount(event.target.value);
  };

  const onWithdraw = () => {
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(vault.balanceInToken)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: WITHDRAW_VAULT,
      content: {
        vault: vault,
        amount: BigNumber(amount)
          .div(vault.pricePerFullShare)
          .toFixed(vault.decimals, BigNumber.ROUND_DOWN),
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
    const withdrawReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(WITHDRAW_VAULT_RETURNED, withdrawReturned);

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(WITHDRAW_VAULT_RETURNED, withdrawReturned);
    };
  });

  return (
    <div className={classes.depositContainer}>
      <div className={classes.textField}>
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
                setAmountPercent(100);
              }}
              className={classes.value}
              noWrap
            >
              Balance:{" "}
              {!vault.balanceInToken ? (
                <Skeleton />
              ) : (
                formatCurrency(vault.balanceInToken)
              )}
            </Typography>
          </div>
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
                {vault.tokenMetadata.displayName}
              </InputAdornment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <img
                  src={vault.tokenMetadata.icon}
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
          <Button
            fullWidth
            disableElevation
            variant="contained"
            color="primary"
            size="large"
            onClick={onWithdraw}
            disabled={loading}
          >
            <Typography variant="h5">
              {loading ? <CircularProgress size={25} /> : "Withdraw"}
            </Typography>
          </Button>
        </div>
      )}
    </div>
  );
}
