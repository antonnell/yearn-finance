import { Typography, Paper } from '@material-ui/core';
import Link from '@material-ui/core/Link';

import FlashOffOutlinedIcon from '@material-ui/icons/FlashOffOutlined';

import Head from 'next/head';
import Layout from '../../components/layout/layout.js';

import classes from './cdp.module.css';

function CDP({ changeTheme }) {

  return (
    <Layout changeTheme={changeTheme}>
      <Head>
        <title>CDP</title>
      </Head>
      <div className={classes.cdpContainer}>
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
      </div>
    </Layout>
  );
}

export default CDP;
