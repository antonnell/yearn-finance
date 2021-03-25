import React, { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  CircularProgress,
  Tooltip
} from "@material-ui/core";
import BigNumber from "bignumber.js";
import Skeleton from "@material-ui/lab/Skeleton";
import { formatCurrency } from "../../utils";
import GasSpeed from "../gasSpeed";

import classes from "./vaultActionCard.module.css";

import stores from "../../stores";
import {
  ERROR,
  DEPOSIT_VAULT,
  DEPOSIT_VAULT_RETURNED,
  APPROVE_VAULT,
  APPROVE_VAULT_RETURNED,
  CONNECT_WALLET
} from "../../stores/constants";

export default function Deposit({ vault }) {
  const storeAccount = stores.accountStore.getStore("account");

  const [account, setAccount] = useState(storeAccount);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);
  const [gasSpeed, setGasSpeed] = useState("");

  const setAmountPercent = percent => {
    setAmountError(false);

    setAmount(
      BigNumber(vault.tokenMetadata.balance)
        .times(percent)
        .div(100)
        .toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN)
    );
  };

  const onAmountChanged = event => {
    setAmountError(false);

    setAmount(event.target.value);
  };

  const onDeposit = () => {
    setAmountError(false);
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(vault.tokenMetadata.balance)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: DEPOSIT_VAULT,
      content: { vault: vault, amount: amount, gasSpeed: gasSpeed }
    });
  };

  const onApprove = () => {
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(vault.tokenMetadata.balance)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_VAULT,
      content: { vault: vault, amount: amount, gasSpeed: gasSpeed }
    });
  };

  const onApproveMax = () => {
    if (
      !amount ||
      isNaN(amount) ||
      amount <= 0 ||
      BigNumber(amount).gt(vault.tokenMetadata.balance)
    ) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_VAULT,
      content: { vault: vault, amount: "max", gasSpeed: gasSpeed }
    });
  };

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  const setSpeed = speed => {
    setGasSpeed(speed);
  };

  useEffect(() => {
    const depositReturned = () => {
      setLoading(false);
    };

    const approveReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(DEPOSIT_VAULT_RETURNED, depositReturned);
    stores.emitter.on(APPROVE_VAULT_RETURNED, approveReturned);

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(DEPOSIT_VAULT_RETURNED, depositReturned);
      stores.emitter.removeListener(APPROVE_VAULT_RETURNED, approveReturned);
    };
  });

  return (
    <div className={classes.depositContainer}>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Deposit
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
              {!vault.tokenMetadata.balance ? (
                <Skeleton />
              ) : (
                formatCurrency(vault.tokenMetadata.balance)
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
        <Tooltip title="25% of your wallet balance">
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
        </Tooltip>
        <Tooltip title="50% of your wallet balance">
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
        </Tooltip>
        <Tooltip title="75% of your wallet balance">
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
        </Tooltip>
        <Tooltip title="100% of your wallet balance">
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
        </Tooltip>
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
            BigNumber(vault.tokenMetadata.allowance).gte(amount)) && (
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
                {loading ? <CircularProgress size={25} /> : "Deposit"}
              </Typography>
            </Button>
          )}
          {amount !== "" &&
            BigNumber(amount).gt(0) &&
            (!vault.tokenMetadata.allowance ||
              BigNumber(vault.tokenMetadata.allowance).eq(0) ||
              BigNumber(vault.tokenMetadata.allowance).lt(amount)) && (
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
