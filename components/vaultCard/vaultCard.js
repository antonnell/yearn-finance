import { Typography, Paper, Grid } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';
import { formatCurrency } from '../../utils';

import classes from './vaultCard.module.css';

export default function VaultCard({ vault, account }) {
  const router = useRouter();

  function handleNavigate() {
    router.push('/invest/' + vault.address);
  }

  const activeVault = BigNumber(vault.balance).gt(0);

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

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Paper elevation={0} className={activeVault ? classes.vaultContainerActive : classes.vaultContainer} onClick={handleNavigate}>

      {activeVault && (
      <div className={classes.ActiveBalance}>
      </div>
      )}

        <div className={classes.vaultTitle}>
          <div className={classes.vaultLogo}>
            <img src={vault.icon ? vault.icon : '/tokens/unknown-logo.png'} alt="" width={50} height={50} />
          </div>
          <div className={classes.vaultName}>
            <Typography variant="h2" className={classes.fontWeightBold}>
              {vault.displayName}
            </Typography>
          </div>
          <div>
            <div className={vaultTypeClass}>
              <Typography className={classes.vaultVersionText}>{vault.type === 'v2' && !vault.endorsed ? 'Exp' : vault.type}</Typography>
            </div>
          </div>
        </div>
        <div className={classes.separator}></div>
        <div className={classes.vaultInfo}>
          {activeVault && (
            <div className={classes.vaultInfoField}>
              <Typography variant="h2" className={classes.balanceUSD}>
                {!(vault && vault.balance) && <Skeleton />}
                {vault && vault.balanceUSD && vault.type !== 'Lockup' && '$ ' + formatCurrency(vault.balanceUSD)}
              </Typography>
              <Typography variant="h2" className={classes.balanceToken}>
                {!(vault && vault.balance) && <Skeleton />}
                {vault && vault.balanceInToken && formatCurrency(vault.balanceInToken) + ' ' + vault.displayName}
              </Typography>
              <Typography variant="h2" className={classes.subinfofield}>Balance</Typography>
            </div>
          )}
          {!activeVault && account && account.address && (
            <div className={classes.vaultInfoField}>

              <Typography variant="h2" className={classes.fontWeightBold}>
                {!(vault && vault.tokenMetadata && vault.tokenMetadata.balance) ? (
                  <Skeleton />
                ) : (
                  formatCurrency(vault.tokenMetadata.balance) + ' ' + vault.tokenMetadata.displayName
                )}
              </Typography>
              <Typography variant="h2" className={classes.subinfofield}>Available to deposit</Typography>
            </div>
          )}
          <div className={classes.vaultInfoFieldSlim}>
            <Typography variant="h2" className={classes.fontWeightBold}>
              {!vault.apy ? <Skeleton /> : vault.apy.recommended ? (vault.apy.recommended === 'New' ? 'New' : (BigNumber(vault.apy.recommended).times(100).toFixed(2) + '%')) : 'Unknown'}
            </Typography>
            <Typography variant="h2" className={classes.subinfofield}>Yearly Growth</Typography>
          </div>
        </div>
      </Paper>
    </Grid>
  );
}
