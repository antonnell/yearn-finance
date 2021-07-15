import React, { useState } from "react";
import { Paper, TextField } from "@material-ui/core";
import Autocomplete from '@material-ui/lab/Autocomplete';

import classes from "./systemFilters.module.css";

const versionOptions = [
  {
    label: 'Vaults V1',
    val: 'v1'
  },
  {
    label: 'Vaults V2',
    val: 'v2'
  },
  {
    label: 'Earn',
    val: 'Earn'
  },
  {
    label: 'My Investments',
    val: 'mine'
  }
]

export default function SystemFilters({ onFiltersChanged, vaults, strategies }) {

  const [ version, setVersion ] = useState('')
  const [ vault, setVault ] = useState('')
  const [ strategy, setStrategy ] = useState('')

  const onVersionOptionChanged = (event, val) => {
    setVersion(val);
    onFiltersChanged(val, vault, strategy, 'pie')
  }

  const onVaultChanged = (event, val) => {
    setVault(val);
    onFiltersChanged(version, val, strategy, 'pie')
  };

  const onStrategyChanged = (event, val) => {
    setStrategy(val);
    onFiltersChanged(version, vault, val, 'pie')
  };

  return (
    <div className={classes.vaultFilters}>
      <div className={classes.vaultFiltersInside}>
        <Paper elevation={0}>
          <Autocomplete
            id="q"
            options={versionOptions}
            autoHighlight
            getOptionLabel={(option) => `${option.label}`}
            className={ classes.flexIt }
            renderInput={(params) => (
              <TextField {...params} fullWidth={true} className={classes.searchContainer} placeholder="Total Value Locked" autoFocus={true} variant="outlined" />
            )}
            onChange={onVersionOptionChanged}
          />
        </Paper>
        <Paper elevation={0}>
          <Autocomplete
            id="q"
            options={vaults}
            groupBy={(option) => option.type}
            autoHighlight
            getOptionLabel={(option) => `${option.name}`}
            className={ classes.flexIt }
            renderInput={(params) => (
              <TextField {...params} fullWidth={true} className={classes.searchContainer} placeholder="All Vaults" autoFocus={true} variant="outlined" />
            )}
            onChange={onVaultChanged}
          />
        </Paper>
        <Paper elevation={0}>
          <Autocomplete
            id="q"
            options={strategies}
            autoHighlight
            getOptionLabel={(option) => `${option.name}`}
            className={ classes.flexIt }
            renderInput={(params) => (
              <TextField {...params} fullWidth={true} className={classes.searchContainer} placeholder="All Strategies" autoFocus={true} variant="outlined" />
            )}
            onChange={onStrategyChanged}
          />
        </Paper>
      </div>
    </div>
  );
}

/*

<ToggleButtonGroup className={classes.layoutToggleButtons} value={layout} onChange={handleLayoutChanged} exclusive>
  <ToggleButton className={classes.layoutToggleButton} value={'pie'}>
    <PieChartIcon />
  </ToggleButton>
  <ToggleButton className={classes.layoutToggleButton} value={'list'}>
    <ReorderIcon />
  </ToggleButton>
</ToggleButtonGroup>

*/
