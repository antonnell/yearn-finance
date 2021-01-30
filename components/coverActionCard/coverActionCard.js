import React, { useState, useEffect } from 'react';
import { Typography, Paper, Tabs, Tab, TextField } from '@material-ui/core'
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js'
import { useRouter } from 'next/router'

import Buy from './buy'
import Sell from './sell'

import classes from './coverActionCard.module.css'

export default function CoverActionCard({ coverProtocol }) {

  const [ tabValue, setTabValue ] = useState(0)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={ 0 } className={ classes.vaultActionContainer }>
      <Tabs
        variant='fullWidth'
        value={ tabValue }
        onChange={ handleTabChange }
      >
        <Tab label="Buy" />
        <Tab label="Sell"  />
      </Tabs>
      { tabValue === 0 && (
        <Buy coverProtocol={ coverProtocol } />
      )}
      { tabValue === 1 && (
        <Sell coverProtocol={ coverProtocol } />
      )}
    </Paper>
  )
}
