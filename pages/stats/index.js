import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, InputAdornment, Grid } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import Skeleton from '@material-ui/lab/Skeleton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import classes from './stats.module.css';
import BigNumber from 'bignumber.js';

import stores from '../../stores/index.js';
import { VAULTS_UPDATED, ETHERSCAN_URL, LEND_UPDATED } from '../../stores/constants';

import { formatCurrency, formatAddress } from '../../utils';

const StatsHeader = (props) => {
  const { order, orderBy, onRequestSort } = props;

  let headers = [
    { label: 'Vault', id: 'vault' },
    { label: 'Version', id: 'version' },
    {
      label: 'Strategies',
      id: 'strategies',
    },
    { label: 'Total Value Locked', numeric: true, id: 'tvl' },
    {
      label: 'APY',
      numeric: true,
      id: 'apy30Days',
    },
  ];
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  return (
    <TableHead>
      <TableRow>
        {headers.map((headCell, i) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : 'asc'} onClick={createSortHandler(headCell)}>
              <Typography variant="h5" className={classes.fontWeightBold}>
                {headCell.label}
              </Typography>
              {orderBy === headCell.id ? <span className={classes.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span> : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};

function StatsData({ vault }) {
  const onVaultClicked = () => {
    window.open(`${ETHERSCAN_URL}address/${vault.address}`, '_blank');
  };

  const onStrategyClicked = (strat) => {
    window.open(`${ETHERSCAN_URL}address/${strat.address}`, '_blank');
  };

  return (
    <TableRow hover tabIndex={-1} key={vault.symbol} onClick={onVaultClicked}>
      <TableCell>
        <div className={classes.descriptionCell}>
          <div className={classes.vaultLogo}>
            <img src={vault.icon ? vault.icon : '/tokens/unknown-logo.png'} alt="" width={30} height={30} />
          </div>
          <div>
            <Typography variant="h5">{vault.displayName}</Typography>
            <Typography variant="subtitle1" className={classes.subTitle} color="textSecondary">
              {vault.name}
            </Typography>
          </div>
        </div>
      </TableCell>
      <TableCell scope="row" align="left">
        <Typography variant="h5">{vault.type === 'v2' && !vault.endorsed ? 'Experimental' : vault.type} Vault</Typography>
      </TableCell>
      <TableCell scope="row" align="left">
        {vault &&
          vault.strategies &&
          vault.strategies.map((strategy) => {
            return (
              <Typography
                key={strategy.address}
                variant="h5"
                onClick={() => {
                  onStrategyClicked(strategy);
                }}
                className={classes.strategy}
              >
                {strategy.name ? strategy.name.replace(/^Strategy/, '') : ''}
              </Typography>
            );
          })}
      </TableCell>
      <TableCell scope="row" align="right">
        <Typography variant="h5" align="right" className={classes.fontWeightBold}>
          $ {vault.tvl && vault.tvl.value ? formatCurrency(vault.tvl.value) : '0.00'}
        </Typography>
      </TableCell>
      <TableCell scope="row" align="right">
        <Typography variant="h5" align="right" className={classes.fontWeightBold}>
          {vault.apy?.recommended ? formatCurrency(BigNumber(vault.apy.recommended).times(100)) : '0.00'}kiki%
        </Typography>
      </TableCell>
    </TableRow>
  );
}

function Stats({ changeTheme }) {
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const [search, setSearch] = useState('');
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('none');
  const getOrderBy = (x) => {
    let y;
    order === 'asc' ? (y = -x) : (y = x);
    return y;
  };

  const storeVaults = stores.investStore.getStore('vaults');
  const storeTvl = stores.investStore.getStore('tvlInfo');
  const storeIronBankTVL = stores.lendStore.getStore('ironBankTVL');

  const [vaults, setVaults] = useState(storeVaults);
  const [tvl, setTvl] = useState(storeTvl);
  const [ironBankTVL, setIronBankTVL] = useState(storeIronBankTVL);
  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };
  const handleRequestSort = (event, property) => {
    const isAsc = order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const filteredVaults = vaults
    .filter((vault) => {
      let returnValue = true;
      const vaultType = vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type;
      if (search && search !== '') {
        returnValue =
          vault.displayName.toLowerCase().includes(search.toLowerCase()) ||
          vault.address.toLowerCase().includes(search.toLowerCase()) ||
          vault.symbol.toLowerCase().includes(search.toLowerCase()) ||
          vaultType.toLowerCase().includes(search.toLowerCase()) ||
          (vault.strategies &&
            vault.strategies.length > 0 &&
            vault.strategies
              .map((strategy) => {
                return strategy.name;
              })
              .join()
              .toLowerCase()
              .includes(search.toLocaleLowerCase()));
      }

      return returnValue;
    })
    .sort((a, b) => {
      if (orderBy === 'none') {
        if (BigNumber(a.tokenMetadata.balance).gt(b.tokenMetadata.balance)) {
          return -1;
        } else if (BigNumber(a.tokenMetadata.balance).lt(b.tokenMetadata.balance)) {
          return 1;
        } else {
          return 0;
        }
      } else if (orderBy.id === 'vault') {
        if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) {
          return getOrderBy(1);
        } else if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) {
          return getOrderBy(-1);
        }
      } else if (orderBy.id === 'version') {
        let typeA = a.type;
        let typeB = b.type;
        typeA === 'v2' && !a.endorsed ? (typeA = 'Exp') : null;
        typeB === 'v2' && !b.endorsed ? (typeB = 'Exp') : null;
        if (typeA.toLowerCase() > typeB.toLowerCase()) {
          return getOrderBy(1);
        } else if (typeA.toLowerCase() < typeB.toLowerCase()) {
          return getOrderBy(-1);
        }
      } else if (orderBy.id === 'strategies') {
        let strategyA =
          a.strategies &&
          a.strategies.length > 0 &&
          a.strategies
            .map((strategy) => {
              return strategy.name;
            })
            .join()
            .toLowerCase();
        let strategyB =
          b.strategies &&
          b.strategies.length > 0 &&
          b.strategies
            .map((strategy) => {
              return strategy.name;
            })
            .join()
            .toLowerCase();
        if (strategyA > strategyB) {
          return getOrderBy(1);
        } else if (strategyA < strategyB) {
          return getOrderBy(-1);
        }
      } else if (orderBy.id === 'apy30Days') {
        let oneMonthA = a.apy?.recommended;
        let oneMonthB = b.apy?.recommended;
        if (BigNumber(oneMonthA).gt(BigNumber(oneMonthB))) {
          return getOrderBy(-1);
        } else if (BigNumber(oneMonthA).lt(BigNumber(oneMonthB))) {
          return getOrderBy(1);
        }
      } else if (orderBy.id === 'tvl') {
        let tvlA = a.tvl?.value;
        let tvlB = b.tvl?.value;
        if (BigNumber(tvlA).gt(BigNumber(tvlB))) {
          return getOrderBy(-1);
        } else if (BigNumber(tvlA).lt(BigNumber(tvlB))) {
          return getOrderBy(1);
        }
      }
    });

  useEffect(function () {
    const vaultsUpdated = () => {
      setVaults(stores.investStore.getStore('vaults'));
      setTvl(stores.investStore.getStore('tvlInfo'));
      forceUpdate();
    };

    const lendUpdated = () => {
      setIronBankTVL(stores.lendStore.getStore('ironBankTVL'));
      forceUpdate();
    };

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);
    stores.emitter.on(LEND_UPDATED, lendUpdated);

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
      stores.emitter.removeListener(LEND_UPDATED, lendUpdated);
    };
  }, []);

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>Stats</title>
      </Head>
      <Paper elevation={0} className={classes.overviewContainer}>
        <div className={classes.overviewCard}>
          <div>
            <Typography variant="h2">Total Value Locked</Typography>
            <Typography variant="h1">
              {!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(BigNumber(tvl.tvlUSD).plus(ironBankTVL), 0)}`}
            </Typography>
          </div>
        </div>
        <div className={classes.separator}></div>
        <div className={classes.overviewCard}>
          <div>
            <Typography variant="h2">Total Vault Balance</Typography>
            <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalVaultHoldingsUSD, 0)}`}</Typography>
          </div>
        </div>
        <div className={classes.separator}></div>
        <div className={classes.overviewCard}>
          <div>
            <Typography variant="h2">Total Earn Balance</Typography>
            <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalEarnHoldingsUSD, 0)}`}</Typography>
          </div>
        </div>
        <div className={classes.separator}></div>
        <div className={classes.overviewCard}>
          <div>
            <Typography variant="h2">Total Iron Bank Balance</Typography>
            <Typography variant="h1">{!ironBankTVL ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(ironBankTVL, 0)}`}</Typography>
          </div>
        </div>
      </Paper>
      <div className={classes.statsContainer}>
        <div className={classes.statsFilters}>
          <TextField
            className={classes.searchContainer}
            variant="outlined"
            fullWidth
            placeholder="ETH, CRV, ..."
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </div>
        <Grid item xs={12}>
          <Paper elevation={0} className={classes.tableContainer}>
            <TableContainer>
              <Table className={classes.statsTable} aria-labelledby="tableTitle" size="medium" aria-label="enhanced table">
                <StatsHeader order={order} orderBy={orderBy} onRequestSort={handleRequestSort} />
                <TableBody>
                  {filteredVaults &&
                    filteredVaults.map((vault) => {
                      return <StatsData key={vault.address} vault={vault} />;
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </div>
    </Layout>
  );
}

export default Stats;
