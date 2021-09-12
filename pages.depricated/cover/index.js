import React, { useState, useEffect } from 'react';

import {
  Typography,
  TextField,
  InputAdornment
} from '@material-ui/core'
import BigNumber from 'bignumber.js'

import SearchIcon from '@material-ui/icons/Search';
import CoverCard from '../../components/coverCard'

import Head from 'next/head'
import Layout from '../../components/layout/layout'
import classes from './cover.module.css'

import stores from '../../stores/index.js'
import { COVER_UPDATED } from '../../stores/constants'

function Cover({ changeTheme }) {
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const account = stores.accountStore.getStore('account')
  const storeCoverProtocols = stores.coverStore.getStore('coverProtocols')
  const [ coverProtocols, setCoverProtocols ] = useState(storeCoverProtocols)
  const [ search, setSearch ] = useState('')

  const coverUpdated = () => {
    setCoverProtocols(stores.coverStore.getStore('coverProtocols'))
    forceUpdate()
  }

  useEffect(function() {
    stores.emitter.on(COVER_UPDATED, coverUpdated)

    return () => {
      stores.emitter.removeListener(COVER_UPDATED, coverUpdated)
    }
  },[]);

  const filteredCover = coverProtocols.filter((cover) => {
    if(cover.poolData.length === 0) {
      return false
    }

    if(search && search !== '') {
      return cover.name.toLowerCase().includes(search.toLowerCase())
    } else {
      return true
    }
  }).sort((a, b) => {

    const coveredA = a.poolData.filter((c) => {
      return c.claimAsset ? c.claimAsset.balance > 0 : false
    })

    const coveredB = b.poolData.filter((c) => {
      return c.claimAsset ? c.claimAsset.balance > 0 : false
    })

    if(BigNumber(coveredA.length).gt(coveredB.length)) {
      return -1
    } else if(BigNumber(coveredA.length).lt(coveredB.length)) {
      return 1
    }  else {
      return 0
    }
  })

  const onSearchChanged = (event) => {
    setSearch(event.target.value)
  }

  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Cover</title>
      </Head>
      <div className={ classes.coverContainer }>
        <Typography variant='h5' className={ classes.coverSectionTitle }>Find Cover</Typography>
        <TextField
          className={ classes.searchContainer }
          variant="outlined"
          fullWidth
          placeholder="ETH, CRV, ..."
          value={ search }
          onChange={ onSearchChanged }
          InputProps={{
            startAdornment: <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>,
          }}
        />
        {
          filteredCover && filteredCover.length > 0 && (
            filteredCover.map((cover, index) => {
              return <CoverCard key={ index } cover={ cover } />
            })
          )
        }
      </div>
    </Layout>
  )
}

export default Cover
