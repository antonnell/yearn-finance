import React, { useState, useEffect } from 'react';

import {
  Typography,
} from '@material-ui/core'

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import classes from './lend.module.css'

function Lend({ changeTheme }) {
  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Lend</title>
      </Head>
      <div className={ classes.comingSoon }>
        <Typography variant='h6'>Coming soon ...</Typography>
      </div>
    </Layout>
  )
}

export default Lend
