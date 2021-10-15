import React, { useState, useEffect } from 'react';
import { Typography, SvgIcon, Paper, TextField, InputAdornment, Tooltip, Grid, Link } from '@material-ui/core';
import { useRouter } from "next/router";
import Head from 'next/head';
import Layout from '../../components/layout/layout.js';
import LaunchIcon from '@material-ui/icons/Launch';
import classes from './learn.module.css';

function VaultsIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 48 48" stroke-width="1" className={className}>

    <g stroke-width="1.5" transform="translate(0, 0)"><rect x="2" y="2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="square" stroke-miterlimit="10" width="44" height="40" stroke-linejoin="miter"></rect> <line data-cap="butt" data-color="color-2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" x1="20.606" y1="18.606" x2="15.515" y2="13.515" stroke-linejoin="miter" stroke-linecap="butt"></line> <line data-cap="butt" data-color="color-2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" x1="27.394" y1="18.606" x2="32.485" y2="13.515" stroke-linejoin="miter" stroke-linecap="butt"></line> <line data-cap="butt" data-color="color-2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" x1="27.394" y1="25.394" x2="32.485" y2="30.485" stroke-linejoin="miter" stroke-linecap="butt"></line> <line data-cap="butt" data-color="color-2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-miterlimit="10" x1="20.606" y1="25.394" x2="15.515" y2="30.485" stroke-linejoin="miter" stroke-linecap="butt"></line> <circle data-color="color-2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="square" stroke-miterlimit="10" cx="24" cy="22" r="12" stroke-linejoin="miter"></circle> <circle data-color="color-2" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="square" stroke-miterlimit="10" cx="24" cy="22" r="4.8" stroke-linejoin="miter"></circle> <line fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" x1="10" y1="42" x2="10" y2="46" stroke-linejoin="miter"></line> <line fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" x1="38" y1="42" x2="38" y2="46" stroke-linejoin="miter"></line></g>

    </SvgIcon>
  );
}

function FaqIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 64 64" stroke-width="2" className={className}>

    <g stroke-width="2" transform="translate(0, 0)"><path d="M9,56V49.9a4,4,0,0,1,1.959-3.444C12.86,45.328,16.309,44,22,44s9.14,1.328,11.041,2.454A4,4,0,0,1,35,49.9V56" fill="none" stroke="#ffffff" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="miter"></path><path d="M15,31a7,7,0,0,1,14,0c0,3.866-3.134,8-7,8S15,34.866,15,31Z" fill="none" stroke="#ffffff" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="miter"></path><polyline points="28 14 2 14 2 56 56 56 56 30" fill="none" stroke="#ffffff" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2" stroke-linejoin="miter"></polyline><path d="M34,7V19a5,5,0,0,0,5,5h1v6l10-6h7a5,5,0,0,0,5-5V7a5,5,0,0,0-5-5H39A5,5,0,0,0,34,7Z" fill="none" stroke="#ffffff" stroke-linecap="square" stroke-miterlimit="10" stroke-width="2" data-color="color-2" stroke-linejoin="miter"></path></g>

    </SvgIcon>
  );
}

function RiskIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0 0 64 64" stroke-width="4" className={className}>

    <g stroke-width="8" transform="translate(0, 0)"><path d="M4.548,50.527,28.266,7.233a4.239,4.239,0,0,1,7.468,0L59.452,50.527A4.352,4.352,0,0,1,55.718,57H8.282A4.352,4.352,0,0,1,4.548,50.527Z" fill="none" stroke="#FFFFFF" stroke-linecap="square" stroke-miterlimit="10" stroke-width="3" stroke-linejoin="miter"></path><line data-color="color-2" x1="32" y1="20" x2="32" y2="42" fill="none" stroke="#FFFFFF" stroke-linecap="square" stroke-miterlimit="10" stroke-width="3" stroke-linejoin="miter"></line><circle data-color="color-2" cx="32" cy="49" r="1" fill="none" stroke="#FFFFFF" stroke-linecap="square" stroke-miterlimit="10" stroke-width="3" stroke-linejoin="miter"></circle></g>

    </SvgIcon>
  );
}

