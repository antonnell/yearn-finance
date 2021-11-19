import React, { useState } from "react";
import { Paper, Tabs, Tab } from "@material-ui/core";

import Migrate from './migrate';
import Deposit from "./deposit";
import Withdraw from "./withdraw";

import classes from "./vaultActionCard.module.css";

export default function VaultActionCard({ vault }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const vaultType = vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type;
  const canMigrate = vault.migration && vault.migration.available && vault.migration.address !== null

  return (
    <Paper elevation={0} className={classes.vaultActionContainer}>
      <Tabs
        variant="fullWidth"
        indicatorColor="primary"
        value={tabValue}
        onChange={handleTabChange}
      >
        <Tab label="Deposit" />
        { vault.type !== "Lockup" && <Tab label="Withdraw" />}
        { canMigrate && <Tab label="Migrate" />}
      </Tabs>
      {tabValue === 0 && <Deposit vault={vault} />}
      {tabValue === 1 && vault.type !== "Lockup" && <Withdraw vault={vault} />}
      {tabValue === 2 && <Migrate vault={vault} />}
    </Paper>
  );
}
