import { Typography, Paper } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'
import { useRouter } from 'next/router'
import { formatCurrency } from '../../utils'

import classes from './vaultCard.module.css'

export default function VaultCard({ vault, account }) {
  const router = useRouter()

  function handleNavigate() {
    router.push('/invest/'+vault.address)
  }

  const activeVault = BigNumber(vault.balance).gt(0)

  const vaultType = (vault.type === 'v2' && !vault.endorsed) ? 'Exp' : vault.type

  let vaultTypeClass = null
  switch (vaultType) {
    case 'v1':
      vaultTypeClass = classes.vaultV1VersionContainer
      break;
    case 'v2':
      vaultTypeClass = classes.vaultV2VersionContainer
      break;
    case 'Exp':
      vaultTypeClass = classes.vaultExpVersionContainer
      break;
    case 'Earn':
      vaultTypeClass = classes.vaultEarnVersionContainer
      break;
    default:
      vaultTypeClass = classes.vaultVersionContainer
      break;
  }

  return (
    <Paper elevation={ 0 } className={ activeVault ? classes.vaultContainerActive : classes.vaultContainer } onClick={ handleNavigate }>
      <div className={ classes.vaultTitle }>
        <div className={ classes.vaultLogo }>
          <img src={ vault.icon ? vault.icon : '/tokens/unknown-logo.png' } alt='' width={ 50 } height={ 50 } />
        </div>
        <div className={ classes.vaultName}>
          <Typography variant='h2' className={ classes.fontWeightBold }>{ vault.displayName }</Typography>
        </div>
        <div>
          <div className={ vaultTypeClass }>
            <Typography  className={ classes.vaultVersionText }>{ (vault.type === 'v2' && !vault.endorsed) ? 'Exp' : vault.type }</Typography>
          </div>
        </div>
      </div>
      <div className={ classes.separator }></div>
      <div className={ classes.vaultInfo }>
        {
          activeVault && (
            <div className={ classes.vaultInfoField }>
              <Typography variant='h2' className={ classes.fontWeightBold }>{ !(vault && vault.balance) ? <Skeleton /> : ('$ ' + formatCurrency(BigNumber(vault.balance).times(vault.pricePerFullShare).times(vault.tokenMetadata.priceUSD))) }</Typography>
              <Typography variant='body1'>Balance</Typography>
            </div>
          )
        }
        {
          !activeVault && account && account.address && (
            <div className={ classes.vaultInfoField }>
              <Typography variant='h2' className={ classes.fontWeightBold }>{ !(vault && vault.tokenMetadata && vault.tokenMetadata.balance) ? <Skeleton /> : (formatCurrency(vault.tokenMetadata.balance) + ' ' + vault.tokenMetadata.displayName ) }</Typography>
              <Typography variant='body1'>Available to deposit</Typography>
            </div>
          )
        }
        <div className={ classes.vaultInfoField }>
          <Typography variant='h2' className={ classes.fontWeightBold }>{ !(vault.apy) ? <Skeleton /> :  ( vault.apy.oneMonthSample ? (BigNumber(vault.apy.oneMonthSample).times(100).toFixed(2) + '%') : 'Unknown') }</Typography>
          <Typography variant='body1'>Yearly Growth</Typography>
        </div>
      </div>
    </Paper>
  )
}
