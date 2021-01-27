import React, { useState, useEffect } from 'react';

import {
  Typography,
} from '@material-ui/core'

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import classes from './stats.module.css'

function Stats({ changeTheme }) {
  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Stats</title>
      </Head>
      <div className={ classes.comingSoon }>
        <Typography variant='h6'>Coming soon ...</Typography>
      </div>
    </Layout>
  )
}

export default Stats
