import React, { useState } from "react";
import { Paper, Typography, TextField, InputAdornment } from "@material-ui/core";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Skeleton from '@material-ui/lab/Skeleton';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { formatCurrency } from "../../utils";

import ReorderIcon from '@material-ui/icons/Reorder';
import PieChartIcon from '@material-ui/icons/PieChart';
import SearchIcon from '@material-ui/icons/Search';

import BigNumber from "bignumber.js";

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
  const [ layout, setLayout ] = useState('pie')

  const onVersionOptionChanged = (event, val) => {
    setVersion(val);
    onFiltersChanged(val, vault, strategy, layout)
  }

  const onVaultChanged = (event, val) => {
    setVault(val);
    onFiltersChanged(version, val, strategy, layout)
  };

  const onStrategyChanged = (event, val) => {
    setStrategy(val);
    onFiltersChanged(version, vault, val, layout)
  };

  const handleLayoutChanged = (event, newVal) => {
    if (newVal !== null) {
      setLayout(newVal);
      onFiltersChanged(version, vault, strategy, newVal)
    }
  };

  // const handleVersionsChanged = (event, newVals) => {
  //   setVersions(newVals);
  //   onFiltersChanged(newVals, search, layout)
  // };

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
