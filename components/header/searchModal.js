import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogActions from '@material-ui/core/DialogActions';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import stores from '../../stores/index.js';
import BigNumber from 'bignumber.js';
import { useRouter } from 'next/router';

const styles = (theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
});

const DialogTitle = withStyles(styles)((props) => {
  const { children, classes, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
    </MuiDialogTitle>
  );
});

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

export default function SearchModal(props) {
  const { setToggleSearchModal } = props;
  const [open, setOpen] = React.useState(true);
  const storeLendingAssets = stores.lendStore.getStore('lendingAssets');
  const router = useRouter();
  React.useEffect(() => {
    setTimeout(function () {
      let q = document.getElementById('q');
      if (q) q.focus();
    }, 500);
  });
  function handleNavigate(vault) {
    //for some reason nextjs really doesn't like pushing to a similar dynamic route with different id
    //so redirecting to an empty page first...
    if (vault.type.toLowerCase() === 'earn') {
      router.push('/redirect?address=' + vault.address + '&section=lend');
    } else {
      router.push('/redirect?address=' + vault.address + '&section=invest');
    }
  }
  const handleClose = () => {
    setOpen(false);
    setToggleSearchModal(false);
  };
  const vaults = stores.investStore.getStore('vaults');
  const allVaults = vaults.concat(storeLendingAssets);
  const filteredVaults = allVaults
    .map((vault) => {
      if (vault.type === 'v2' && !vault.endorsed) {
        vault.type = 'Experimental';
      }
      return vault;
    })
    .filter((vault) => {
      if (vault.supplyAPY) {
        vault.apy = { net_apy: vault.supplyAPY / 100 };
        vault.type = 'Earn';
      }

      return vault.apy?.net_apy;
    })
    .sort((a, b) => {
      let oneMonthA = a.apy?.net_apy;
      let oneMonthB = b.apy?.net_apy;
      if (BigNumber(oneMonthA).gt(BigNumber(oneMonthB))) {
        return -1;
      } else if (BigNumber(oneMonthA).lt(BigNumber(oneMonthB))) {
        return 1;
      }
    });
  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="search-modal-title" open={open}>
        <DialogTitle id="search-modal-title" onClose={handleClose}>
          Find the best yield for your favorite asset
        </DialogTitle>
        <div style={{ padding: '15px' }}>
          <Autocomplete
            id="q"
            options={filteredVaults.sort((a, b) => -a.type.localeCompare(b.type))}
            groupBy={(option) => option.type}
            fullWidth={true}
            autoHighlight
            getOptionLabel={(option) => `${option.displayName} (${BigNumber(option.apy?.net_apy).times(100).toFixed(2)}% APY)`}
            renderInput={(params) => (
              <TextField {...params} fullWidth={true} label="Search vaults and assets through out yearn.fi" autoFocus={true} variant="outlined" />
            )}
            onChange={(e, v) => {
              handleNavigate(v);
            }}
          />
        </div>
        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
