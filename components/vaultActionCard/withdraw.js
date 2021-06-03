import React, { useState, useEffect } from 'react';
import { TextField, Typography, InputAdornment, Button, CircularProgress, FormGroup } from '@material-ui/core';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import Autocomplete from '@material-ui/lab/Autocomplete';
import BigNumber from 'bignumber.js';
import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from '../../utils';
import GasSpeed from '../gasSpeed';
import InfoIcon from "@material-ui/icons/Info";

import classes from './vaultActionCard.module.css';

import stores from '../../stores';
import { ERROR, WITHDRAW_VAULT, WITHDRAW_VAULT_ZAPPER, WITHDRAW_VAULT_RETURNED, CONNECT_WALLET, UPDATE_WITHDRAWAL_STATUS } from '../../stores/constants';

export default function Withdraw({ vault }) {
  const [zapperSlippage, setZapperSlippage] = useState(0.01);
  const storeAccount = stores.accountStore.getStore('account');
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [account, /* setAccount */] = useState(storeAccount);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [gasSpeed, setGasSpeed] = useState('');
  const zapperImgUrl = 'https://zapper.fi/images/';
  const withdrawTokens = [
    { label: vault.tokenMetadata.displayName, address: '0x0000000000000000000000000000000000000000', isVault: true, img: vault.icon },
    { label: 'ETH', address: '0x0000000000000000000000000000000000000000', img: `${zapperImgUrl}ETH-icon.png` },
    { label: 'DAI', address: '0x6b175474e89094c44da98b954eedeac495271d0f', img: `${zapperImgUrl}DAI-icon.png` },
    { label: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', img: `${zapperImgUrl}USDC-icon.png` },
    { label: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', img: `${zapperImgUrl}USDT-icon.png` },
    { label: 'WBTC', address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', img: `${zapperImgUrl}WBTC-icon.png` },
  ];

  const handleZapperSlippage = (event, slippage) => {
    if (slippage === 0.01 || slippage === 0.02 || slippage === 0.03) setZapperSlippage(slippage);
  };

  const [selectedToken, setSelectedToken] = useState(withdrawTokens[0]);
  const setAmountPercent = (percent) => {
    setAmountError(false);

    setAmount(BigNumber(vault.balanceInToken).times(percent).div(100).toFixed(vault.tokenMetadata.decimals, BigNumber.ROUND_DOWN));
  };

  const onAmountChanged = (event) => {
    setAmountError(false);

    setAmount(event.target.value);
  };

  const onWithdraw = () => {
    if (!amount || isNaN(amount) || amount <= 0 || BigNumber(amount).gt(vault.balanceInToken)) {
      setAmountError(true);
      return false;
    }

    setLoading(true);
    if (selectedToken.isVault) {
      stores.dispatcher.dispatch({
        type: WITHDRAW_VAULT,
        content: {
          vault: vault,
          amount: BigNumber(amount).div(vault.pricePerFullShare).toFixed(vault.decimals, BigNumber.ROUND_DOWN),
          gasSpeed: gasSpeed,
        },
      });
    } else {
      stores.dispatcher.dispatch({
        type: WITHDRAW_VAULT_ZAPPER,
        content: {
          vault: vault,
          amount: BigNumber(amount).div(vault.pricePerFullShare).toFixed(vault.decimals, BigNumber.ROUND_DOWN),
          gasSpeed: gasSpeed,
          currentToken: selectedToken,
          zapperSlippage: zapperSlippage,
        },
      });
    }
  };

  const onConnectWallet = () => {
    stores.emitter.emit(CONNECT_WALLET);
  };

  const setSpeed = (speed) => {
    setGasSpeed(speed);
  };

  useEffect(() => {
    const withdrawReturned = () => {
      setLoading(false);
    };

    const errorReturned = () => {
      setLoading(false);
    };

    const updateWithdrawlStatus = (message) => {
      setWithdrawalStatus(message);
    };

    stores.emitter.on(ERROR, errorReturned);
    stores.emitter.on(WITHDRAW_VAULT_RETURNED, withdrawReturned);
    stores.emitter.on(UPDATE_WITHDRAWAL_STATUS, updateWithdrawlStatus);

    return () => {
      stores.emitter.removeListener(ERROR, errorReturned);
      stores.emitter.removeListener(WITHDRAW_VAULT_RETURNED, withdrawReturned);
      stores.emitter.removeListener(UPDATE_WITHDRAWAL_STATUS, updateWithdrawlStatus);
    };
  });

  let depositDisabled = false
  let depositDisabledMessage = null
  if(vault.address === '0xa9fE4601811213c340e850ea305481afF02f5b28') {
    depositDisabled = true
    depositDisabledMessage = 'We have taken steps to increase the safety factor on our strategies that have LTV ratios that must be maintained. In the process of doing this, an accounting issue was uncovered with artifical losses reported that drove down the price of the yvWETH vault significantly. We are taking actions to resolve this accounting error and return the vault to normal. Please do not withdraw until the issue has been patched, as you currently will receive WETH at the artificially lowered share price of ~0.90.'
  }

  return (
    <div className={classes.depositContainer}>
      <div className={classes.textField}>
        <div className={classes.inputTitleContainer}>
          <div className={classes.inputTitle}>
            <Typography variant="h5" noWrap>
              Withdraw
            </Typography>
          </div>
          <div className={classes.balances}>
            <Typography
              variant="h5"
              onClick={() => {
                setAmountPercent(100);
              }}
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
          value={amount}
          error={amountError}
          onChange={onAmountChanged}
          InputProps={{
            endAdornment: <InputAdornment position="end">{vault.tokenMetadata.displayName}</InputAdornment>,
            startAdornment: (
              <InputAdornment position="start">
                <img src={vault.tokenMetadata.icon} alt="" width={30} height={30} />
              </InputAdornment>
            ),
          }}
        />
      </div>
      <div className={classes.scaleContainer}>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(25);
          }}
        >
          <Typography variant={'h5'}>25%</Typography>
        </Button>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(50);
          }}
        >
          <Typography variant={'h5'}>50%</Typography>
        </Button>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(75);
          }}
        >
          <Typography variant={'h5'}>75%</Typography>
        </Button>
        <Button
          className={classes.scale}
          variant="outlined"
          color="primary"
          onClick={() => {
            setAmountPercent(100);
          }}
        >
          <Typography variant={'h5'}>100%</Typography>
        </Button>
      </div>
      {vault.type !== 'Earn' && (
        <div className={classes.textField}>
          <div className={classes.inputTitleContainer}>
            <div className={classes.inputTitle}>
              <Typography variant="h5" noWrap>
                Withdraw to
              </Typography>
            </div>
          </div>
          <Autocomplete
            disableClearable={true}
            options={withdrawTokens}
            value={selectedToken}
            onChange={(event, newValue) => {
              setSelectedToken(newValue);
            }}
            getOptionLabel={(option) => option.label}
            fullWidth={true}
            renderOption={(option) => (
              <React.Fragment>
                <img src={option.img} alt="" width={30} height={30} style={{ marginRight: '10px' }} />
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
                        <img src={selectedToken.img} alt="" width={30} height={30} />
                      </InputAdornment>
                    ),
                  },
                }}
                variant="outlined"
              />
            )}
          />
        </div>
      )}
      <div className={vault.type !== 'Earn' ? classes.gasExtraPadding : null}>
        <GasSpeed setParentSpeed={setSpeed} />
      </div>
      {selectedToken.isVault ? null : (
        <div className={classes.zapperSlippageContainer}>
          <Typography variant="h5" className={classes.title}>
            Slippage
          </Typography>{' '}
          <div className={classes.zapperSlippageForm}>
            <FormGroup style={{ width: '100%' }}>
              <ToggleButtonGroup value={zapperSlippage} exclusive onChange={handleZapperSlippage} aria-label="text alignment">
                <ToggleButton value={0.01} aria-label="0.1%">
                  1%
                </ToggleButton>
                <ToggleButton value={0.02} aria-label="0.2%">
                  2%
                </ToggleButton>
                <ToggleButton value={0.03} aria-label="0.3%">
                  3%
                </ToggleButton>
              </ToggleButtonGroup>
            </FormGroup>
            <FormGroup>
              <TextField
                className="slippageText"
                placeholder={0.5}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                fullWidth={false}
                value={zapperSlippage * 100}
                style={{ width: '25%', marginTop: '-7px', marginLeft: '10px' }}
                onChange={(event) => {
                  setZapperSlippage(event.currentTarget.value / 100);
                }}
              />
            </FormGroup>
          </div>
        </div>
      )}

      {(!account || !account.address) && (
        <div className={classes.actionButton}>
          <Button fullWidth disableElevation variant="contained" color="primary" size="large" onClick={onConnectWallet} disabled={loading || depositDisabled}>
            <Typography variant="h5">Connect Wallet</Typography>
          </Button>
        </div>
      )}
      {account && account.address && (
        <div className={classes.actionButton}>
          <Button fullWidth disableElevation variant="contained" color="primary" size="large" onClick={onWithdraw} disabled={loading || depositDisabled}>
            <Typography variant="h5" className={classes.flexInline}>
              {loading ? (
                <>
                  <CircularProgress size={25} />
                  {withdrawalStatus}
                </>
              ) : (
                `Withdraw to ${selectedToken.label}`
              )}
            </Typography>
          </Button>
        </div>
      )}
      {
        depositDisabledMessage &&
        <>
          <Typography variant='h5' className={ classes.disabledWarning }><InfoIcon className={ classes.disabledIcon } />Withdrawals Temporarily Dsiabled</Typography>
          <Typography className={ classes.disabledWarning }>
            { depositDisabledMessage }
          </Typography>
        </>
      }
    </div>
  );
}
