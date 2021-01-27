import React, { useState, useEffect } from 'react';

import Head from 'next/head'
import Layout from '../../components/layout/layout.js'
import classes from './insure.module.css'

function Insure({ changeTheme }) {
  return (
    <Layout changeTheme={ changeTheme }>
      <Head>
        <title>Insure</title>
      </Head>
      Insure Screen
    </Layout>
  )
}

export default Insure
