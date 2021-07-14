import React, { useState, useEffect } from 'react';
import { useRouter } from "next/router";

import { Typography, Paper, Button } from '@material-ui/core';
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
    if(token.yVaultUnderlyingToken.isCurveToken) {
      // return all curveUnderlyingTokens
      return token.yVaultUnderlyingToken.curveUnderlyingTokens.map((underlyingToken) => {
        if (underlyingToken.isIEarnToken) {
          return {
            balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(token.yVaultUnderlyingToken.exchangeRate).times(underlyingToken.iEarnUnderlingToken.exchangeRate).toNumber(),
            name: underlyingToken.iEarnUnderlingToken.symbol,
            description: underlyingToken.iEarnUnderlingToken.description
          }

        } else if (underlyingToken.isCreamToken) {
          return {
            balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(token.yVaultUnderlyingToken.exchangeRate).times(underlyingToken.creamUnderlyingToken.exchangeRate).toNumber(),
            name: underlyingToken.creamUnderlyingToken.symbol,
            description: underlyingToken.creamUnderlyingToken.description
          }

        } else {
          return {
            balance: BigNumber(token.balance).times(token.price).times(token.yVaultUnderlyingToken.exchangeRate).times(underlyingToken.protocolRatio).div(100).toNumber(),
            name: underlyingToken.symbol,
            description: underlyingToken.description
          }
        }
      })

    } else {
      return {
        balance: BigNumber(token.balance).times(token.price).times(token.yVaultUnderlyingToken.exchangeRate).toNumber(),
        name: token.yVaultUnderlyingToken.symbol,
        description: token.yVaultUnderlyingToken.description
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
              name: underlyingToken1.iEarnUnderlingToken.symbol,
              description: underlyingToken1.iEarnUnderlingToken.description
            }

          } else if (underlyingToken1.isCreamToken) {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).times(underlyingToken1.creamUnderlyingToken.exchangeRate).toNumber(),
              name: underlyingToken1.creamUnderlyingToken.symbol,
              description: underlyingToken1.creamUnderlyingToken.description
            }

          } else if (underlyingToken1.isCompoundToken) {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).times(underlyingToken1.compoundUnderlyingToken.exchangeRate).toNumber(),
              name: underlyingToken1.compoundUnderlyingToken.symbol,
              description: underlyingToken1.compoundUnderlyingToken.description
            }

          } else {
            return {
              balance: BigNumber(token.balance).times(underlyingToken.protocolRatio).div(100).times(token.price).times(underlyingToken1.protocolRatio).div(100).toNumber(),
              name: underlyingToken1.symbol,
              description: underlyingToken1.description
            }
          }
        })
      } else if (underlyingToken.isIEarnToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(underlyingToken.iEarnUnderlingToken.exchangeRate).toNumber(),
          name: underlyingToken.iEarnUnderlingToken.symbol,
          description: underlyingToken.iEarnUnderlingToken.description
        }

      } else if (underlyingToken.isCompoundToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(underlyingToken.compoundUnderlyingToken.exchangeRate).toNumber(),
          name: underlyingToken.compoundUnderlyingToken.symbol,
          description: underlyingToken.compoundUnderlyingToken.description
        }

      } else if (underlyingToken.isCreamToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(underlyingToken.creamUnderlyingToken.exchangeRate).toNumber(),
          name: underlyingToken.creamUnderlyingToken.symbol,
          description: underlyingToken.creamUnderlyingToken.description
        }

      } else if (underlyingToken.isAaveToken) {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).times(underlyingToken.aaveUnderlyingToken.exchangeRate).toNumber(),
          name: underlyingToken.aaveUnderlyingToken.symbol,
          description: underlyingToken.aaveUnderlyingToken.description
        }
      } else {
        return {
          balance: BigNumber(token.balance).times(token.price).times(underlyingToken.protocolRatio).div(100).toNumber(),
          name: underlyingToken.symbol,
          description: underlyingToken.description
        }
      }
    })

  } else if (token.isIEarnToken) {
    //return iEarnUnderlingToken
    return {
      balance: BigNumber(token.balance).times(token.price).times(token.iEarnUnderlingToken.exchangeRate).toNumber(),
      name: token.iEarnUnderlingToken.symbol,
      description: token.iEarnUnderlingToken.description
    }

  } else if (token.isCompoundToken) {
    //return compoundUnderlyingToken
    return {
      balance: BigNumber(token.balance).times(token.price).toNumber(),
      name: token.compoundUnderlyingToken.symbol,
      description: token.compoundUnderlyingToken.description
    }

  } else if (token.isAaveToken) {
    return {
      balance: BigNumber(token.balance).times(token.price).times(token.aaveUnderlyingToken.exchangeRate).toNumber(),
      name: token.aaveUnderlyingToken.symbol,
      description: token.aaveUnderlyingToken.description
    }
  } else {
    return {
      balance: BigNumber(token.balance).times(token.price).toNumber(),
      name: token.symbol,
      description: token.description
    }
  }
}

