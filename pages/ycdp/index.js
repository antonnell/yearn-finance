import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, InputAdornment, Tooltip } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import Head from 'next/head';
import Layout from '../../components/layout';
import YcdpOverview from '../../components/ycdpOverview';
import YcdpQuickAction from '../../components/ycdpQuickAction';
import YcdpTable from '../../components/ycdpTable';

import classes from './ycdp.module.css';

import stores from '../../stores/index.js';
import { CDP_UPDATED } from '../../stores/constants';
import { formatCurrency } from '../../utils';

function YCDP({ changeTheme }) {

  const [cdpAssets, setCDPAssets] = useState([{}, {}, {}]);
  const [cdps, setCDPs] = useState(null);
  const [cdpSupplied, setCDPSuppled] = useState(null);
  const [cdpMinted, setCDPMinted] = useState(null);
  const [borrowAsset, setBorrowAsset] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(function () {
    const cdpUpdated = () => {
      setCDPAssets(stores.cdpStore.getStore('cdpAssets'));
      setCDPs(stores.cdpStore.getStore('cdpActive'));
      setCDPSuppled(stores.cdpStore.getStore('cdpSupplied'));
      setCDPMinted(stores.cdpStore.getStore('cdpMinted'));
      setBorrowAsset(stores.cdpStore.getStore('borrowAsset'));
    };

    //set default assets
    setCDPAssets(stores.cdpStore.getStore('cdpAssets'));
    setCDPs(stores.cdpStore.getStore('cdpActive'));
    setCDPSuppled(stores.cdpStore.getStore('cdpSupplied'));
    setCDPMinted(stores.cdpStore.getStore('cdpMinted'));
    setBorrowAsset(stores.cdpStore.getStore('borrowAsset')); 

    //register emitters
    stores.emitter.on(CDP_UPDATED, cdpUpdated);

    return () => {
      stores.emitter.removeListener(CDP_UPDATED, cdpUpdated);
    };
  }, []);

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>YCDP</title>
      </Head>
      <div className={classes.cdpContainer}>
        <YcdpOverview />
        <YcdpQuickAction />
        <div className={ classes.cdpTableContainer } >
          <YcdpTable cdpAssets={ cdpAssets } />
        </div>
      </div>
    </Layout>
  );
}

export default YCDP;
