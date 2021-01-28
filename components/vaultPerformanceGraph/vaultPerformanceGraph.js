import React, { useState, useEffect } from 'react';
import { Typography, Button, ButtonGroup } from '@material-ui/core'
import { ComposedChart, Area, Line, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import * as moment from 'moment';
import BigNumber from 'bignumber.js'
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import AttachMoneyicon from '@material-ui/icons/AttachMoney';
import Skeleton from '@material-ui/lab/Skeleton';
import { bnDec, formatCurrency } from  '../../utils'
import { useRouter } from 'next/router'
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import { GET_VAULT_PERFORMANCE, ACCOUNT_CHANGED } from '../../stores/constants'

import stores from '../../stores/index.js'

import classes from './vaultPerformanceGraph.module.css'

function CustomTooltip({ payload, label, active }) {
  if (active && payload && payload.length > 0) {
    return (
      <div className={ classes.tooltipContainer }>
        { payload.length === 2 && (
          <React.Fragment>
            <div className={ classes.tooltipInfo}>
              <div className={ classes.tooltipIcon } >
                <AttachMoneyicon className={ classes.growthIcon } />
              </div>
              <div>
                <Typography>Holdings</Typography>
                <Typography>{ formatCurrency(payload[0].value) }</Typography>
              </div>
            </div>
            <div className={ classes.tooltipInfo}>
              <div className={ classes.tooltipIcon } >
                <TrendingUpIcon className={ classes.growthIcon } />
              </div>
              <div>
                <Typography>Share Price:</Typography>
                <Typography>{ formatCurrency(payload[1].value, 4) }</Typography>
              </div>
            </div>
          </React.Fragment>
        )}
        { payload.length === 1 && (
          <div className={ classes.tooltipInfo}>
            <div className={ classes.tooltipIcon } >
              <TrendingUpIcon className={ classes.growthIcon } />
            </div>
            <div>
              <Typography>Share Price:</Typography>
              <Typography>{ formatCurrency(payload[0].value, 4) }</Typography>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function VaultPerformanceGraph({ vault }) {

  const router = useRouter()
  const [ dataDuration, setDataDuration ] = useState('Month')

  const storeAccount = stores.accountStore.getStore('account')
  const [ account, setAccount ] = useState(storeAccount)

  useEffect(() => {
    const accountChanged = () => {
      const storeAccount = stores.accountStore.getStore('account')
      setAccount(storeAccount)
    }

    stores.emitter.on(ACCOUNT_CHANGED, accountChanged)
    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged)
    }
  }, [])

  let data = []

  const currentTime = new Date()
  const currentBlock = stores.accountStore.getStore('currentBlock')

  if(vault && vault.historicData && vault.historicData.getPricePerFullShare && vault.historicData.getPricePerFullShare.length > 0) {
    data = vault.historicData.getPricePerFullShare[0].values.map((val, index) => {
      return {
        time: moment(currentTime - 13200*(currentBlock - val.blockNumber)).format('Do MMM'),
        pricePerShare: BigNumber(val.value).div(bnDec(18)).toNumber(),
        balanceOf: vault.historicData.balanceOf ? BigNumber(vault.historicData.balanceOf[0].values[index].value).div(bnDec(18)).toNumber() : 0
      }
    })
  }

  if(vault && vault.historicData && vault.historicData.pricePerShare && vault.historicData.pricePerShare.length > 0) {
    data = vault.historicData.pricePerShare[0].values.map((val, index) => {
      return {
        time: moment(currentTime - 13200*(currentBlock - val.blockNumber)).format('Do MMM'),
        pricePerShare: BigNumber(val.value).div(bnDec(18)).toNumber(),
        balanceOf: vault.historicData.balanceOf ? BigNumber(vault.historicData.balanceOf[0].values[index].value).div(bnDec(18)).toNumber() : 0
      }
    })
  }

  const handleDataDuractionChanged = (event, newVal) => {
    setDataDuration(newVal)
    stores.dispatcher.dispatch({ type: GET_VAULT_PERFORMANCE, content: {  address: router.query.address, duration: newVal } })
  }

  return (
    <div className={ classes.vaultPerformanceGraph }>
      <div className={ classes.vaultDataToggle }>
        <ToggleButtonGroup
          value={ dataDuration }
          exclusive
          onChange={ handleDataDuractionChanged }
        >
          <ToggleButton value="Week" >
            Week
          </ToggleButton>
          <ToggleButton value="Month">
            Month
          </ToggleButton>
          <ToggleButton value="Year">
            Year
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      { (!vault || data.length === 0) ?
        <Skeleton variant="rect" width={ (window.innerWidth > 600 ? 600 : (window.innerWidth-24)) } height={300} /> :
        <ResponsiveContainer width={ (window.innerWidth > 600 ? 600 : (window.innerWidth-24)) } height={ 300 }>
          <ComposedChart
            width={ (window.innerWidth > 600 ? 600 : (window.innerWidth-24) ) }
            height={ 350 }
            data={data}
            >
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.6}/>
                <stop offset="70%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip content={<CustomTooltip />}/>
            <XAxis dataKey="time" tickCount={5} />

            <YAxis yAxisId="left" tickLine={false} axisLine={false} padding={{ top: 50, bottom: 50 }} hide domain={[1, 'dataMax']} /> />
            <YAxis yAxisId="right" orientation='right' tickCount={3} tickLine={false} axisLine={false} hide />

            { account && account.address && <Area type="monotone" yAxisId="right" dataKey="balanceOf" stroke="#2F80ED" fillOpacity={1} fill="url(#colorUv)"  /> }
            <Line type='natural' yAxisId="left" dataKey="pricePerShare" stroke="#888" dot={<div></div>} />
          </ComposedChart>
        </ResponsiveContainer>
      }
    </div>
  )
}
