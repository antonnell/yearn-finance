import React, { useState, useEffect } from "react";

import { Typography, Paper, Tooltip } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";

import Head from "next/head";
import Layout from "../../components/layout/layout.js";
import classes from "./lend.module.css";

import stores from "../../stores/index.js";
import { LEND_UPDATED } from "../../stores/constants";
import { formatCurrency } from "../../utils";

import LendSupplyAssetRow from "../../components/lendSupplyAssetRow";
import LendBorrowAssetRow from "../../components/lendBorrowAssetRow";
import LendAllAssetRow from "../../components/lendAllAssetRow";
import LendSupplyGraph from "../../components/lendSupplyGraph";
import LendBorrowGraph from "../../components/lendBorrowGraph";

function Lend({ changeTheme }) {
  const tvl = null;

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const account = stores.accountStore.getStore("account");
  const storeLendingAssets = stores.lendStore.getStore("lendingAssets");
  const storeLendingSupply = stores.lendStore.getStore("lendingSupply");
  const storeLendingBorrow = stores.lendStore.getStore("lendingBorrow");
  const storeLendingBorrowLimit = stores.lendStore.getStore(
    "lendingBorrowLimit"
  );
  const storeLendingSupplyAPY = stores.lendStore.getStore("lendingSupplyAPY");
  const storeLendingBorrowAPY = stores.lendStore.getStore("lendingBorrowAPY");

  const [lendingAssets, setLendingAssets] = useState(storeLendingAssets);
  const [lendingSupply, setLendingSupply] = useState(storeLendingSupply);
  const [lendingBorrow, setLendingBorrow] = useState(storeLendingBorrow);
  const [lendingBorrowLimit, setLendingBorrowLimit] = useState(
    storeLendingBorrowLimit
  );
  const [lendingSupplyAPY, setLendingSupplyAPY] = useState(
    storeLendingSupplyAPY
  );
  const [lendingBorrowAPY, setLendingBorrowAPY] = useState(
    storeLendingBorrowAPY
  );

  const lendingUpdated = () => {
    setLendingAssets(stores.lendStore.getStore("lendingAssets"));
    setLendingSupply(stores.lendStore.getStore("lendingSupply"));
    setLendingBorrow(stores.lendStore.getStore("lendingBorrow"));
    setLendingSupplyAPY(stores.lendStore.getStore("lendingSupplyAPY"));
    setLendingBorrowAPY(stores.lendStore.getStore("lendingBorrowAPY"));
    setLendingBorrowLimit(stores.lendStore.getStore("lendingBorrowLimit"));
    forceUpdate();
  };

  useEffect(function() {
    stores.emitter.on(LEND_UPDATED, lendingUpdated);

    return () => {
      stores.emitter.removeListener(LEND_UPDATED, lendingUpdated);
    };
  }, []);

  const filterSupplied = a => {
    return BigNumber(a.supplyBalance).gt(0);
  };

  const filterBorrowed = a => {
    return BigNumber(a.borrowBalance).gt(0);
  };

  const sortSupply = (a, b) => {
    if (BigNumber(a.supplyBalance).gt(b.supplyBalance)) {
      return -1;
    } else if (BigNumber(a.supplyBalance).lt(b.supplyBalance)) {
      return 1;
    } else if (BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
      return -1;
    } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
      return 1;
    } else {
      return 0;
    }
  };

  const sortBorrow = (a, b) => {
    if (BigNumber(a.borrowBalance).gt(b.borrowBalance)) {
      return -1;
    } else if (BigNumber(a.borrowBalance).lt(b.borrowBalance)) {
      return 1;
    } else if (BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
      return -1;
    } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
      return 1;
    } else {
      return 0;
    }
  };

  const sortAll = (a, b) => {
    if (BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
      return -1;
    } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
      return 1;
    } else {
      return 0;
    }
  };

  const renderSupplyHeaders = () => {
    return (
      <div className={classes.lendingRow}>
        <div className={classes.lendTitleCell}>
          <Typography variant="h5">Name</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Supplied</Typography>
        </div>
        <div className={classes.lendBalanceCell}>
          <Typography variant="h5">Balance</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">APY</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Liquidity</Typography>
        </div>
      </div>
    );
  };

  const renderBorrowHeaders = () => {
    return (
      <div className={classes.lendingRow}>
        <div className={classes.lendTitleCell}>
          <Typography variant="h5">Name</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Borrowed</Typography>
        </div>
        <div className={classes.lendBalanceCell}>
          <Typography variant="h5">Balance</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">APY</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Liquidity</Typography>
        </div>
      </div>
    );
  };

  const renderAllHeaders = () => {
    return (
      <div className={classes.lendingRow}>
        <div className={classes.lendTitleCell}>
          <Typography variant="h5">Name</Typography>
        </div>
        <div className={classes.lendBalanceCell}>
          <Typography variant="h5">Balance</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Borrow APY</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Supply APY</Typography>
        </div>
        <div className={classes.lendValueCell}>
          <Typography variant="h5">Liquidity</Typography>
        </div>
      </div>
    );
  };

  const supplyAssets = lendingAssets
    ? lendingAssets.filter(filterSupplied).sort(sortSupply)
    : [];
  const borrowAssets = lendingAssets
    ? lendingAssets.filter(filterBorrowed).sort(sortBorrow)
    : [];

  const renderSupplyTootip = () => {
    return (
      <div className={classes.tooltipContainer}>
        {supplyAssets.map(asset => {
          return (
            <div className={classes.tooltipValue}>
              <Typography className={classes.val}>
                {asset.tokenMetadata.symbol}
              </Typography>
              <Typography className={classes.valBold}>
                {formatCurrency(asset.supplyAPY)}%
              </Typography>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBorrowTooltip = () => {
    return (
      <div className={classes.tooltipContainer}>
        {borrowAssets.map(asset => {
          return (
            <div className={classes.tooltipValue}>
              <Typography className={classes.val}>
                {asset.tokenMetadata.symbol}
              </Typography>
              <Typography className={classes.valBold}>
                {formatCurrency(asset.borrowAPY)}%
              </Typography>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>Lend</title>
      </Head>
      <div className={classes.lendingContainer}>
        <Paper elevation={0} className={classes.lendingOverviewContainer}>
          <div className={classes.overviewCard}>
            <LendSupplyGraph assets={supplyAssets} />
            <div>
              <Typography variant="h2">Total Supplied</Typography>
              <Typography variant="h1" className={classes.headAmount}>
                {lendingSupply === null ? (
                  <Skeleton style={{ minWidth: "200px " }} />
                ) : (
                  `$ ${formatCurrency(lendingSupply)}`
                )}
              </Typography>
              <Tooltip title={renderSupplyTootip()}>
                <Typography>
                  {!lendingSupplyAPY ? (
                    <Skeleton style={{ minWidth: "200px " }} />
                  ) : (
                    `${formatCurrency(lendingSupplyAPY)} % Average APY`
                  )}
                </Typography>
              </Tooltip>
            </div>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <Tooltip title="View transaction">
              <LendBorrowGraph assets={borrowAssets} />
            </Tooltip>
            <div>
              <Typography variant="h2">Total Borrowed</Typography>
              <Typography variant="h1" className={classes.headAmount}>
                {lendingBorrow === null ? (
                  <Skeleton style={{ minWidth: "200px " }} />
                ) : (
                  `$ ${formatCurrency(lendingBorrow)}`
                )}
              </Typography>
              <Tooltip title={renderBorrowTooltip()}>
                <Typography>
                  {!lendingBorrowAPY ? (
                    <Skeleton style={{ minWidth: "200px " }} />
                  ) : (
                    `${formatCurrency(lendingBorrowAPY)} % Average APY`
                  )}
                </Typography>
              </Tooltip>
            </div>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Borrow Limit Used</Typography>
              <Typography variant="h1">
                {lendingBorrowLimit === null ? (
                  <Skeleton style={{ minWidth: "200px " }} />
                ) : (
                  `${formatCurrency(
                    lendingBorrowLimit > 0
                      ? (lendingBorrow * 100) / lendingBorrowLimit
                      : 0
                  )} %`
                )}
              </Typography>
            </div>
          </div>
        </Paper>
        {supplyAssets.length > 0 && (
          <React.Fragment>
            <Typography variant="h6" className={classes.tableHeader}>
              Supplied Assets
            </Typography>
            <Paper elevation={0} className={classes.lendingTable}>
              {renderSupplyHeaders()}
              {supplyAssets.map(asset => {
                return (
                  <LendSupplyAssetRow
                    key={asset.address}
                    lendingAsset={asset}
                    lendingBorrow={lendingBorrow}
                    lendingSupply={lendingSupply}
                    lendingBorrowLimit={lendingBorrowLimit}
                  />
                );
              })}
            </Paper>
          </React.Fragment>
        )}
        {borrowAssets.length > 0 && (
          <React.Fragment>
            <Typography variant="h6" className={classes.tableHeader}>
              Borrowed Assets
            </Typography>
            <Paper elevation={0} className={classes.lendingTable}>
              {renderBorrowHeaders()}
              {borrowAssets.map(asset => {
                return (
                  <LendBorrowAssetRow
                    key={asset.address}
                    lendingAsset={asset}
                    lendingBorrow={lendingBorrow}
                    lendingSupply={lendingSupply}
                    lendingBorrowLimit={lendingBorrowLimit}
                  />
                );
              })}
            </Paper>
          </React.Fragment>
        )}
        <Typography variant="h6" className={classes.tableHeader}>
          All Assets
        </Typography>
        <Paper elevation={0} className={classes.lendingTable}>
          {renderAllHeaders()}
          {lendingAssets &&
            lendingAssets.sort(sortAll).map(asset => {
              return (
                <LendAllAssetRow
                  key={asset.address}
                  lendingAsset={asset}
                  lendingBorrow={lendingBorrow}
                  lendingSupply={lendingSupply}
                  lendingBorrowLimit={lendingBorrowLimit}
                />
              );
            })}
        </Paper>
      </div>
    </Layout>
  );
}

export default Lend;
