import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, InputAdornment, Grid, Button } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import classes from './system.module.css';
import BigNumber from 'bignumber.js';
import { withTheme } from '@material-ui/core/styles';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import SystemFilters from '../../components/systemFilters';
import SystemProtocolsGraph from '../../components/systemProtocolsGraph';
import SystemStrategiesGraph from '../../components/systemStrategiesGraph';
import SystemVaultsGraph from '../../components/systemVaultsGraph';
import SystemAssetsGraph from '../../components/systemAssetsGraph';

import stores from '../../stores/index.js';
import { VAULTS_UPDATED, LEND_UPDATED, SYSTEM_UPDATED } from '../../stores/constants';

import { formatCurrency } from '../../utils';

const mapTokenToBalance = (token) => {
  if(token.isYVaultToken) {
    if(token.yVaultUnderlingToken.isCurveToken) {
      // return all curveUnderlyingTokens
      return token.yVaultUnderlingToken.curveUnderlyingTokens.map((underlyingToken) => {
        if (underlyingToken.isIEarnToken) {
          return {
            balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(token.yVaultUnderlingToken.exchangeRate).times(underlyingToken.iEarnUnderlingToken.exchangeRate).toNumber(),
            name: underlyingToken.iEarnUnderlingToken.symbol
          }

        } else if (underlyingToken.isCreamToken) {
          return {
            balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(token.yVaultUnderlingToken.exchangeRate).times(underlyingToken.creamUnderlyingToken.exchangeRate).toNumber(),
            name: underlyingToken.creamUnderlyingToken.symbol
          }

        } else {
          return {
            balance: BigNumber(token.balance).times(token.price).times(token.yVaultUnderlingToken.exchangeRate).times(underlyingToken.protocolRatio).div(100).toNumber(),
            name: underlyingToken.symbol
          }
        }
      })

    } else {
      return {
        balance: BigNumber(token.balance).times(token.price).times(token.yVaultUnderlingToken.exchangeRate).toNumber(),
        name: token.yVaultUnderlingToken.symbol
      }
    }
  } else if(token.isCurveToken) {
    // return all curveUnderlyingTokens
    return token.curveUnderlyingTokens.map((underlyingToken) => {
      if(underlyingToken.isCurveToken) {
        // return all curveUnderlyingTokens
        return underlyingToken.curveUnderlyingTokens.map((underlyingToken1) => {
          if (underlyingToken1.isIEarnToken) {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).times(underlyingToken1.iEarnUnderlingToken.exchangeRate).toNumber(),
              name: underlyingToken1.iEarnUnderlingToken.symbol
            }

          } else if (underlyingToken1.isCreamToken) {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).times(underlyingToken1.creamUnderlyingToken.exchangeRate).toNumber(),
              name: underlyingToken1.creamUnderlyingToken.symbol
            }

          } else if (underlyingToken1.isCompoundToken) {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).times(underlyingToken1.compoundUnderlyingToken.exchangeRate).toNumber(),
              name: underlyingToken1.compoundUnderlyingToken.symbol
            }

          } else {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).toNumber(),
              name: underlyingToken1.symbol
            }
          }
        })
      } else if (underlyingToken.isIEarnToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(underlyingToken.iEarnUnderlingToken.exchangeRate).toNumber(),
          name: underlyingToken.iEarnUnderlingToken.symbol
        }

      } else if (underlyingToken.isCompoundToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).toNumber(),
          name: underlyingToken.compoundUnderlyingToken.symbol
        }

      } else if (underlyingToken.isCreamToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).toNumber(),
          name: underlyingToken.creamUnderlyingToken.symbol
        }

      } else {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).toNumber(),
          name: underlyingToken.symbol
        }
      }
    })

  } else if (token.isIEarnToken) {
    //return iEarnUnderlingToken
    return {
      balance: BigNumber(token.balance).times(token.price).times(token.iEarnUnderlingToken.exchangeRate).toNumber(),
      name: token.iEarnUnderlingToken.symbol
    }

  } else if (token.isCompoundToken) {
    //return compoundUnderlyingToken
    return {
      balance: BigNumber(token.balance).times(token.price).toNumber(),
      name: token.compoundUnderlyingToken.symbol
    }

  } else if (token.isAaveToken) {
    return {
      balance: BigNumber(token.balance).times(token.price).times(token.aaveUnderlyingToken.exchangeRate).toNumber(),
      name: token.aaveUnderlyingToken.symbol
    }
  } else {
    return {
      balance: BigNumber(token.balance).times(token.price).toNumber(),
      name: token.symbol
    }
  }
}

