import React, { useState } from 'react';
import { Typography, Paper } from '@material-ui/core'
import { PieChart, Pie, Sector, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { useRouter } from 'next/router'
import { formatCurrency } from '../../utils'

import BigNumber from 'bignumber.js'

import classes from './cdpMintedGraph.module.css'

function CustomTooltip({ payload, label, active }) {
  if (active && payload && payload.length > 0) {
    return (
      <div className={ classes.tooltipContainer }>
        <div className={ classes.tooltipValue }>
          <Typography className={ classes.val }>{ payload[0].payload.symbol }</Typography>
          <Typography className={ classes.valBold }>${ formatCurrency(payload[0].payload.value) }</Typography>
        </div>
      </div>
    );
  }

  return null;
}

export default function LendBorrowGraph({ assets }) {
  const router = useRouter()

  const [ activeIndex, setActiveIndex ] = useState(0)

  const data = assets.filter((asset) => {
    return BigNumber(asset.debt).gt(0)
  }).map((asset) => {
    return {
      address: asset.address,
      icon: asset.tokenMetadata.icon,
      displayName: asset.tokenMetadata.displayName,
      symbol: asset.tokenMetadata.symbol,
      value: parseFloat(asset.debt)
    }
  })

  const COLORS = ['#C9FFCD', '#AAEBFF', '#FFE8B0', '#B4E4FF', '#B4C8FF', '#004BBC', '#4782ED', '#BDE7FF',  '#8EC3FF']
  const onPieEnter = (data, index) => {
    setActiveIndex(index)
  }

  return (
    <div className={ classes.vaultPerformanceGraph }>
      <ResponsiveContainer width={ 60 } height={ 60 }>
        <PieChart width={ 60 } height={ 60 }>
          <Pie
            activeIndex={ activeIndex }
            data={ data }
            cx={25}
            cy={25}
            innerRadius={15}
            outerRadius={30}
            fill="#2F80ED"
            stroke='none'
            dataKey="value"
            onMouseMove={ onPieEnter }
          >
          {
          	data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]}/>)
          }
          </Pie>
          <Tooltip content={<CustomTooltip />}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
