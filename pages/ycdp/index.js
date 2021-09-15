import React, { useState, useEffect } from 'react';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import YcdpOverview from '../../components/ycdpOverview';
import YcdpQuickAction from '../../components/ycdpQuickAction';
import YcdpTable from '../../components/ycdpTable';

import classes from './ycdp.module.css';

import stores from '../../stores/index.js';
import { CDP_UPDATED } from '../../stores/constants';

function YCDP({ changeTheme }) {

  const [cdpAssets, setCDPAssets] = useState([{}, {}, {}]);

  useEffect(function () {
    const cdpUpdated = () => {
      setCDPAssets(stores.cdpStore.getStore('cdpAssets'));
    };

    //set default assets
    setCDPAssets(stores.cdpStore.getStore('cdpAssets'));

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
