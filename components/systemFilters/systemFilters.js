import React, { useState } from "react";
import { Paper, Typography, TextField, InputAdornment } from "@material-ui/core";
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from "../../utils";

import ReorderIcon from '@material-ui/icons/Reorder';
import PieChartIcon from '@material-ui/icons/PieChart';
import SearchIcon from '@material-ui/icons/Search';

import BigNumber from "bignumber.js";

import classes from "./systemFilters.module.css";

export default function SystemFilters({ assets, onFiltersChanged }) {

  const [ versions, setVersions ] = useState([])
  const [ search, setSearch ] = useState('')
  const [ layout, setLayout ] = useState('pie')

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    onFiltersChanged(versions, event.target.value, layout)
  };

  const handleLayoutChanged = (event, newVal) => {
    if (newVal !== null) {
      setLayout(newVal);
      onFiltersChanged(versions, search, newVal)
    }
  };

  const handleVersionsChanged = (event, newVals) => {
    setVersions(newVals);
    onFiltersChanged(newVals, search, layout)
  };

  return (
    <Paper className={classes.vaultFilters}>
      <div className={classes.vaultFiltersInside}>
        <ToggleButtonGroup className={classes.vaultTypeButtons} value={versions} onChange={handleVersionsChanged}>
          <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Lockup') ? classes.lockupSelected : classes.lockup}`} value="Lockup">
            <Typography variant="body1">Lockup</Typography>
          </ToggleButton>
          <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('v2') ? classes.v2Selected : classes.v2}`} value="v2">
            <Typography variant="body1">V2</Typography>
          </ToggleButton>
          <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('v1') ? classes.v1Selected : classes.v1}`} value="v1">
            <Typography variant="body1">V1</Typography>
          </ToggleButton>
          <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Exp') ? classes.expSelected : classes.exp}`} value="Exp">
            <Typography variant="body1">Exp</Typography>
          </ToggleButton>
          <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Earn') ? classes.earnSelected : classes.earn}`} value="Earn">
            <Typography variant="body1">Earn</Typography>
          </ToggleButton>
          <ToggleButton className={`${classes.vaultTypeButton} ${versions.includes('Active') ? classes.activeSelected : classes.active}`} value="Active">
            <Typography variant="body1">Mine</Typography>
          </ToggleButton>
        </ToggleButtonGroup>
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
        <ToggleButtonGroup className={classes.layoutToggleButtons} value={layout} onChange={handleLayoutChanged} exclusive>
          <ToggleButton className={classes.layoutToggleButton} value={'pie'}>
            <PieChartIcon />
          </ToggleButton>
          <ToggleButton className={classes.layoutToggleButton} value={'list'}>
            <ReorderIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    </Paper>
  );
}
