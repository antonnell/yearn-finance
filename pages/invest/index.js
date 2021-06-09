import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import { Typography, Paper, TextField, InputAdornment, Grid } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Skeleton from '@material-ui/lab/Skeleton';
import classes from './invest.module.css';
import VaultAssetRow from '../../components/vaultAssetRow';
import VaultCard from '../../components/vaultCard';
import VaultSplitGraph from '../../components/vaultSplitGraph';
import FilterListIcon from '@material-ui/icons/FilterList';

import BigNumber from 'bignumber.js';
import Popover from '@material-ui/core/Popover';
import HelpIcon from '@material-ui/icons/Help';

import AccountBalanceIcon from '@material-ui/icons/AccountBalance';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import StarIcon from '@material-ui/icons/Star';
import SearchIcon from '@material-ui/icons/Search';
import ListAltIcon from '@material-ui/icons/ListAlt';
import AppsIcon from '@material-ui/icons/Apps';
import ListIcon from '@material-ui/icons/List';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';

import { formatCurrency } from '../../utils';

import stores from '../../stores/index.js';
import { VAULTS_UPDATED } from '../../stores/constants';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  popover: {
    padding: theme.spacing(2),
  },
}));


const Podium = ({vaults, isStableCoin, handlePopoverOpen}) => (
  <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
    {vaults.length > 4 &&
      vaults.slice(0, 3).map((vault, i) => (
        <li key={i}>
          <span style={{ fontSize: '25px' }}>
            {i === 0 ? '🥇' : null}
            {i === 1 ? '🥈' : null}
            {i === 2 ? '🥉' : null}
          </span>
          <span
            href={`/vaults/${vault.nonLowerCaseAddress}`}
            onClick={() => handleNavigate(vault)}
            className={classes.topVaultPerformersLink}
          >
            {`${vault.label} (${vault.version})`} {(vault.apy * 100).toFixed(2)}%{' '}
          </span>
          <HelpIcon
            style={{ cursor: 'pointer', width: 15 }}
            onClick={event => handlePopoverOpen(event, vault, isStableCoin)}
          />
        </li>
      ))}
  </ul>
);

