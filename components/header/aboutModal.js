import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import MuiDialogActions from '@material-ui/core/DialogActions';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

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
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root} {...other}>
      <Typography variant="h6">{children}</Typography>
      {onClose ? (
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      ) : null}
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

const DialogActions = withStyles((theme) => ({
  root: {
    margin: 0,
    padding: theme.spacing(1),
  },
}))(MuiDialogActions);

const NewbiePrimer = () => {
  return (
    <>
      <h3>Here is a primer if you are completely new to the crypto and DeFi world:</h3>
      <Typography gutterBottom>
        Simply put, Yearn's goal is to make it as easy as possible to make money on your crypto money without any effort. You just deposit your crypto assets in
        one of our vaults and you don't need to think about it anymore. Think of vaults as fancy saving accounts.
      </Typography>
      <Typography gutterBottom>
        While the old way to make money in crypto was to just "hodl" until you hit your price target, with Yearn, you get to make interests while you hodl, even
        better, some of our vaults accepts stable coins pegged to the dollar or euro so you aren't subject to downturns in the market.
      </Typography>
      <Typography gutterBottom>
        If you are completely new to crypto, you first need to buy crypto money with your regular fiat money on a centralized exchange such as Coinbase or
        Binance. You then need to create an ethereum wallet by installing{' '}
        <a href="https://metamask.io/" target="_blank">
          Metamask
        </a>{' '}
        and withdraw the crypto currency you bought to your Metamask address. If you are new, we recommend you to buy either Ethereum or Dai or another stable
        coin such as USDC. A minimum amount of Ethereum is mandatory to pay for your deposit (0.1 ethereum at least to be safe).
      </Typography>
    </>
  );
};
const ProPrimer = () => {
  return (
    <>
      <h3>Already familiar with DeFi? Here's a primer for you:</h3>
      <Typography gutterBottom>
        Yearn Finance is a suite of products in Decentralized Finance (DeFi) that provides lending aggregation, yield generation, and insurance on the Ethereum
        blockchain. The protocol is maintained by various independent developers and is governed by YFI holders.
      </Typography>
    </>
  );
};
export default function AboutModal(props) {
  const { setToggleAboutModal } = props;
  const [open, setOpen] = React.useState(true);

  const handleClose = () => {
    setOpen(false);
    setToggleAboutModal(false);
  };

  return (
    <div>
      <Dialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          What is Yearn?
        </DialogTitle>
        {typeof web3 !== 'undefined' ? (
          <>
            <DialogContent dividers>
              <ProPrimer />
            </DialogContent>
            <DialogContent dividers>
              <NewbiePrimer />
            </DialogContent>
          </>
        ) : (
          <>
            <DialogContent dividers>
              <NewbiePrimer />
            </DialogContent>
            <DialogContent dividers>
              <ProPrimer />
            </DialogContent>
          </>
        )}
        <DialogActions>
          <Button autoFocus onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
