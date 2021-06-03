import React, { useState } from "react";
import { Paper, Tabs, Tab } from "@material-ui/core";

import Buy from "./buy";
import Sell from "./sell";

import classes from "./coverActionCard.module.css";

export default function CoverActionCard({ coverProtocol }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Paper elevation={0} className={classes.vaultActionContainer}>
      <Tabs
        variant="fullWidth"
        indicatorColor="primary"
        value={tabValue}
        onChange={handleTabChange}
      >
        <Tab label="Buy" />
        <Tab label="Sell" />
      </Tabs>
      {tabValue === 0 && <Buy coverProtocol={coverProtocol} />}
      {tabValue === 1 && <Sell coverProtocol={coverProtocol} />}
    </Paper>
  );
}
