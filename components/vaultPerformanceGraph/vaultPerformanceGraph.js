import React, { useState } from 'react';
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

import { GET_VAULT_PERFORMANCE } from '../../stores/constants'

import stores from '../../stores/index.js'

import classes from './vaultPerformanceGraph.module.css'

function CustomTooltip({ payload, label, active }) {

  if (active && payload && payload.length > 0) {
    return (
      <div className={ classes.tooltipContainer }>
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
      </div>
    );
  }

  return null;
}

export default function VaultPerformanceGraph({ vault }) {

  const router = useRouter()
  const [ dataDuration, setDataDuration ] = useState('Month')

  let data = []

  if(vault && vault.historicData && vault.historicData.getPricePerFullShare && vault.historicData.getPricePerFullShare.length > 0) {
    data = vault.historicData.getPricePerFullShare[0].values.map((val, index) => {
      return {
        time: val.blockNumber,
        pricePerShare: BigNumber(val.value).div(bnDec(18)).toNumber(),
        balanceOf: BigNumber(vault.historicData.balanceOf[0].values[index].value).div(bnDec(18)).toNumber()
      }
    })
  }

  if(vault && vault.historicData && vault.historicData.pricePerShare && vault.historicData.pricePerShare.length > 0) {
    data = vault.historicData.pricePerShare[0].values.map((val, index) => {
      return {
        time: val.blockNumber,
        pricePerShare: BigNumber(val.value).div(bnDec(18)).toNumber(),
        balanceOf: BigNumber(vault.historicData.balanceOf[0].values[index].value).div(bnDec(18)).toNumber()
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

            <Area type="monotone" yAxisId="right" dataKey="balanceOf" stroke="#2F80ED" fillOpacity={1} fill="url(#colorUv)"  />
            <Line type='natural' yAxisId="left" dataKey="pricePerShare" stroke="#888" dot={<div></div>} />
          </ComposedChart>
        </ResponsiveContainer>
      }
    </div>
  )
}
