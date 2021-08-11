import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';

import VaultStrategyCard from './stratModal.js';

import classes from './vaultStrategyCard.module.css';

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: '50%',
    backgroundColor: theme.palette.background.paper,
    border: '1px solid rgba(104,108,122,0.4)',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    top: '80px',
    left: '25%',
    borderRadius: '10px',
    maxHeight: '660px',
    overflow: 'scroll',
  },
  '@media (max-width: 960px)': {
    paper: {
      width: '90%',
      left: '5%',
    }
  },
  strategiesBtn: {
    border: '1px solid rgba(104,108,122,0.3)',
    background: theme.palette.background.paper,
    width: '230px',
    color: 'rgba(104,108,122,1)',
    padding: '13px 0',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    borderRadius: '100px',
  },
}));

export default function SimpleModal() {
  const classes = useStyles();
  // getModalStyle is not a pure function, we roll the style only on the first render

  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const body = (
    <div className={classes.paper}>
      <h2 id="simple-modal-title">Vault Strategies</h2>
      <VaultStrategyCard />
    </div>
  );

  return (
    <div>
      <button className={classes.strategiesBtn} type="button" onClick={handleOpen}>
        View Vault Strategies
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        {body}
      </Modal>
    </div>
  );
}
