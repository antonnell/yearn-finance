import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../../../components/layout'
import {
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button
} from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import * as moment from 'moment';

import CoverActionCard from '../../../components/coverActionCard'
import CoverSummaryCard from '../../../components/coverSummaryCard'

import classes from './cover.module.css'

import stores from '../../../stores'
import {
  COVER_UPDATED,
  ACCOUNT_CHANGED
} from '../../../stores/constants'

function Cover(props) {

  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const router = useRouter()

  const storeAccount = stores.accountStore.getStore('account')
  const [ account, setAccount ] = useState(storeAccount)

  const storeCoverProtocol = stores.coverStore.getCoverProtocol(router.query.address)
  const [ coverProtocol, setCoverProtocol ] = useState(storeCoverProtocol)

  const backClicked = () => {
    router.push('/cover')
  }

  useEffect(() => {
    function coverProtocolsUpdated() {
      const c = stores.coverStore.getCoverProtocol(router.query.address)
      setCoverProtocol(c)
      forceUpdate()
    }

    stores.emitter.on(COVER_UPDATED, coverProtocolsUpdated)

    return () => {
      stores.emitter.removeListener(COVER_UPDATED, coverProtocolsUpdated)
    }
  }, [])

  useEffect(() => {
    const accountChanged = () => {
      const storeAccount = stores.accountStore.getStore('account')
      setAccount(storeAccount)
    }

    stores.emitter.on(ACCOUNT_CHANGED, accountChanged)
    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged)
    }
  }, [])

  function getLogoForProtocol(protocol) {
    if (!protocol) {
      return '/tokens/unknown-logo.png'
    }
    return `/cover/${protocol.toLowerCase()}_icon.png`
  }

  return (
    <Layout changeTheme={ props.changeTheme } backClicked={ backClicked }>
      <Head>
        <title>Cover</title>
      </Head>
      <div className={ classes.coverContainer }>
        <div className={ classes.coverInfoContainer }>
          <Paper elevation={2} className={ classes.coverSummaryCard }>
            <CoverActionCard coverProtocol={ coverProtocol } />
            <CoverSummaryCard coverProtocol={ coverProtocol } />
          </Paper>
          { coverProtocol.poolData && coverProtocol.poolData[0] && coverProtocol.poolData[0].collateralAsset &&
            <div className={ classes.coverInfo}>
              <Typography variant='h2' className={ classes.heading }>What are { coverProtocol.protocolDisplayName } Claim Tokens?</Typography>
              <Typography  className={ classes.paragraph }>Each { coverProtocol.protocolDisplayName } Claim Token will pay out 1 { coverProtocol.poolData[0].collateralAsset.symbol } in the event that there is a successful attack on the protocol before the expiration date ({ moment(coverProtocol.expires[0]*1000).format('Do MMM YYYY') })</Typography>
              <Typography variant='h2' className={ classes.heading }>What is covered?</Typography>
              <Typography className={ classes.paragraph }>During the coverage period (before the expiration date) if { coverProtocol.protocolDisplayName } suffers a hack, bug, exploit or economic manipulation attack, and that there’s a material loss of deposited funds from the { coverProtocol.protocolDisplayName } smart contract, or smart contract system with funds either moved to another address which the original owner(s) do not control, or the funds are made permanently irrecoverable. You will get back 1 { coverProtocol.poolData[0].collateralAsset.symbol } per each { coverProtocol.protocolDisplayName } Claim Token.</Typography>
            </div>
          }
        </div>

      </div>
    </Layout>
  )
}

export default Cover
