import React, { useState, useEffect } from 'react';

import { Typography, Tooltip, Paper } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { ETHERSCAN_URL } from '../../stores/constants';
import { formatCurrency, formatAddress } from "../../utils";
import stores from '../../stores/index.js';

import classes from './exploreVaultStrategy.module.css';

import DescriptionIcon from '@material-ui/icons/Description';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import Token from './exploreVaultToken';

export default function exploreVaultStrategy({ strategy }) {

  const [web3, setWeb3] = useState(null);

  useEffect(async function () {
    setWeb3(await stores.accountStore.getWeb3Provider());
  }, []);

  const openContract = () => {
    window.open(`${ETHERSCAN_URL}address/${strategy.address}#code`)
  }

  const mapProtocolToIcon = (name) => {
    switch (name) {
      case 'Curve':
        return `/protocols/curve.png`
      case 'Convex':
        return `/protocols/convex.png`
      case 'Maker':
        return `/protocols/Mark_Maker.png`
      case 'Aave':
        return `/protocols/AAVE.png`
      case 'Idle.Finance':
        return `/protocols/idle-logo.png`
      case 'Compound':
        return `/protocols/compound-finance.png`
      case 'Vesper':
        return `/protocols/vesper_logo.png`
      case 'Alpha Homora':
        return `/protocols/AlphaToken_256x256.png`
      case 'PoolTogether':
        return `/protocols/PoolTogether.png`
      case 'KeeperDAO':
        return `/protocols/keeper_dao_logo.jpg`
      case 'Synthetix':
        return `/protocols/SNX.png`
      case '1INCH':
        return `/protocols/1inch-v2.png`
      case 'Cream':
        return `/protocols/Cream.png`
      case 'DyDx':
        return `/protocols/dydx-exchange.jpeg`
      case 'Fulcrum':
        return `/protocols/curve.png`
      case 'Yearn':
        return `/protocols/yfi-192x192.png`
      default:
        return `/protocols/curve.png`
    }
  }

  const renderProtocolTokens = (protocol) => {

    let isLender = false
    if(['Aave', 'Compound', 'Maker'].includes(protocol.name)) {
      isLender = true
    }

    return protocol.tokens.map((token, index) => {

      if(isLender) {
        return (
          <>
            <div className={ classes.lenderField }>
              <div className={ classes.lenderLabel }>
                <Typography className={ classes.text }>{ index === 0 ? 'Collateral' : 'Debt' }</Typography>
              </div>
              <Token token={ token } web3={web3} />
            </div>
            { (index === 0 && protocol.tokens.length > 1) &&
              <div className={ classes.arrowDownIcon }>
                <ArrowDownwardIcon />
              </div>
            }
          </>
        )
      }

      return <Token token={ token } web3={web3} />
    })
  }

  const renderProtocols = () => {
    return strategy.protocols.map((protocol) => {
      return (
        <Paper elevation={0} className={ classes.protocolContainer} key={protocol.name} >
          <div className={ classes.strategyTitleSection }>
            <div className={ classes.iconContainer }>
              <div className={ classes.protocolLabel }>
                <Typography className={ classes.text }>Protocol</Typography>
              </div>
              <img src={ mapProtocolToIcon(protocol.name) } alt={ protocol.name } width='60px' height='60px' className={ classes.protocolLogo } />
            </div>
            <div>
              <Typography variant='h2'>{protocol.name}</Typography>
              <Typography variant='subTitle' color='textSecondary' className={ classes.strategyDescription }>{protocol.description}</Typography>
            </div>
          </div>
          { renderProtocolTokens(protocol) }
        </Paper>
      )
    })
  }

  return (
    <Paper elevation={0} className={classes.strategyContainer}>
      <div className={ classes.strategyTitleSection }>
        <div className={ classes.iconContainer }>
          <div className={ classes.strategyLabel }>
            <Typography className={ classes.text }>Strategy</Typography>
          </div>
          <div className={ classes.strategyOutline} >
            <DescriptionIcon className={ classes.strategyIcon } />
          </div>
        </div>
        <div>
          <Typography variant='h2' onClick={ openContract } className={ classes.strategyTitle}>
            { strategy ? strategy.name : "Where is your name?"} ({ formatAddress(strategy.address) })
          </Typography>
          <Typography variant='subTitle' color='textSecondary' className={ classes.strategyDescription }>{strategy.description}</Typography>
          <Typography variant='h1'>
             $ { formatCurrency(strategy.balanceUSD) }
          </Typography>
        </div>
      </div>
      <Paper elevation={0} className={ classes.tokenContainer }>
        <Typography>
          { renderProtocols() }
        </Typography>
      </Paper>
    </Paper>
  );
}
