import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, InputAdornment, Tooltip } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import CDPAllTable from '../../components/cdpAllTable';
import CDPActiveTable from '../../components/cdpActiveTable';
import CDPSuppliedGraph from '../../components/cdpSuppliedGraph';
import CDPMintedGraph from '../../components/cdpMintedGraph';

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

  const getStatus = (cdps) => {
    const cdpStatuses = cdps.map((cdp) => {
      return cdp.status;
    });
    return cdpStatuses.includes('Liquidatable')
      ? 'Liquidatable'
      : cdpStatuses.includes('Dangerous')
      ? 'Dangerous'
      : cdpStatuses.includes('Moderate')
      ? 'Moderate'
      : cdpStatuses.includes('Unknown')
      ? 'Unknown'
      : 'Safe';
  };

  const renderTooltipText = (status) => {
    let tooltipText = ''

    if(status === 'Safe') {
      tooltipText = 'Utilization Ratio under 75% is considered safe. It is unlikely that suddent market shifts will put your position at risk'
    } else if(status === 'Moderate') {
      tooltipText = 'Utilization Ratio above 75% under 90% is considered moderately safe. It is unlikely that suddent market shifts will put your position at risk'
    } else if(status === 'Dangerous') {
      tooltipText = 'Utilization Ratio above 90% is considered dangerous. It is possible that suddent market shifts will put your position at risk'
    } else if (status === 'Liquidatable') {
      tooltipText = 'Utilization Ratio above 100%. Your position is liquidatable, which means that people can sell your capital amount in order to recoup losses from the protocol.'
    } else if (status === 'Unknown') {
      tooltipText = 'Utilization Ratio is Unknown. This is most likely to occur when price oracles are out of date. Please manually ensure that your position is not comprimised.'
    }

    return tooltipText
  }

  const renderCDPs = () => {
    const status = getStatus(cdps);
    return (
      <div className={classes.fixtop}>
        <Paper elevation={0} className={classes.overviewContainer2}>
          <div className={classes.overviewCard}>
            <CDPSuppliedGraph assets={cdps} />
            <Tooltip title={ cdpSupplied === 'Unknown' ? 'Unable to calculate the supplied amount. This is most likely because the price oracle is out of date.' : 'Dollar value of the assets that you have supplied to the protocol' }>
              <div>
                <Typography variant="h2">Total Supplied</Typography>
                <Typography variant="h1" className={` ${classes.headAmount} ${cdpSupplied === 'Unknown' ? classes.statusWarning : null} `}>{ cdpSupplied === 'Unknown' ? 'Unknown' :  `$ ${formatCurrency(cdpSupplied)}`}</Typography>
              </div>
            </Tooltip>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <CDPMintedGraph assets={cdps} />
            <div>
              <Typography variant="h2">Total Borrowed</Typography>
              <Typography variant="h1" className={classes.headAmount}>{`$ ${formatCurrency(cdpMinted)}`}</Typography>
            </div>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Health</Typography>
              <Tooltip title={ renderTooltipText(status) }>
                <Typography
                  variant="h1"
                  className={
                    status === 'Liquidatable'
                      ? classes.statusLiquid
                      : ['Dangerous', 'Moderate', 'Unknown'].includes(status)
                      ? classes.statusWarning
                      : classes.statusSafe
                  }
                >
                  {status}
                </Typography>
              </Tooltip>
            </div>
          </div>
        </Paper>
        <div className={ classes.padded }>
          <Typography variant="h6" className={classes.tableHeader}>
            Your Active CDPs
          </Typography>
          <Paper elevation={0} className={classes.tableContainer}>
            <CDPActiveTable cdps={cdps} borrowAsset={borrowAsset} />
          </Paper>
          <Paper className={classes.cdpFilters}>
            <TextField
              className={classes.searchContainer}
              variant="outlined"
              fullWidth
              placeholder="ETH, CRV, ..."
              value={search}
              onChange={onSearchChanged}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Paper>
          <Typography variant="h6" className={classes.tableHeader}>
            All CDP Options
          </Typography>
          <Paper elevation={0} className={classes.tableContainer}>
            <CDPAllTable cdps={filteredCDPAssets} borrowAsset={borrowAsset} />
          </Paper>
        </div>
      </div>
    );
  };

  const renderNoCDPs = () => {
    return (
      <div className={classes.fixtop}>
      <Paper className={classes.cdpFilters}>
        <TextField
          className={classes.searchContainer}
          variant="outlined"
          fullWidth
          placeholder="ETH, CRV, ..."
          value={search}
          onChange={onSearchChanged}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
        <Paper elevation={0} className={classes.overviewContainer2}>
          <div className={classes.overviewCard}>
            <Typography variant="h1" className={classes.fillerContent}>
              Unit Protocol
            </Typography>
            <div className={classes.fillerText}>
              <Typography>Yearn CDP's are powered by Unit Protocol</Typography>
              <a href="https://docs.unit.xyz/" target="_blank">
                <Typography>Learn more</Typography>
              </a>
            </div>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <Typography variant="h1" className={classes.fillerContent}>
              About Unit
            </Typography>
            <Typography className={classes.fillerText}>
              Unit Protocol is a decentralized protocol that allows you to mint stablecoin $USDP using a variety of tokens as collateral.
            </Typography>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <Typography variant="h1" className={classes.fillerContent}>
              Get Started
            </Typography>
            <Typography className={classes.fillerText}>To get started with Yearn CDPs, click on the asset from the table below and open your CDP.</Typography>
          </div>
        </Paper>
        <div>

        </div>
        <Typography variant="h6" className={classes.tableHeader}>
          All CDP Options
        </Typography>
        <Paper elevation={0} className={classes.tableContainer}>
          <CDPAllTable cdps={filteredCDPAssets} borrowAsset={borrowAsset} />
        </Paper>
      </div>
    );
  };
  const filteredCDPAssets = cdpAssets.filter((asset) => {
    let returnValue = true;
    if (search && search !== '') {
      returnValue = asset.symbol?.toLowerCase().includes(search.toLowerCase()) || asset.tokenMetadata?.address?.toLowerCase().includes(search.toLowerCase());
    }
    return returnValue;
  });

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
