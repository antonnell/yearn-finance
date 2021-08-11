import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Typography, Paper } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';

import classes from '../../pages/invest/[address]/vault.module.css';

import VaultStrategyCard from './vaultStrategyCardContent.js';

import stores from '../../stores';
import {
  VAULTS_UPDATED,
  GET_VAULT_PERFORMANCE,
  VAULT_PERFORMANCE_RETURNED,
  GET_VAULT_TRANSACTIONS,
  VAULT_TRANSACTIONS_RETURNED,
  ACCOUNT_CHANGED,
  ETHERSCAN_URL,
} from '../../stores/constants';

function Vault(props) {
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const router = useRouter();

  const storeAccount = stores.accountStore.getStore('account');
  const [account, setAccount] = useState(storeAccount);

  const storeVault = stores.investStore.getVault(router.query.address);
  const [vault, setVault] = useState(storeVault);

  const backClicked = () => {
    router.push('/invest');
  };

  useEffect(() => {
    function vaultsUpdated() {
      const v = stores.investStore.getVault(router.query.address);
      setVault(v);
      forceUpdate();
    }

    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);
    stores.emitter.on(VAULT_PERFORMANCE_RETURNED, vaultsUpdated);
    stores.emitter.on(VAULT_TRANSACTIONS_RETURNED, vaultsUpdated);

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
      stores.emitter.removeListener(VAULT_PERFORMANCE_RETURNED, vaultsUpdated);
      stores.emitter.removeListener(VAULT_TRANSACTIONS_RETURNED, vaultsUpdated);
    };
  }, []);

  useEffect(() => {
    const accountChanged = () => {
      const storeAccount = stores.accountStore.getStore('account');
      setAccount(storeAccount);
    };

    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
    };
  }, []);

  useEffect(() => {
    stores.dispatcher.dispatch({ type: GET_VAULT_PERFORMANCE, content: { address: router.query.address, duration: 'Month' } });
    stores.dispatcher.dispatch({ type: GET_VAULT_TRANSACTIONS, content: { address: router.query.address } });
  }, []);

  const vaultType = vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type;

  let vaultTypeClass = null;
  switch (vaultType) {
    case 'v1':
      vaultTypeClass = classes.vaultV1VersionContainer;
      break;
    case 'v2':
      vaultTypeClass = classes.vaultV2VersionContainer;
      break;
    case 'Exp':
      vaultTypeClass = classes.vaultExpVersionContainer;
      break;
    case 'Earn':
      vaultTypeClass = classes.vaultEarnVersionContainer;
      break;
    case 'Lockup':
      vaultTypeClass = classes.vaultLockupVersionContainer;
      break;
    default:
      vaultTypeClass = classes.vaultVersionContainer;
      break;
  }

  const onVaultClicked = () => {
    window.open(`${ETHERSCAN_URL}address/${vault.address}`);
  };
  return (
    <Paper elevation={0} className={classes.xxx}>
      {vault.strategies.map((strategy) => {
        return (
          <React.Fragment>
            <div className={classes.overviewCards}>
              <VaultStrategyCard strategy={strategy} vault={vault} />
            </div>
          </React.Fragment>
        );
      })}
    </Paper>
  );
}

export default Vault;
