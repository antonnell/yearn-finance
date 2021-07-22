import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, InputAdornment, Tooltip } from '@material-ui/core';
import Link from '@material-ui/core/Link';

import FlashOffOutlinedIcon from '@material-ui/icons/FlashOffOutlined';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';

import classes from './cdp.module.css';

import stores from '../../stores/index.js';
import { CDP_UPDATED } from '../../stores/constants';
import { formatCurrency } from '../../utils';

function CDP({ changeTheme }) {
  const [cdpAssets, setCDPAssets] = useState([]);
  const [cdps, setCDPs] = useState(null);
  const [cdpSupplied, setCDPSuppled] = useState(null);
  const [cdpMinted, setCDPMinted] = useState(null);
  const [borrowAsset, setBorrowAsset] = useState(null);
  const [search, setSearch] = useState('');
  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

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

  const renderCDPs = () => {
    const status = getStatus(cdps);
    return (
      <div>
        <Paper elevation={0} className={classes.cdpHoldingPage}>
          <div>
            <FlashOffOutlinedIcon className={classes.cdpHoldingIcon} />
            <Typography variant="h2" className={classes.cdpHoldingTitle}>
              Our CDP section is evolving!
            </Typography>
            <Typography variant="body2" className={classes.cdpHoldingTxt}>
              Please&nbsp;
              <Link
              className={classes.cdpHoldingLink}
              onClick={() => {
                window.open("https://unit.xyz/", "_blank")
              }}
              >visit unit.xyz</Link> to access or manage your CDP directly for now.
            </Typography>
            <Link
              className={classes.cdpHoldingBtn}
              component="button"
              variant="h2"
              onClick={() => {
                window.open("https://unit.xyz/", "_blank")
              }}
            >
              Visit Unit.xyz
            </Link>
          </div>
        </Paper>
      </div>
    );
  };

  const renderNoCDPs = () => {
    return (
      <div>
        <Paper elevation={0} className={classes.cdpHoldingPage}>
          <div>
            <FlashOffOutlinedIcon className={classes.cdpHoldingIcon} />
            <Typography variant="h2" className={classes.cdpHoldingTitle}>
              Our CDP section is evolving!
            </Typography>
            <Typography variant="body2" className={classes.cdpHoldingTxt}>
              Please&nbsp;
              <Link
              className={classes.cdpHoldingLink}
              onClick={() => {
                window.open("https://unit.xyz/", "_blank")
              }}
              >visit unit.xyz</Link> to access or manage your CDP directly for now.
            </Typography>
            <Link
              className={classes.cdpHoldingBtn}
              component="button"
              variant="h2"
              onClick={() => {
                window.open("https://unit.xyz/", "_blank")
              }}
            >
              Visit Unit.xyz
            </Link>
          </div>
        </Paper>
      </div>
    );
  };

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>CDP</title>
      </Head>
      <div className={classes.cdpContainer}>
        {cdps?.length === 0 ? renderNoCDPs() : ''}
        {cdps?.length > 0 ? renderCDPs() : ''}
      </div>
    </Layout>
  );
}

export default CDP;