function Invest({ changeTheme }) {
  const localClasses = useStyles();
  const router = useRouter();

  function handleNavigate(vault) {
    router.push('/invest/' + vault.nonLowerCaseAddress);
  }
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const storeVaults = stores.investStore.getStore('vaults');
  const storePortfolioBalance = stores.investStore.getStore('portfolioBalanceUSD');
  const storePortfolioGrowth = stores.investStore.getStore('portfolioGrowth');
  const storeHighestHoldings = stores.investStore.getStore('highestHoldings');
  const account = stores.accountStore.getStore('account');

  const localStoragelayout = localStorage.getItem('yearn.finance-invest-layout');
  const localStorageversions = localStorage.getItem('yearn.finance-invest-versions');

  const [topVaultPerformers, setTopVaultPerformers] = useState({ stableCoinVaults: [], ethBTCVaults: [], otherVaults: [] });
  const [vaults, setVaults] = useState(storeVaults);
  const [porfolioBalance, setPorfolioBalance] = useState(storePortfolioBalance);
  const [portfolioGrowth, setPortfolioGrowth] = useState(storePortfolioGrowth);
  const [highestHoldings, setHighestHoldings] = useState(storeHighestHoldings);
  const [search, setSearch] = useState('');
  const [versions, setVersions] = useState(JSON.parse(localStorageversions ? localStorageversions : '[]'));
  const [layout, setLayout] = useState(localStoragelayout ? localStoragelayout : 'grid');
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('none');
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [investPopoverText, setInvestPopoverText] = useState('');
  const handlePopoverOpen = (event, vault, isStableCoin) => {
    let popoverText = `invest $1,000 and get $${formatCurrency(1000 * (1 + vault.apy))} in a year at current rate. Note that rates are not fixed.`;
    if (!isStableCoin) {
      let symbol = vault.symbol.split(' Vault')[0];
      popoverText = `invest 1 ${symbol} and get ${formatCurrency(1 * (1 + vault.apy))} ${symbol} in a year at current rate. Note that rates are not fixed.`;
    }
    setInvestPopoverText(popoverText);
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const vaultsUpdated = () => {
    setVaults(stores.investStore.getStore('vaults'));
    setPorfolioBalance(stores.investStore.getStore('portfolioBalanceUSD'));
    setPortfolioGrowth(stores.investStore.getStore('portfolioGrowth'));
    setHighestHoldings(stores.investStore.getStore('highestHoldings'));
    forceUpdate();
  };
  const getOrderBy = (x) => {
    let y;
    order === 'asc' ? (y = -x) : (y = x);
    return y;
  };
  useEffect(function () {
    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
    };
  }, []);
  const setTopPerformers = (zapperVaults) => {
    let stableCoinVaults = [];
    let ethBTCVaults = [];
    let otherVaults = [];
    zapperVaults.map((v) => {
      vaults.map((vault) => {
        if (v.address.toLowerCase() === vault.address.toLowerCase()) {
          v.apy = vault.apy?.recommended;
          v.nonLowerCaseAddress = vault.address;
          v.symbol = vault.symbol;
          v.label = vault.displayName;
        }
        if(v.apy === 'New') {
          v.apy = 0
        }
      });
      if (v.pricePerToken < 1.4 && v.pricePerToken >= 0.9) {
        stableCoinVaults.push(v);
      } else if (v.symbol.indexOf('BTC') > -1 || v.symbol.indexOf('ETH') > -1) {
        ethBTCVaults.push(v);
      } else {
        otherVaults.push(v);
      }
    });
    const vaultSort = (a, b) => {
      if (orderBy === 'none') {
        if (BigNumber(a.apy).gt(BigNumber(b.apy))) {
          return -1;
        } else if (BigNumber(a.apy).lt(BigNumber(b.apy))) {
          return 1;
        }
      }
    };
    stableCoinVaults.sort(vaultSort);
    ethBTCVaults.sort(vaultSort);
    otherVaults.sort(vaultSort);
    setTopVaultPerformers({ stableCoinVaults: stableCoinVaults, ethBTCVaults: ethBTCVaults, otherVaults: otherVaults });
  };
  React.useEffect(() => {
    async function fetchVaultsFromZapper() {
      const response = await fetch('https://api.zapper.fi/v1/vault-stats/yearn?api_key=96e0cc51-a62e-42ca-acee-910ea7d2a241');
      if (response.status === 200) {
        const zapperVaultsJSON = await response.json();
        setTopPerformers(zapperVaultsJSON);
      }
    }
    fetchVaultsFromZapper();
  }, []);
  const filteredVaults = vaults
    .filter((vault) => {
      let returnValue = true;
      if (versions && versions.length > 0) {
        if (versions.includes('Active')) {
          const vaultType = vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type;

          returnValue = BigNumber(vault.balance).gt(0) && (versions.length > 1 ? versions.includes(vaultType) : true);
        } else {
          const vaultType = vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type;
          returnValue = versions.includes(vaultType);
        }
      }

      if (returnValue === true && search && search !== '' && search !== '_stablecoins_' && search !== '_ethbtc_' && search !== '_others_') {
        returnValue =
          vault.displayName.toLowerCase().includes(search.toLowerCase()) ||
          vault.name.toLowerCase().includes(search.toLowerCase()) ||
          vault.symbol.toLowerCase().includes(search.toLowerCase()) ||
          vault.address.toLowerCase().includes(search.toLowerCase()) ||
          vault.tokenMetadata.displayName.toLowerCase().includes(search.toLowerCase()) ||
          vault.tokenMetadata.name.toLowerCase().includes(search.toLowerCase()) ||
          vault.tokenMetadata.symbol.toLowerCase().includes(search.toLowerCase()) ||
          vault.tokenMetadata.address.toLowerCase().includes(search.toLowerCase());
      }
      let found = false;
      if (search === '_stablecoins_') {
        topVaultPerformers.stableCoinVaults.map((v) => {
          if (v.address.toLowerCase() === vault.address.toLowerCase()) {
            found = true && returnValue;
          }
        });
        returnValue = found;
      } else if (search === '_ethbtc_') {
        topVaultPerformers.ethBTCVaults.map((v) => {
          if (v.address.toLowerCase() === vault.address.toLowerCase()) {
            found = true && returnValue;
          }
        });
        returnValue = found;
      } else if (search === '_others_') {
        topVaultPerformers.otherVaults.map((v) => {
          if (v.address.toLowerCase() === vault.address.toLowerCase()) {
            found = true && returnValue;
          }
        });
        returnValue = found;
      }

      return returnValue;
    })
    .sort((a, b) => {
      if (orderBy === 'none' && search !== '_stablecoins_' && search !== '_ethbtc_' && search !== '_others_') {
        if (BigNumber(a.balanceUSD).gt(BigNumber(b.balanceUSD))) {
          return -1;
        } else if (BigNumber(a.balanceUSD).lt(BigNumber(b.balanceUSD))) {
          return 1;
        } else if (BigNumber(a.tokenMetadata.balance).gt(BigNumber(b.tokenMetadata.balance))) {
          return -1;
        } else if (BigNumber(a.tokenMetadata.balance).lt(BigNumber(b.tokenMetadata.balance))) {
          return 1;
        } else {
          const aType = a.type === 'v2' && !a.endorsed ? 'Exp' : a.type;
          const bType = b.type === 'v2' && !b.endorsed ? 'Exp' : b.type;
          if (aType > bType) {
            return -1;
          } else if (bType > aType) {
            return 1;
          } else {
            return 0;
          }
        }
      } else if (orderBy.id === 'apy') {
        let apyA = a.apy?.recommended || 0;
        let apyB = b.apy?.recommended || 0;
        if (BigNumber(apyA).gt(BigNumber(apyB))) {
          return getOrderBy(-1);
        } else if (BigNumber(apyA).lt(BigNumber(apyB))) {
          return getOrderBy(1);
        }
      } else if (orderBy.id === 'name') {
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
      } else if (orderBy.id === 'balance') {
        let balanceA = a.balanceUSD;
        let balanceB = b.balanceUSD;

        if (BigNumber(balanceA).gt(BigNumber(balanceB))) {
          return getOrderBy(-1);
        } else if (BigNumber(balanceA).lt(BigNumber(balanceB))) {
          return getOrderBy(1);
        }
      } else if (orderBy.id === 'available') {
        let availableA = 0;
        let availableB = 0;
        a.tokenMetadata?.balance ? (availableA = a.tokenMetadata?.balance) : (availableA = 0);
        b.tokenMetadata?.balance ? (availableB = b.tokenMetadata?.balance) : (availableB = 0);
        if (BigNumber(availableA).gt(BigNumber(availableB))) {
          return getOrderBy(-1);
        } else if (BigNumber(availableA).lt(BigNumber(availableB))) {
          return getOrderBy(1);
        }
      }
    });

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const handleVersionsChanged = (event, newVals) => {
    setVersions(newVals);
    localStorage.setItem('yearn.finance-invest-versions', newVals && newVals.length ? JSON.stringify(newVals) : '');
  };

  const handleLayoutChanged = (event, newVal) => {
    if (newVal !== null) {
      setLayout(newVal);
      localStorage.setItem('yearn.finance-invest-layout', newVal ? newVal : '');
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const renderVaultHeaders = (props) => {
    const { order, orderBy, onRequestSort } = props;

    let headers = [
      { label: 'Name', show: true, id: 'name' },
      { label: 'Version', show: true, id: 'version' },
      {
        label: 'Invested Balance',
        numeric: true,
        show: account && account.address,
        id: 'balance',
      },
      {
        label: 'Available To Deposit',
        numeric: true,
        show: account && account.address,
        id: 'available',
      },
      { label: 'Yearly Growth', numeric: true, show: true, id: 'apy' },
    ];
    const createSortHandler = (property) => (event) => {
      onRequestSort(event, property);
    };
    return (
      <TableHead>
        <TableRow>
          {headers.map(headCell =>
            headCell.show ? (
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
                  {orderBy === headCell.id ? (
                    <span className={classes.visuallyHidden}>{order === 'desc' ? 'sorted descending' : 'sorted ascending'}</span>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            ) : null,
          )}
        </TableRow>
      </TableHead>
    );
  };

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>Invest</title>
      </Head>
      <div className={classes.investContainer}>
        {account && account.address && highestHoldings !== 'None' && (
          <Paper elevation={0} className={classes.overviewContainer}>
            <div className={classes.overviewCard}>
              {porfolioBalance !== null ? <VaultSplitGraph vaults={vaults} /> : <Skeleton variant="circle" width={80} height={80} />}
              <div>
                <Typography variant="h2">Portfolio Balance</Typography>
                <Typography variant="h1" className={classes.headAmount}>
                  {porfolioBalance === null ? <Skeleton style={{ minWidth: '200px ' }} /> : '$ ' + formatCurrency(porfolioBalance)}
                </Typography>
              </div>
            </div>
            <div className={classes.separator}></div>
            <div className={classes.overviewCard}>
              {porfolioBalance !== null ? (
                <div className={classes.portfolioOutline}>
                  <TrendingUpIcon className={classes.portfolioIcon} />
                </div>
              ) : (
                <Skeleton variant="circle" width={80} height={80} />
              )}
              <div>
                <Typography variant="h2">Yearly Growth</Typography>
                <Typography variant="h1" className={classes.headAmount}>
                  {porfolioBalance === null ? (
                    <Skeleton style={{ minWidth: '200px ' }} />
                  ) : (
                    '$ ' + formatCurrency(BigNumber(porfolioBalance).times(portfolioGrowth).div(100))
                  )}
                </Typography>
              </div>
            </div>
            <div className={classes.separator}></div>
            <div className={classes.overviewCard}>
              {porfolioBalance !== null ? (
                <div className={classes.portfolioOutline}>
                  {' '}
                  <AccountBalanceIcon className={classes.portfolioIcon} />
                </div>
              ) : (
                <Skeleton variant="circle" width={80} height={80} />
              )}
              <div>
                <Typography variant="h2">Highest Balance</Typography>
                <Typography variant="h1">
                  {highestHoldings === null ? (
                    <Skeleton style={{ minWidth: '200px ' }} />
                  ) : highestHoldings === 'None' ? (
                    highestHoldings
                  ) : (
                    highestHoldings.displayName
                  )}
                </Typography>
              </div>
            </div>
          </Paper>
        )}
        <div className={account ? classes.overviewTopPerformersContainer : null}>
          <Paper elevation={0} className={classes.overviewContainer}>
            <div className={classes.overviewCard}>
              <div className={classes.portfolioOutline}>
                <AttachMoneyIcon className={classes.portfolioIcon} />
              </div>
              <div>
                <Popover
                  open={open}
                  anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                  }}
                  anchorEl={anchorEl}
                  onClose={handlePopoverClose}
                  disableRestoreFocus
                >
                  <Typography className={localClasses.popover}>{investPopoverText}</Typography>
                </Popover>
                <ToggleButton
                  className={`${classes.vaultTypeButton} ${search === '_stablecoins_' ? classes.stableCoinsSelected : classes.stableCoins}`}
                  value="Lockup"
                  onClick={() => {
                    setSearch(search === '_stablecoins_' ? '' : '_stablecoins_');
                    setOrderBy({ id: 'apy' });
                    setOrder('desc');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <FilterListIcon />
                  <Typography variant="h2">Top Stablecoins APYs</Typography>
                </ToggleButton>
                <Podium vaults={topVaultPerformers.stableCoinVaults} isStableCoin={true} handlePopoverOpen={handlePopoverOpen} />
              </div>
            </div>
            <div className={classes.separator}></div>
            <div className={classes.overviewCard}>
              <div className={classes.portfolioOutline}>
                <StarIcon className={classes.portfolioIcon} />
              </div>
              <div>
                <ToggleButton
                  onClick={() => {
                    setSearch(search === '_ethbtc_' ? '' : '_ethbtc_');
                  }}
                  style={{ cursor: 'pointer' }}
                  className={`${classes.vaultTypeButton} ${search === '_ethbtc_' ? classes.ethBTCSelected : classes.ethbtc}`}
                  value="Lockup"
                >
                  <FilterListIcon />
                  <Typography variant="h2">Top BTC and ETH APYs</Typography>
                </ToggleButton>
                <Podium vaults={topVaultPerformers.ethBTCVaults} isStableCoin={false} handlePopoverOpen={handlePopoverOpen} />

              </div>
            </div>
            <div className={classes.separator}></div>
            <div className={classes.overviewCard}>
              <div className={classes.portfolioOutline}>
                <ListAltIcon className={classes.portfolioIcon} />
              </div>
              <div>
                <ToggleButton
                  onClick={() => {
                    setSearch(search === '_others_' ? '' : '_others_');
                  }}
                  style={{ cursor: 'pointer' }}
                  className={`${classes.vaultTypeButton} ${search === '_others_' ? classes.othersSelected : classes.others}`}
                  value="Lockup"
                >
                  <FilterListIcon />
                  <Typography variant="h2">Other Top APYs</Typography>
                </ToggleButton>
                <Typography variant="h2" className={classes.headAmount}>
                  <Podium vaults={topVaultPerformers.otherVaults} isStableCoin={false} handlePopoverOpen={handlePopoverOpen} />
                </Typography>
              </div>
            </div>
          </Paper>
        </div>

        <div className={classes.vaultsContainer}>
          <div className={classes.vaultFilters}>
            <ToggleButtonGroup className={classes.vaultTypeButtons} value={versions} onChange={handleVersionsChanged}>
              <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Lockup') ? classes.lockupSelected : classes.lockup}`} value="Lockup">
                <Typography variant="body1">Lockup</Typography>
              </ToggleButton>
              <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('v2') ? classes.v2Selected : classes.v2}`} value="v2">
                <Typography variant="body1">V2</Typography>
              </ToggleButton>
              <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('v1') ? classes.v1Selected : classes.v1}`} value="v1">
                <Typography variant="body1">V1</Typography>
              </ToggleButton>
              <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Exp') ? classes.expSelected : classes.exp}`} value="Exp">
                <Typography variant="body1">Exp</Typography>
              </ToggleButton>
              <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Earn') ? classes.earnSelected : classes.earn}`} value="Earn">
                <Typography variant="body1">Earn</Typography>
              </ToggleButton>
              <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Active') ? classes.activeSelected : classes.active}`} value="Active">
                <Typography variant="body1">Active</Typography>
              </ToggleButton>
            </ToggleButtonGroup>
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
            <ToggleButtonGroup className={classes.layoutToggleButtons} value={layout} onChange={handleLayoutChanged} exclusive>
              <ToggleButton className={classes.layoutToggleButton} value={'grid'}>
                <AppsIcon />
              </ToggleButton>
              <ToggleButton className={classes.layoutToggleButton} value={'list'}>
                <ListIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
          <Grid container spacing={3}>
            {layout === 'grid' &&
              filteredVaults &&
              filteredVaults.length > 0 &&
              filteredVaults.map((vault, index) => {
                return <VaultCard key={index} vault={vault} account={account} />;
              })}
            {layout === 'list' && (
              <Grid item xs={12}>
                <Paper elevation={0} className={classes.tableContainer}>
                  <TableContainer>
                    <Table className={classes.investTable} aria-labelledby="tableTitle" size="medium" aria-label="enhanced table">
                      {renderVaultHeaders({
                        order: order,
                        orderBy: orderBy,
                        onRequestSort: handleRequestSort,
                      })}
                      <TableBody>
                        {filteredVaults &&
                          filteredVaults.length > 0 &&
                          filteredVaults.map((vault, index) => {
                            return <VaultAssetRow key={index} vault={vault} account={account} />;
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            )}
          </Grid>
        </div>
      </div>
    </Layout>
  );
}

export default Invest;
