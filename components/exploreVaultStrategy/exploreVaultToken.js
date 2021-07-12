import { Typography, Paper } from '@material-ui/core';


export default function Token({ token, web3 }) {

  let icon = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3 && web3.utils ? web3.utils.toChecksumAddress(token.address) : token.address}/logo.png`
  if(token.isCurveToken) {
    icon = '/protocols/curve.png'
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

  return (
    <Paper elevation={0} className={ classes.tokenContainer} >
      <div className={ classes.strategyTitleSection }>
        <img src={ icon } alt={ token.symbol } width='40px' height='40px' className={ classes.tokenLogo } />
        <div>
          <Typography variant='h2'>{token.symbol}</Typography>
          <Typography>$ {formatCurrency(token.balance)}</Typography>
        </div>
      </div>
      { token.isCreamToken && <Token token={ token.creamUnderlyingToken } web3={web3} /> }
      { token.isCompoundToken && <Token token={ token.compoundUnderlyingToken } web3={web3} /> }
      { token.isAaveToken && <Token token={ token.aaveUnderlyingToken } web3={web3} /> }
      { token.isIEarnToken && <Token token={ token.iEarnUnderlingToken } web3={web3} /> }
      { token.isYVaultToken && <Token token={ token.yVaultUnderlyingToken } web3={web3} /> }
      { token.isCurveToken &&
        <div className={ classes.curveTokenContainer }>
          {
            token.curveUnderlyingTokens.map((curveUnderlyingToken) => {
              return <Token token={ curveUnderlyingToken } web3={web3} />
            })
          }
        </div>
      }
    </Paper>
  )

}
