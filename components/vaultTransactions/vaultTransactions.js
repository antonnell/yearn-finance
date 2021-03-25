import { Typography, Paper } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";

import BigNumber from "bignumber.js";
import * as moment from "moment";

import { ETHERSCAN_URL } from "../../stores/constants";

import { formatCurrency, formatAddress, bnDec } from "../../utils";

import classes from "./vaultTransactions.module.css";

function TransactionHeader({ tx }) {
  return (
    <div className={classes.txRow}>
      <div className={classes.txCellDescription}>
        <Typography variant="h5">Description</Typography>
      </div>
      <div className={classes.txCell}>
        <Typography variant="h5" align="right">
          Amount
        </Typography>
      </div>
      <div className={classes.txCell}>
        <Typography variant="h5" align="right">
          Time
        </Typography>
      </div>
      <div className={classes.txCellAddress}>
        <Typography variant="h5" align="right">
          TX Hash
        </Typography>
      </div>
    </div>
  );
}

function TransactionEvent({ tx, vault }) {
  const onAddressClicked = () => {
    window.open(`${ETHERSCAN_URL}tx/${tx.transactionAddress}`, "_blank");
  };

  return (
    <div className={classes.txRow}>
      <div className={classes.txCellDescription}>
        <Typography variant="h5">{tx.description}</Typography>
      </div>
      <div className={classes.txCell}>
        <Typography variant="h5" align="right">
          {formatCurrency(BigNumber(tx.amount).div(bnDec(vault.decimals)))}{" "}
          {vault.displayName}
        </Typography>
      </div>
      <div className={classes.txCell}>
        <Typography variant="h5" align="right">
          {moment(tx.timestamp * 1000).fromNow()}
        </Typography>
      </div>
      <div className={classes.txCellAddress} onClick={onAddressClicked}>
        <Typography variant="h5" align="right">
          {formatAddress(tx.transactionAddress)}
        </Typography>
      </div>
    </div>
  );
}

export default function VaultTransactions({ vault }) {
  if (!vault) {
    return <div></div>;
  }

  return (
    <div className={classes.vaulTransactionsContainer}>
      <TransactionHeader />
      {vault &&
        vault.transactions &&
        vault.transactions.map(tx => {
          return <TransactionEvent key={tx.address} tx={tx} vault={vault} />;
        })}
    </div>
  );
}