const mapSystemJsonToAssets = (json, filters) => {
  if(!json) {
    return []
  }
  return json
    .filter((asset) => {
      let returnVal = true

      if(filters) {
        if(filters.version && filters.version !== '') {
          if(filters.version.val === 'mine') {
            returnVal = BigNumber(asset.balanceUSD).gt(0)
          } else {
            returnVal = asset.type === filters.version.val
          }
        }

        if(filters.vault && filters.vault.address) {
          returnVal = filters.vault.address === asset.address
        }
      }
      return returnVal
    })
    .map((asset) => {
      return asset.strategies
    })
    .flat()
    .filter((strategy) => {
      if(filters) {
        if(filters.strategy && filters.strategy !== '') {
          return filters.strategy.name === strategy.name
        }
      }

      return true
    })
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
            description: asset.description
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
      let returnVal = true

      if(filters) {
        if(filters.version && filters.version !== '') {
          if(filters.version.val === 'mine') {
            returnVal = BigNumber(asset.balanceUSD).gt(0)
          } else {
            returnVal = asset.type === filters.version.val
          }
        }

        if(filters.vault && filters.vault.address) {
          returnVal = filters.vault.address === asset.address
        }
      }
      return returnVal
    })
    .map((asset) => {
      return asset.strategies
    })
    .flat()
    .filter((strategy) => {
      if(filters) {
        if(filters.strategy && filters.strategy !== '') {
          return filters.strategy.name === strategy.name
        }
      }

      return true
    })
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
            description: protocol.description
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
      let returnVal = true

      if(filters) {
        if(filters.version && filters.version !== '') {
          if(filters.version.val === 'mine') {
            returnVal = BigNumber(asset.balanceUSD).gt(0)
          } else {
            returnVal = asset.type === filters.version.val
          }
        }

        if(filters.vault && filters.vault.address) {
          returnVal = filters.vault.address === asset.address
        }
      }
      return returnVal
    })
    .map((asset) => {
      return asset.strategies
    })
    .flat()
    .filter((strategy) => {
      if(filters) {
        if(filters.strategy && filters.strategy !== '') {
          return filters.strategy.name === strategy.name
        }
      }

      return true
    })
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
            description: strategy.description
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
      let returnVal = true

      if(filters) {
        if(filters.version && filters.version !== '') {
          if(filters.version.val === 'mine') {
            returnVal = BigNumber(asset.balanceUSD).gt(0)
          } else {
            returnVal = asset.type === filters.version.val
          }
        }

        if(filters.vault && filters.vault.address) {
          returnVal = filters.vault.address === asset.address
        }
      }
      return returnVal
    })
    .map((asset) => {
      return {
        address: asset.address,
        name: asset.display_name,
        symbol: asset.depositToken.symbol,
        balance: BigNumber(asset.tvl.tvl).toNumber(),
        type: asset.type
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

  const router = useRouter();

  const [ tvl, setTvl ] = useState(null);
  const [ ironBankTVL, setIronBankTVL ] = useState(null);

  const [ filters, setFilters ] = useState({
    versions: '',
    search: '',
    strategy: '',
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

  const onFiltersChanged = (version, vault, strategy, layout) => {
    let fil = {
      version,
      vault,
      strategy,
      layout
    }
    setFilters(fil)

    const systemJson = stores.investStore.getStore('systemJSON')

    setAssets(mapSystemJsonToAssets(systemJson, fil));
    setProtocols(mapSystemJsonToProtocols(systemJson, fil));
    setStrategies(mapSystemJsonToStrategies(systemJson, fil));
    setVaults(mapSystemJsonToVaults(systemJson, fil));

    //set allVaults based on version that came in.

    if(version && version !== '') {
      setAllVaults(systemJson.filter((asset) => {
        let returnVal = true
        if(version && version !== '') {
          if(version.val === 'mine') {
            returnVal = BigNumber(asset.balanceUSD).gt(0)
          } else {
            returnVal = asset.type === version.val
          }
        }

        return returnVal
      }))
    } else {
      setAllVaults(systemJson)
    }
  }

  const handleNavigate = (screen, vv) => {
    router.push(`system/vault/${vv.address}`);
  }

  const renderOverview = () => {
    return (<div className={classes.graphsContainer}>
      <SystemVaultsGraph vaults={ vaults } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
      <SystemStrategiesGraph strategies={ strategies } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
      <SystemProtocolsGraph protocols={ protocols } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
      <SystemAssetsGraph assets={ assets } filters={ filters } layout={ filters.layout } handleNavigate={handleNavigate} />
    </div>)

  }

  const renderVault = () => {
    return (
      <div className={classes.sectionContainer}>
        <div className={ classes.sectionHeader }>
          <div className={classes.backButton}>
            <Button color={theme.palette.type === 'light' ? 'primary' : 'secondary'} onClick={() => { handleNavigate('overview') }} disableElevation>
              <ArrowBackIcon fontSize={'medium'} />
            </Button>
          </div>
          <Typography variant='h1'>Vault</Typography>
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
        <div className={ classes.headerGridContainer }>
          <div className={`${classes.overviewCard} ${classes.overviewDescription}`}>
            <div>
              <Typography variant='h6' className={ classes.systemTitleTitle }>Yearn Stats</Typography>
              <Typography variant='h2' className={ classes.systemTitleDescription }>View all of the protocols and assets involved with the Yearn system or just a specific vault type or vault and even down to an individual strategy.</Typography>
            </div>
          </div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Total Value Locked</Typography>
              <Typography variant="h1">
                {!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(BigNumber(tvl.tvlUSD).plus(ironBankTVL), 0)}`}
              </Typography>
            </div>
          </div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Total Vault Balance</Typography>
              <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalVaultHoldingsUSD, 0)}`}</Typography>
            </div>
          </div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Total Earn Balance</Typography>
              <Typography variant="h1">{!tvl ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(tvl.totalEarnHoldingsUSD, 0)}`}</Typography>
            </div>
          </div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Total Iron Bank Balance</Typography>
              <Typography variant="h1">{!ironBankTVL ? <Skeleton style={{ minWidth: '200px ' }} /> : `$ ${formatCurrency(ironBankTVL, 0)}`}</Typography>
            </div>
          </div>
        </div>
      </Paper>
      <SystemFilters onFiltersChanged={ onFiltersChanged } vaults={ allVaults } strategies={ strategies } />
      { renderOverview() }
    </Layout>
  );
}

export default withTheme(System);
