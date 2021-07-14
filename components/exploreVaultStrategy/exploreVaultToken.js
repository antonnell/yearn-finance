import { Typography, Paper } from '@material-ui/core';
import BigNumber from "bignumber.js";

import AddIcon from '@material-ui/icons/Add';
import { formatCurrency } from "../../utils";
import classes from './exploreVaultStrategy.module.css';

export default function Token({ token, web3, parentType, parentBalance }) {

  let icon = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3 && web3.utils ? web3.utils.toChecksumAddress(token.address) : token.address}/logo.png`
  if(token.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    icon = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png`
  } else if(token.isCurveToken) {
    icon = '/protocols/Curve.png'
  } else if (token.isCreamToken) {
    icon = '/protocols/Cream.png'
  } else if (token.isAaveToken) {
    icon = '/protocols/AAVE.png'
  } else if (token.isIEarnToken) {
    icon = '/protocols/yfi-192x192.png'
  } else if (token.isCompoundToken) {
    icon = '/protocols/compound-finance.png'
  } else if (token.isYVaultToken) {
    icon = '/protocols/yfi-192x192.png'
  }

  let ourBalance = token.balanceUSD
  if(parentType === 'Curve') {
    ourBalance = BigNumber(parentBalance).times(token.protocolRatio).div(100).toNumber(10)
  } else if(['Cream', 'Compound', 'Aave', 'IEarn', 'Yearn'].includes(parentType)) {
    ourBalance = BigNumber(parentBalance).toNumber(10)
  }

  return (
    <Paper elevation={0} className={ classes.tokenContainer} key={ token.address } >
      <div className={ classes.tokenTitleSection }>
        <img src={ icon } alt={ token.symbol } width='40px' height='40px' className={ classes.tokenLogo } />
        <div>
          <Typography variant='h2'>{token.symbol}</Typography>
          <Typography variant='subTitle' color='textSecondary' className={ classes.strategyDescription } noWrap>
            $ {formatCurrency(ourBalance) }
          </Typography>
        </div>
      </div>
      {
        ( token.isCreamToken || token.isCompoundToken || token.isAaveToken || token.isIEarnToken || token.isYVaultToken || token.isCurveToken ) &&
        <div className={ classes.tokenChild }>
          { token.isCreamToken && <Token token={ token.creamUnderlyingToken } web3={web3} parentType={ 'Cream' } parentBalance={ ourBalance } /> }
          { token.isCompoundToken && <Token token={ token.compoundUnderlyingToken } web3={web3} parentType={ 'Compound' } parentBalance={ ourBalance }  /> }
          { token.isAaveToken && <Token token={ token.aaveUnderlyingToken } web3={web3} parentType={ 'Aave' } parentBalance={ ourBalance }  /> }
          { token.isIEarnToken && <Token token={ token.iEarnUnderlingToken } web3={web3} parentType={ 'IEarn' } parentBalance={ ourBalance } /> }
          { token.isYVaultToken && <Token token={ token.yVaultUnderlyingToken } web3={web3} parentType={ 'Yearn' } parentBalance={ ourBalance } /> }
          { token.isCurveToken &&
            <div className={ classes.curveTokenContainer }>
              {
                token.curveUnderlyingTokens.map((curveUnderlyingToken, index) => {
                  return (
                    <>
                      <Token token={ curveUnderlyingToken } web3={web3} parentType={ 'Curve' } parentBalance={ ourBalance } />
                      { index < (token.curveUnderlyingTokens.length - 1) &&
                        <div className={ classes.plusIcon }>
                          <AddIcon />
                        </div>
                      }
                    </>
                  )
                })
              }
            </div>
          }
        </div>
      }
    </Paper>
  )

}
