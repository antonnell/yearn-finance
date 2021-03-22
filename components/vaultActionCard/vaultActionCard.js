import React, { useState, useEffect } from "react";
import { Typography, Paper, Tabs, Tab, TextField } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";
import { useRouter } from "next/router";

import Deposit from "./deposit";
import Withdraw from "./withdraw";

import classes from "./vaultActionCard.module.css";

export default function VaultActionCard({ vault }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={2} className={classes.vaultActionContainer}>
      <Tabs
        variant="fullWidth"
        indicatorColor="primary"
        value={tabValue}
        onChange={handleTabChange}
      >
        <Tab label="Deposit" />
        {vault.type !== "Lockup" && <Tab label="Withdraw" />}
      </Tabs>
      {tabValue === 0 && <Deposit vault={vault} />}
      {tabValue === 1 && vault.type !== "Lockup" && <Withdraw vault={vault} />}
    </Paper>
  );
}
