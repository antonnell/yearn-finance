import { Typography, Paper } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'
import { useRouter } from 'next/router'
import { formatCurrency, formatAddress } from '../../utils'
import * as moment from 'moment';

import classes from './coverCard.module.css'

export default function CoverCard({ cover, account }) {
  const router = useRouter()

  function handleNavigate() {
    router.push('/cover/'+cover.protocolAddress)
  }

  function getLogoForProtocol(protocol) {
    if (!protocol) {
      return '/tokens/unknown-logo.png'
    }
    return `/cover/${protocol.toLowerCase()}_icon.png`
  }

  const covered = cover.poolData.filter((c) => {
    return c.claimAsset ? c.claimAsset.balance > 0 : false
  })

  return (
    <Paper elevation={ 0 } className={ covered.length > 0 ? classes.coverContainerActive : classes.coverContainer } onClick={ handleNavigate }>
      <div className={ classes.coverTitle }>
        <div className={ classes.coverLogo }>
          <img src={ getLogoForProtocol(cover.name) } onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}} alt='' width={ 50 } height={ 50 } />
        </div>
        <div className={ classes.coverName}>
          <Typography variant='h2' className={ classes.fontWeightBold }>{ cover.protocolDisplayName }</Typography>
          <Typography variant='subtitle1' color='textSecondary'>{ cover.protocolUrl }</Typography>
        </div>
      </div>
      <div className={ classes.coverProtocols}>
        <div className={ classes.liquidityInfo }>
          <Typography variant='h5'>$ { formatCurrency(cover.poolData[cover.poolData.length-1].claimPoolData.liquidity) }</Typography>
          <Typography variant='subtitle1'>Claim available</Typography>
        </div>
        <div className={ classes.liquidityInfo }>
          <Typography variant='h5'>$ { formatCurrency(cover.poolData[cover.poolData.length-1].noClaimPoolData.liquidity) }</Typography>
          <Typography variant='subtitle1'>No Claim available</Typography>
        </div>
      </div>
      { covered.length > 0 && (<div className={ classes.coveredInfo }>
        <Typography variant='h5'>Covered until { moment(cover.expires[cover.expires.length-1]*1000).format('YYYY/MM/DD') }</Typography>
        </div>)
      }
      { covered.length === 0 && (<div className={ classes.notCoveredInfo }>
        <Typography variant='h5'>Purchase cover</Typography>
        </div>)
      }
    </Paper>
  )
}