function GitbooksIcon(props) {
  const { color, className } = props;
  return (
    <SvgIcon viewBox="0, 0, 15, 15" className={className}>

    <path
      fill={'#FFFFFF'}
       d="M5.4,7.2c0.2,0,0.4,0.2,0.4,0.4c0,0.2-0.2,0.4-0.4,0.4C5.2,7.9,5,7.7,5,7.6S5.2,7.2,5.4,7.2 M10.9,5
      c-0.2,0-0.4-0.2-0.4-0.4c0-0.2,0.2-0.4,0.4-0.4c0.2,0,0.4,0.2,0.4,0.4C11.3,4.9,11.1,5,10.9,5 M10.9,3.6c-0.6,0-1.1,0.5-1.1,1.1
      c0,0.1,0,0.2,0.1,0.3L6.3,6.9C6.1,6.6,5.8,6.5,5.4,6.5c-0.4,0-0.8,0.2-1,0.6L1.2,5.4C0.9,5.2,0.6,4.6,0.6,4.1
      c0-0.3,0.1-0.5,0.2-0.6c0.1-0.1,0.2,0,0.3,0l0,0C2.1,4,4.9,5.5,5,5.6c0.2,0.1,0.3,0.1,0.6,0l5.8-3c0.1,0,0.2-0.1,0.2-0.2
      c0-0.2-0.2-0.2-0.2-0.2C11,1.9,10.5,1.7,10,1.4C9,0.9,7.8,0.4,7.3,0.1c-0.5-0.2-0.8,0-0.9,0L6.2,0.2C3.9,1.3,0.7,2.9,0.6,3
      C0.2,3.2,0,3.6,0,4.1C0,4.9,0.4,5.7,0.9,6l3.4,1.8c0.1,0.5,0.5,0.9,1.1,0.9c0.6,0,1.1-0.5,1.1-1.1l3.8-2c0.2,0.1,0.4,0.2,0.7,0.2
      c0.6,0,1.1-0.5,1.1-1.1S11.5,3.6,10.9,3.6"
      />
    </SvgIcon>
  );
}

function Learn({ changeTheme }) {
  const router = useRouter();

  function handleNavigate(route) {
    router.push(route);
  }

  const [darkMode, setDarkMode] = useState(false);

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>Learn</title>
      </Head>
      <div className={classes.learnContainer}>
      <div className={classes.box}>
          <Grid container spacing={5}>
            <Grid item lg={4} md={12}>
              <Paper elevation={0} className={classes.mainIntro}>
              <Typography variant="h1" className={classes.learningTitle}>Learning Centre</Typography>
              <Typography variant="body2" className={classes.bold}>
                Yearn's goal is to make it as easy as possible to make money on your crypto money without any effort. You just deposit your crypto assets in one of the vaults and you don't need to think about it anymore. Think of vaults as fancy saving accounts.
              </Typography>
              <Typography variant="body2" className={classes.learningIntro}>
              While the old way to make money in crypto was to just "hodl" until you hit your price target, with Yearn, you get to make interests while you hodl, even better, some of our vaults accepts stable coins pegged to the dollar or euro so you aren't subject to downturns in the market.
              </Typography>
              </Paper>
            </Grid>
            <Grid item lg={8}>
              <Grid container spacing={5}>
                <Grid item lg={6} md={6}>
                  <Paper elevation={0} className={classes.sectionDocs}>
                    <Link href="https://docs.yearn.finance/" target="_blank" className={classes.sectionLink}>
                    <LaunchIcon className={classes.newWindow} />
                    <div className={classes.sectionIcon}>
                    <GitbooksIcon
                      className={classes.st1}
                    />
                    </div>

                      <Typography variant="h2" className={classes.linkTitle}>Official Documentation</Typography>
                      <Typography variant="body2" className={classes.linkIntro}>
                      Read the official Yearn Finance documentation on Gitbooks...
                      </Typography>
                    </Link>
                  </Paper>
                </Grid>
                <Grid item lg={6} md={6}>
                  <Paper elevation={0} className={classes.sectionInvest}>
                    <Link className={classes.sectionLink}>

                    <div className={classes.sectionIcon}>
                    <VaultsIcon
                      className={classes.st0}
                    />
                    </div>

                      <Typography variant="h2" className={classes.linkTitle}>Vault Tutorials</Typography>
                      <Typography variant="body2" className={classes.linkIntro}>
                      Visual guides & demos Coming Soon.
                      </Typography>
                    </Link>
                  </Paper>
                </Grid>
                <Grid item lg={6} md={6}>
                  <Paper elevation={0} className={classes.sectionRisk}>
                    <Link className={classes.sectionLink}>

                      <div className={classes.sectionIcon}>
                      <RiskIcon
                        className={classes.st0}
                      />
                      </div>

                      <Typography variant="h2" className={classes.linkTitleRisk}>Risk Tutorials</Typography>
                      <Typography variant="body2" className={classes.linkIntroDark}>
                      Risk tutorials coming soon.
                      </Typography>
                    </Link>
                  </Paper>
                </Grid>
                <Grid item lg={6} md={6}>
                  <Paper elevation={0} className={classes.sectionFaq}>
                    <Link className={classes.sectionLink}>

                      <div className={classes.sectionIcon}>
                      <FaqIcon
                        className={classes.st0}
                      />
                      </div>

                      <Typography variant="h2" className={classes.linkTitle}>FAQ's</Typography>
                      <Typography variant="body2" className={classes.linkIntro}>
                      Frequently Asked Questions &amp; Answers Coming Soon.
                      </Typography>
                    </Link>
                  </Paper>
                </Grid>

              </Grid>
            </Grid>
          </Grid>
      </div>
      </div>
    </Layout>
  );
}

export default Learn;