const mapSystemJsonToAssets = (json, filters) => {
  console.log(filters)
  if(!json) {
    return []
  }
  return json
    .filter((asset) => {
      if(!filters || !filters.search || !filters.search || filters.search.address === '') {
        return true
      }

      return filters.search.address === asset.address
    })
    .map((asset) => {
      return asset.strategies
    })
    .flat()
    .map((strategy) => {
      return strategy.protocols
    })
    .flat()
    .map((protocol) => {
      return protocol.tokens
    })
    .flat()
    .map(mapTokenToBalance)
    .flat(2)
    .reduce((assets, asset) => {
      try {
        if(!assets) {
          assets = []
        }
        const index = assets.findIndex((as) => as.name === asset.name)
        if(index === -1) {
          assets.push({
            name: asset.name,
            balance: BigNumber(asset.balance).toNumber(),
          })
        } else {
          assets[index].balance = BigNumber(assets[index].balance).plus(asset.balance).toNumber()
        }

        return assets
      } catch(ex) {
        console.log(ex)
        return []
      }
    }, [])
    .sort((firstEl, secondEl) => {
      if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
        return 1
      } else {
        return -1
      }
    })
}
const mapSystemJsonToProtocols = (json, filters) => {
  if(!json) {
    return []
  }
  return json
    .filter((asset) => {
      if(!filters || !filters.search || !filters.search || filters.search.address === '') {
        return true
      }

      return filters.search.address === asset.address
    })
    .map((asset) => {
      return asset.strategies
    })
    .flat()
    .map((strategy) => {
      return strategy.protocols
    })
    .flat()
    .reduce((protocols, protocol) => {
      try {
        if(!protocols) {
          protocols = []
        }
        const index = protocols.findIndex((pro) => pro.name === protocol.name)
        if(index === -1) {
          protocols.push({
            name: protocol.name,
            balance: BigNumber(protocol.balanceUSD).toNumber(),
          })
        } else {
          protocols[index].balance = BigNumber(protocols[index].balance).plus(protocol.balanceUSD).toNumber()
        }

        return protocols
      } catch(ex) {
        console.log(ex)
      }
    }, [])
    .sort((firstEl, secondEl) => {
      if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
        return 1
      } else {
        return -1
      }
    })
}
const mapSystemJsonToStrategies = (json, filters) => {
  if(!json) {
    return []
  }
  return json
    .filter((asset) => {
      if(!filters || !filters.search || !filters.search || filters.search.address === '') {
        return true
      }

      return filters.search.address === asset.address
    })
    .map((asset) => {
      return asset.strategies
    })
    .flat()
    .reduce((strategies, strategy) => {
      try {
        if(!strategies) {
          strategies = []
        }
        const index = strategies.findIndex((stra) => stra.name === strategy.name)
        if(index === -1) {
          strategies.push({
            name: strategy.name,
            balance: strategy.protocols
              .flat()
              .map((protocol) => {
                return protocol.tokens
              })
              .flat()
              .map(mapTokenToBalance)
              .flat(2)
              .reduce((acc, token) => {
                return BigNumber(acc).plus(token.balance).toNumber()
              }, 0),
            type: strategy.type
          })
        } else {
          strategies[index].balance = BigNumber(strategies[index].balance).plus(strategy.balanceUSD).toNumber()
        }

        return strategies
      } catch(ex) {
        console.log(ex)
      }
    }, [])
    .sort((firstEl, secondEl) => {
      if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
        return 1
      } else {
        return -1
      }
    })
}
const mapSystemJsonToVaults = (json, filters) => {
  if(!json) {
    return []
  }
  return json
    .filter((asset) => {
      if(!filters || !filters.search || !filters.search || filters.search.address === '') {
        return true
      }

      return filters.search.address === asset.address
    })
    .map((asset) => {
      return {
        address: asset.address,
        name: asset.display_name,
        balance: BigNumber(asset.tvl.tvl).toNumber()
      }
    })
    .sort((firstEl, secondEl) => {
      if(BigNumber(secondEl.balance).gt(firstEl.balance)) {
        return 1
      } else {
        return -1
      }
    })
}

