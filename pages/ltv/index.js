import React, { useState, useEffect } from 'react';

import { Typography, Paper, TextField, Grid, InputAdornment } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Head from 'next/head';
import Layout from '../../components/layout';
import classes from './ltv.module.css';

import stores from '../../stores/index.js';
import { GET_MAX, MAX_RETURNED} from '../../stores/constants';

import Lottie from "lottie-react";
import ltvsearchanim from "../../public/lottiefiles/ltv-anim-2.json";

function LTV({ changeTheme }) {
  const [asset, setAsset] = useState('');
  const [web3, setWeb3] = useState(stores.accountStore.getWeb3Provider());
  const [assets, setAssets] = useState([]);
  const [assetDetails, setAssetDetails] = useState(null);

  useEffect(async function () {
    // setWeb3(stores.accountStore.getWeb3Provider());
    setAssets(stores.ltvStore.getStore('assets'));
  }, []);

  useEffect(function () {
    const maxReturned = (maxVals) => {
      console.log(maxVals);
      setAssetDetails(maxVals);
    };

    stores.emitter.on(MAX_RETURNED, maxReturned);

    return () => {
      stores.emitter.removeListener(MAX_RETURNED, maxReturned);
    };
  }, []);

  const onPoolSelectChange = (event, theOption) => {
    setAsset(theOption);

    stores.dispatcher.dispatch({
      type: GET_MAX,
      content: { address: theOption.address },
    });
  };



  console.log()
  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>LTV</title>
      </Head>
        <div className={classes.ltvContainer}>
          <Grid className={classes.ltvgrid} container spacing={0}>
            <Grid item xl={4} lg={4} xs={12}>
              <div className={classes.copyContainer}>
                <Typography variant="h1" className={classes.titleSpacing}>
                  LTV Lookup
                </Typography>
                <Typography variant="h5" className={classes.lineHeightIncrease}>
                  The LTV 'Loan to Value' Lookup displays how much you can borrow per $1 worth of the asset provided to the different protocols.
                </Typography>
                <Lottie className={classes.ltvanim} animationData={ltvsearchanim} />
              </div>
            </Grid>
            <Grid item xl={8} lg={8} xs={12}>
              <Paper elevation={0} className={classes.searchContainer}>
                <div className={classes.textField}>
                  <div className={classes.inputTitleContainer}>
                    <div className={classes.inputTitle}>
                      <Typography variant="h5" noWrap>
                        Select Asset:
                      </Typography>
                    </div>
                  </div>
                  <Autocomplete
                    disableClearable={true}
                    options={assets}
                    value={asset}
                    onChange={onPoolSelectChange}
                    getOptionLabel={(option) => option.symbol}
                    fullWidth={true}
                    renderOption={(option) => (
                      <React.Fragment>
                        {/* <img
                          src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3.utils.toChecksumAddress(
                            option.address,
                          )}/logo.png`}
                          alt=""
                          width={30}
                          height={30}
                          style={{ marginRight: '10px' }}
                        /> */}
                        <span className={classes.color} style={{ backgroundColor: option.color }} />
                        <div className={classes.text}>
                          {option.symbol}
                          <br />
                        </div>
                      </React.Fragment>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        InputProps={{
                          ...params.InputProps,
                          ...{
                            placeholder: 'ETH, BTC, YFI...',
                            startAdornment: asset && (
                              <InputAdornment position="start">
                                {/* <img
                                  src={
                                    asset &&
                                    `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${web3.utils.toChecksumAddress(
                                      asset.address,
                                    )}/logo.png`
                                  }
                                  alt=""
                                  width={30}
                                  height={30}
                                /> */}
                              </InputAdornment>
                            ),
                          },
                        }}
                        variant="outlined"
                      />
                    )}
                  />
                </div>
                <div className={classes.pairs}>
                  <div className={classes.pair}>
                    <Typography>cream.finance</Typography>
                    <Typography className={classes.amount}>{assetDetails ? assetDetails.cream : 0} %</Typography>
                  </div>
                  <div className={classes.pair}>
                    <Typography>yearn.fi/lend</Typography>
                    <Typography className={classes.amount}>{assetDetails ? assetDetails.ironBank : 0} %</Typography>
                  </div>
                  <div className={classes.pair}>
                    <Typography>compound.finance</Typography>
                    <Typography className={classes.amount}>{assetDetails ? assetDetails.compound : 0} %</Typography>
                  </div>
                  <div className={classes.pair}>
                    <Typography>aave.com v1</Typography>
                    <Typography className={classes.amount}>{assetDetails ? assetDetails.aave1 : 0} %</Typography>
                  </div>
                  <div className={classes.pair}>
                    <Typography>aave.com v2</Typography>
                    <Typography className={classes.amount}>{assetDetails ? assetDetails.aave2 : 0} %</Typography>
                  </div>
                  <div className={classes.pair}>
                    <Typography>yearn.fi/cdp</Typography>
                    <Typography className={classes.amount}>{assetDetails ? assetDetails.unit : 0} %</Typography>
                  </div>
                </div>
              </Paper>
            </Grid>
          </Grid>
      </div>
    </Layout>
  );
}

export default LTV;
