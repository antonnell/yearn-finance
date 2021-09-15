import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Paper } from '@material-ui/core';

import classes from '../../pages/invest/[address]/vault.module.css';

import VaultStrategyCard from './vaultStrategyCardContent.js';

import stores from '../../stores';
import {
  VAULTS_UPDATED,
} from '../../stores/constants';

function Vault() {
  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);
  const router = useRouter();
  const [vault, setVault] = useState(null);

  useEffect(() => {
    function vaultsUpdated() {
      setVault(stores.investStore.getVault(router.query.address));
      forceUpdate();
    }

    setVault(stores.investStore.getVault(router.query.address));
    stores.emitter.on(VAULTS_UPDATED, vaultsUpdated);

    return () => {
      stores.emitter.removeListener(VAULTS_UPDATED, vaultsUpdated);
    };
  }, []);

  return (
    <Paper elevation={0} className={classes.xxx}>
      { vault && vault.strategies && vault.strategies.map((strategy) => {
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
