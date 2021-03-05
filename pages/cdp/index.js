import React, { useState, useEffect } from 'react';

import {
  Typography,
  Paper,
} from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import classes from './cdp.module.css'

import stores from '../../stores/index.js'
import { CDP_UPDATED } from '../../stores/constants'
import { formatCurrency } from '../../utils'

function CDP({ changeTheme }) {
  const [ cdpAssets, setCDPAssets ] = useState(null)
  const [ cdps, setCDPs ] = useState(null)

  useEffect(function() {
    const cdpUpdated = () => {
      setCDPAssets(stores.cdpStore.getStore('cdpAssets'))
      setCDPs(stores.cdpStore.getStore('cdpActive'))
    }

    //set default assets
    setCDPAssets(stores.cdpStore.getStore('cdpAssets'))
    setCDPs(stores.cdpStore.getStore('cdpActive'))

    //register emitters
    stores.emitter.on(CDP_UPDATED, cdpUpdated)

    return () => {
      stores.emitter.removeListener(CDP_UPDATED, cdpUpdated)
    }
  },[]);

  const renderCDPs = () => {
    
  }

  const renderNoCDPs = () => {

  }

  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>CDP</title>
      </Head>
      <div>
        { (cdps && cdps.length) === 0 ? renderNoCDPs() : '' }
        { (cdps && cdps.length) > 0 ? renderCDPs() : '' }
      </div>
    </Layout>
  )
}

export default CDP
