import React, { useState, useEffect } from "react";

import { Typography, Paper } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";

import Head from "next/head";
import Layout from "../../components/layout/layout.js";
import CDPAllTable from "../../components/cdpAllTable";
import CDPActiveTable from "../../components/cdpActiveTable";
import CDPSuppliedGraph from "../../components/cdpSuppliedGraph";
import CDPMintedGraph from "../../components/cdpMintedGraph";

import classes from "./cdp.module.css";

import stores from "../../stores/index.js";
import { CDP_UPDATED } from "../../stores/constants";
import { formatCurrency } from "../../utils";

function CDP({ changeTheme }) {
  const [cdpAssets, setCDPAssets] = useState(null);
  const [cdps, setCDPs] = useState(null);
  const [cdpSupplied, setCDPSuppled] = useState(null);
  const [cdpMinted, setCDPMinted] = useState(null);
  const [borrowAsset, setBorrowAsset] = useState(null);

  useEffect(function() {
    const cdpUpdated = () => {
      setCDPAssets(stores.cdpStore.getStore("cdpAssets"));
      setCDPs(stores.cdpStore.getStore("cdpActive"));
      setCDPSuppled(stores.cdpStore.getStore("cdpSupplied"));
      setCDPMinted(stores.cdpStore.getStore("cdpMinted"));
      setBorrowAsset(stores.cdpStore.getStore("borrowAsset"));
    };

    //set default assets
    setCDPAssets(stores.cdpStore.getStore("cdpAssets"));
    setCDPs(stores.cdpStore.getStore("cdpActive"));
    setCDPSuppled(stores.cdpStore.getStore("cdpSupplied"));
    setCDPMinted(stores.cdpStore.getStore("cdpMinted"));
    setBorrowAsset(stores.cdpStore.getStore("borrowAsset"));

    //register emitters
    stores.emitter.on(CDP_UPDATED, cdpUpdated);

    return () => {
      stores.emitter.removeListener(CDP_UPDATED, cdpUpdated);
    };
  }, []);

  const getStatus = cdps => {
    const cdpStatuses = cdps.map(cdp => {
      return cdp.status;
    });
    return cdpStatuses.includes("Liquidatable")
      ? "Liquidatable"
      : cdpStatuses.includes("Dangerous")
      ? "Dangerous"
      : cdpStatuses.includes("Moderate")
      ? "Moderate"
      : "Safe";
  };

  const renderCDPs = () => {
    const status = getStatus(cdps);
    return (
      <div>
        <Paper elevation={0} className={classes.overviewContainer}>
          <div className={classes.overviewCard}>
            <CDPSuppliedGraph assets={cdps} />
            <div>
              <Typography variant="h2">Total Supplied</Typography>
              <Typography
                variant="h1"
                className={classes.headAmount}
              >{`$ ${formatCurrency(cdpSupplied)}`}</Typography>
            </div>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <CDPMintedGraph assets={cdps} />
            <div>
              <Typography variant="h2">Total Borrowed</Typography>
              <Typography
                variant="h1"
                className={classes.headAmount}
              >{`$ ${formatCurrency(cdpMinted)}`}</Typography>
            </div>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <div>
              <Typography variant="h2">Health</Typography>
              <Typography
                variant="h1"
                className={
                  status === "Liquidatable"
                    ? classes.statusLiquid
                    : ["Dangerous", "Moderate"].includes(status)
                    ? classes.statusWarning
                    : classes.statusSafe
                }
              >
                {status}
              </Typography>
            </div>
          </div>
        </Paper>

        <Typography variant="h6" className={classes.tableHeader}>
          Your Active CDPs
        </Typography>
        <Paper elevation={0} className={classes.tableContainer}>
          <CDPActiveTable cdps={cdps} borrowAsset={borrowAsset} />
        </Paper>
        <Typography variant="h6" className={classes.tableHeader}>
          All CDP Options
        </Typography>
        <Paper elevation={0} className={classes.tableContainer}>
          <CDPAllTable cdps={cdpAssets} borrowAsset={borrowAsset} />
        </Paper>
      </div>
    );
  };

  const renderNoCDPs = () => {
    return (
      <div>
        <Paper elevation={0} className={classes.overviewContainer}>
          <div className={classes.overviewCard}>
            <Typography variant="h1" className={classes.fillerContent}>
              Unit
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
              About
            </Typography>
            <Typography className={classes.fillerText}>
              Unit Protocol is a decentralized protocol that allows you to mint
              stablecoin $USDP using a variety of tokens as collateral.
            </Typography>
          </div>
          <div className={classes.separator}></div>
          <div className={classes.overviewCard}>
            <Typography variant="h1" className={classes.fillerContent}>
              Start
            </Typography>
            <Typography className={classes.fillerText}>
              To get started with Yearn CDPs, click on the asset from the table
              below and open your CDP.
            </Typography>
          </div>
        </Paper>
        <Typography variant="h6" className={classes.tableHeader}>
          All CDP Options
        </Typography>
        <Paper elevation={0} className={classes.tableContainer}>
          <CDPAllTable cdps={cdpAssets} borrowAsset={borrowAsset} />
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
        {(cdps && cdps.length) === 0 ? renderNoCDPs() : ""}
        {(cdps && cdps.length) > 0 ? renderCDPs() : ""}
      </div>
    </Layout>
  );
}

export default CDP;