function System({ changeTheme, theme }) {

  const [view, setView] = useState('overview')

  const [tvl, setTvl] = useState(null);
  const [ironBankTVL, setIronBankTVL] = useState(null);

  const [ filters, setFilters ] = useState({
    versions: [],
    search: '',
    layout: 'pie'
  });

  const [ allVaults, setAllVaults ] = useState([]);

  const [ assets, setAssets ] = useState([]);
  const [ protocols, setProtocols] = useState([]);
  const [ strategies, setStrategies] = useState([]);
  const [ vaults, setVaults ] = useState([]);

  useEffect(function () {
    const vaultsUpdated = () => {
      setTvl(stores.investStore.getStore('tvlInfo'));
    };

    const lendUpdated = () => {
      setIronBankTVL(stores.lendStore.getStore('ironBankTVL'));
    };

    const systemUpdated = () => {
      const systemJson = stores.investStore.getStore('systemJSON')

      setAssets(mapSystemJsonToAssets(systemJson, filters));
      setProtocols(mapSystemJsonToProtocols(systemJson, filters));
      setStrategies(mapSystemJsonToStrategies(systemJson, filters));
      setVaults(mapSystemJsonToVaults(systemJson, filters));
      setAllVaults(systemJson)
    };

    setTvl(stores.investStore.getStore('tvlInfo'));
    setIronBankTVL(stores.lendStore.getStore('ironBankTVL'));

    systemUpdated()

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);
    stores.emitter.on(LEND_UPDATED, lendUpdated);
    stores.emitter.on(SYSTEM_UPDATED, systemUpdated);

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
      stores.emitter.removeListener(LEND_UPDATED, lendUpdated);
      stores.emitter.removeListener(SYSTEM_UPDATED, systemUpdated);
    };
  }, []);

  const onFiltersChanged = (versions, search, layout) => {
    let fil = {
      versions,
      search,
      layout
    }
    setFilters(fil)

    const systemJson = stores.investStore.getStore('systemJSON')

    setAssets(mapSystemJsonToAssets(systemJson, fil));
    setProtocols(mapSystemJsonToProtocols(systemJson, fil));
    setStrategies(mapSystemJsonToStrategies(systemJson, fil));
    setVaults(mapSystemJsonToVaults(systemJson, fil));
  }

  const handleNavigate = (screen) => {
    setView(screen)
  }

  const renderOverview = () => {
    return (<div className={classes.graphsContainer}>
      <SystemVaultsGraph vaults={ vaults } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
      <SystemStrategiesGraph strategies={ strategies } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
      <SystemProtocolsGraph protocols={ protocols } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
      <SystemAssetsGraph assets={ assets } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
    </div>)

  }
  const renderProtocols = () => {
    return (
      <div className={classes.sectionContainer}>
        <div className={ classes.sectionHeader }>
          <div className={classes.backButton}>
            <Button color={theme.palette.type === 'light' ? 'primary' : 'secondary'} onClick={() => { handleNavigate('overview') }} disableElevation>
              <ArrowBackIcon fontSize={'medium'} />
            </Button>
          </div>
          <Typography variant='h1'>Protocols</Typography>
        </div>
        <div>

        </div>
      </div>
    )
  }
  const renderStrategies = () => {
    return (
      <div className={classes.sectionContainer}>
        <div className={ classes.sectionHeader }>
          <div className={classes.backButton}>
            <Button color={theme.palette.type === 'light' ? 'primary' : 'secondary'} onClick={() => { handleNavigate('overview') }} disableElevation>
              <ArrowBackIcon fontSize={'medium'} />
            </Button>
          </div>
          <Typography variant='h1'>Strategies</Typography>
        </div>
        <div>

        </div>
      </div>
    )
  }
  const renderVaults = () => {
    return (
      <div className={classes.sectionContainer}>
        <div className={ classes.sectionHeader }>
          <div className={classes.backButton}>
            <Button color={theme.palette.type === 'light' ? 'primary' : 'secondary'} onClick={() => { handleNavigate('overview') }} disableElevation>
              <ArrowBackIcon fontSize={'medium'} />
            </Button>
          </div>
          <Typography variant='h1'>Vaults</Typography>
        </div>
        <div>

        </div>
      </div>
    )
  }
  const renderAssets = () => {
    return (
      <div className={classes.sectionContainer}>
        <div className={ classes.sectionHeader }>
          <div className={classes.backButton}>
            <Button color={theme.palette.type === 'light' ? 'primary' : 'secondary'} onClick={() => { handleNavigate('overview') }} disableElevation>
              <ArrowBackIcon fontSize={'medium'} />
            </Button>
          </div>
          <Typography variant='h1'>Assets</Typography>
        </div>
        <div>

        </div>
      </div>
    )
  }

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>System</title>
      </Head>
      <Paper elevation={0} className={classes.overviewContainer2}>
        <Grid container spacing={0}>
          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Value Locked</Typography>
                <Typography variant="h1">
                  {!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(BigNumber(tvl.tvlUSD).plus(ironBankTVL), 0)}`}
                </Typography>
              </div>
            </div>
          </Grid>

          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Vault Balance</Typography>
                <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalVaultHoldingsUSD, 0)}`}</Typography>
              </div>
            </div>
          </Grid>

          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Earn Balance</Typography>
                <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalEarnHoldingsUSD, 0)}`}</Typography>
              </div>
            </div>
          </Grid>

          <Grid item xl={3} lg={3} md={6} sm={6} xs={12}>
            <div className={classes.overviewCard}>
              <div>
                <Typography variant="h2">Total Iron Bank Balance</Typography>
                <Typography variant="h1">{!ironBankTVL ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(ironBankTVL, 0)}`}</Typography>
              </div>
            </div>
          </Grid>
        </Grid>
      </Paper>
      <SystemFilters onFiltersChanged={ onFiltersChanged } vaults={ allVaults } />
      { view === 'overview' && renderOverview() }
      { view === 'protocols' && renderProtocols() }
      { view === 'strategies' && renderStrategies() }
      { view === 'vaults' && renderVaults() }
      { view === 'assets' && renderAssets() }
    </Layout>
  );
}

export default withTheme(System);
