import React, { useState, useEffect } from 'react';
import { TextField, Typography, InputAdornment, Button, CircularProgress, Tooltip } from '@material-ui/core';
import BigNumber from 'bignumber.js';
import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from '../../utils';
import GasSpeed from '../gasSpeed';
import classes from './vaultActionCard.module.css';

import stores from '../../stores';
import {
  ERROR,
  MIGRATE_VAULT,
  MIGRATE_VAULT_RETURNED,
  CONNECT_WALLET,
  VAULTS_UPDATED,
  APPROVE_MIGRATE_VAULT,
  APPROVE_MIGRATE_VAULT_RETURNED
} from '../../stores/constants';

export default function Deposit({ vault }) {

  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [gasSpeed, setGasSpeed] = useState('');
  const [migrateVault, setMigrationVault] = useState(null)

  const onMigrate = () => {
    setLoading(true);
    stores.dispatcher.dispatch({
      type: MIGRATE_VAULT,
      content: { vault: vault, amount: amount, gasSpeed: gasSpeed },
    });
  };

  const onApprove = () => {
    if (!amount || isNaN(amount) || amount <= 0 || BigNumber(amount).gt(vault.balanceInToken)) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_MIGRATE_VAULT,
      content: { vault: vault, amount: amount, gasSpeed: gasSpeed },
    });
  };

  const onApproveMax = () => {
    if (!amount || isNaN(amount) || amount <= 0 || BigNumber(amount).gt(vault.balanceInToken)) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    stores.dispatcher.dispatch({
      type: APPROVE_MIGRATE_VAULT,
      content: { vault: vault, amount: 'max', gasSpeed: gasSpeed },
    });
  };

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  const setSpeed = (speed) => {
    setGasSpeed(speed);
  };

  useEffect(() => {
    const migrateReturned = () => {
      setLoading(false);
    };

    const approveReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    const vaultsUpdated = () => {
      const vaults = stores.investStore.getStore('vaults')
      const migrationVault = vaults.filter((v) => {
        return v.address === vault.migration.address
      })
      if(migrationVault.length > 0) {
        setMigrationVault(migrationVault[0])
      }
    };

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(MIGRATE_VAULT_RETURNED, migrateReturned);
    stores.emitter.on(APPROVE_MIGRATE_VAULT_RETURNED, approveReturned);
    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(MIGRATE_VAULT_RETURNED, migrateReturned);
      stores.emitter.removeListener(APPROVE_MIGRATE_VAULT_RETURNED, approveReturned);
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
    };
  });

  useEffect(() => {
    setAccount(stores.accountStore.getStore('account'))

    const vaults = stores.investStore.getStore('vaults')
    const migrationVault = vaults.filter((v) => {
      return v.address === vault.migration.address
    })
    if(migrationVault.length > 0) {
      setMigrationVault(migrationVault[0])
    }
  }, []);

  return (
    <div className={classes.depositContainer}>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Migrate all
            </Typography>
          </div>
          <div className={classes.balances}>
            <Typography
              variant="h5"
              className={classes.value}
              noWrap
            >
              Balance: {!vault.balanceInToken ? <Skeleton /> : formatCurrency(vault.balanceInToken)}
            </Typography>
          </div>
        </div>
        <TextField
          variant="outlined"
          fullWidth
          placeholder=""
          disabled
          value={vault.balanceInToken}
          InputProps={{
            endAdornment: <InputAdornment position="end">v{vault?.version}</InputAdornment>,
            startAdornment: (
              <InputAdornment position="start">
                <img src={vault.tokenMetadata.icon} alt="" width={30} height={30} />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <div className={classes.scaleContainer}>

      </div>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Migrate to
            </Typography>
          </div>
        </div>
        <TextField
          variant="outlined"
          disabled
          fullWidth
          placeholder=""
          value={`${migrateVault?.displayName} (${BigNumber(migrateVault?.apy?.net_apy).times(100).toFixed(2)}%)`}
          InputProps={{
            endAdornment: <InputAdornment position="end">v{migrateVault?.version}</InputAdornment>,
            startAdornment: (
              <InputAdornment position="start">
                <img src={migrateVault?.tokenMetadata.icon} alt="" width={30} height={30} />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <div className={ classes.gasExtraPadding}>
        <GasSpeed setParentSpeed={setSpeed} />
      </div>
      {(!account || !account.address) && (
        <div className={classes.actionButton}>
          <Button fullWidth disableElevation variant="contained" color="primary" size="large" onClick={onConnectWallet} disabled={loading}>
            <Typography variant="h5">Connect Wallet</Typography>
          </Button>
        </div>
      )}
      {account && account.address && (
        <div className={classes.actionButton}>
          {(amount === '' || BigNumber(vault.migrateAllowance).gte(amount)) && (
            <Button fullWidth disableElevation variant="contained" color="secondary" size="large" onClick={onMigrate} disabled={loading}>
              <Typography variant="h5" className={ classes.flexInline }>
                {loading ? (
                  <CircularProgress size={15} />
                ) : (
                  'Migrate'
                )}
              </Typography>
            </Button>
          )}
          {amount !== '' && BigNumber(amount).gt(0) &&
            (!vault.migrateAllowance || BigNumber(vault.migrateAllowance).eq(0) || BigNumber(vault.migrateAllowance).lt(amount)) && (
              <React.Fragment>
                <Button
                  fullWidth
                  disableElevation
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onApprove}
                  disabled={loading}
                  className={classes.marginRight}
                >
                  <Typography variant="h5">{loading ? <CircularProgress size={15} /> : 'Approve Exact'}</Typography>
                </Button>
                <Button
                  fullWidth
                  disableElevation
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={onApproveMax}
                  disabled={loading}
                  className={classes.marginLeft}
                >
                  <Typography variant="h5">{loading ? <CircularProgress size={15} /> : 'Approve Max'}</Typography>
                </Button>
              </React.Fragment>
            )}
        </div>
      )}
    </div>)
}
