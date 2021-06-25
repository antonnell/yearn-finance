import React, { useState, useEffect } from 'react';
import { Typography, Paper, Button, TextField, InputAdornment, CircularProgress } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import Autocomplete from '@material-ui/lab/Autocomplete';

import AccountBalanceWalletOutlinedIcon from '@material-ui/icons/AccountBalanceWalletOutlined';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';

import BigNumber from 'bignumber.js';

import { formatCurrency } from '../../utils';

import classes from './ycdpQuickAction.module.css';

export default function ycdpQuickAction() {

  const [ loading, setLoading ] = useState(false)

  const [ activeTab, setActiveTab ] = useState('deposit')


  const [ assets, setAssets ] = useState([])

  const [depositAsset, setDepositAsset] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  const [mintAsset, setMintAsset] = useState(null);
  const [mintAmount, setMintAmount] = useState('');

  const [withdrawAsset, setWithdrawAsset] = useState(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [burnAsset, setBurnAsset] = useState(null);
  const [burnAmount, setBurnAmount] = useState('');

  const onAssetChanged = (type, newVal) => {
    switch (type) {
      case 'deposit':
        setDepositAsset(newVal)
        break;
      case 'withdraw':
        setWithdrawAsset(newVal)
        break;
      case 'mint':
        setMintAsset(newVal)
        break;
      case 'burn':
        setBurnAsset(newVal)
        break;
      default:

    }
  }

  const onAmountChanged = (type, newVal) => {
    switch (type) {
      case 'deposit':
        setDepositAmount(newVal)
        break;
      case 'withdraw':
        setWithdrawAmount(newVal)
        break;
      case 'mint':
        setMintAmount(newVal)
        break;
      case 'burn':
        setBurnAmount(newVal)
        break;
      default:

    }
  }

  const onAmountPercentChanged = (type, percent) => {
    switch (type) {
      case 'deposit':
        if(!depositAsset) { return; }
        setDepositAmount(BigNumber(depositAsset.balance).times(percent).div(100).toFixed(depositAsset.decimals))
        break;
      case 'withdraw':
        if(!withdrawAsset) { return; }
        setWithdrawAmount(BigNumber(withdrawAsset.balance).times(percent).div(100).toFixed(withdrawAsset.decimals))
        break;
      case 'mint':
        if(!mintAsset) { return; }
        setMintAmount(BigNumber(mintAsset.balance).times(percent).div(100).toFixed(mintAsset.decimals))
        break;
      case 'burn':
        if(!burnAsset) { return; }
        setBurnAmount(BigNumber(burnAsset.balance).times(percent).div(100).toFixed(burnAsset.decimals))
        break;
      default:

    }
  }

  const toggleDeposit = () => {
    setActiveTab('deposit')
  }

  const toggleWithdraw = () => {
    setActiveTab('withdraw')
  }

  const renderInput = (type, label, onAmountChange, onAmountChangePercent, amountValue, onAssetChange, assetValue) => {
    return (
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              { label }
            </Typography>
          </div>
          <div className={classes.balances}>
            <Typography
              variant="h5"
              onClick={() => {
                onAmountChangePercent(type, 100);
              }}
              className={classes.value}
              noWrap
            >
              Balance: {!assetValue?.balance ? <Skeleton /> : formatCurrency(assetValue.balance)}
            </Typography>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
          <Autocomplete
            options={assets}
            value={assetValue}
            onChange={ (e, newVal) => { onAssetChange(type, newVal) } }
            getOptionLabel={(option) => option.label}
            style={{ width: '55%', marginRight: '5px' }}
            renderOption={(option) => (
              <React.Fragment>
                <img
                  src={option && option.icon ? option.icon : `tokens/unknown-logo.png`}
                  alt=""
                  width={30}
                  height={30}
                  style={{ marginRight: '10px' }}
                />
                <span className={classes.color} style={{ backgroundColor: option.color }} />
                <div className={classes.text}>
                  {option.label}
                  <br />
                </div>
              </React.Fragment>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                InputProps={{
                  ...params.InputProps,
                  ...{
                    startAdornment: (
                      <InputAdornment position="start">
                        <img
                          src={assetValue && assetValue.icon ? assetValue.icon : `tokens/unknown-logo.png`}
                          alt=""
                          width={30}
                          height={30}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                label="Token"
                variant="outlined"
              />
            )}
          />
          <TextField variant="outlined" style={{ width: '40%' }} placeholder="0.00" value={amountValue} label="Amount" onChange={onAmountChange} />
        </div>
      </div>
    )
  }

  return (
    <Paper elevation={0} className={classes.ycdpQuickActionContainer}>
      <div className={classes.toggleButtons}>
        <Button className={ `${activeTab === 'deposit' ? classes.buttonActive : classes.button}` } onClick={ toggleDeposit }>
          <Typography variant='h5'>Deposit / Mint</Typography>
        </Button>
        <Button className={ `${activeTab === 'withdraw' ? classes.buttonActive : classes.button}` } onClick={ toggleWithdraw }>
          <Typography variant='h5'>Withdraw / Burn</Typography>
        </Button>
      </div>
      {
        activeTab === 'deposit' &&
        <div className={classes.actionsContainer}>
          { renderInput('deposit', 'Deposit', onAmountChanged, onAmountPercentChanged, depositAmount, onAssetChanged, depositAsset) }
          { renderInput('mint', 'Mint', onAmountChanged, onAmountPercentChanged, mintAmount, onAssetChanged, mintAsset) }
        </div>
      }
      {
        activeTab === 'withdraw' &&
        <div className={classes.actionsContainer}>
          { renderInput('withdraw', 'Withdraw', onAmountChanged, onAmountPercentChanged, withdrawAmount, onAssetChanged, withdrawAsset) }
          { renderInput('burn', 'Burn', onAmountChanged, onAmountPercentChanged, burnAmount, onAssetChanged, burnAsset) }
        </div>
      }
      <div className={classes.informationContainer}>
        {
          activeTab === 'deposit' &&
          <div className={ classes.actionButtons }>
            <Button variant='contained' color='primary' className={ classes.actionButton }>
              <Typography>Approve</Typography>
            </Button>
            <Button variant='contained' color='primary' className={ classes.actionButton }>
              <Typography>Deposit & Mint</Typography>
            </Button>
          </div>
        }
        {
          activeTab === 'withdraw' &&
          <div className={ classes.actionButtons }>
            <Button variant='contained' color='primary' className={ classes.actionButton }>
              <Typography>Approve</Typography>
            </Button>
            <Button variant='contained' color='primary' className={ classes.actionButton }>
              <Typography>Withdraw & Burn</Typography>
            </Button>
          </div>
        }
      </div>
    </Paper>
  );
}
