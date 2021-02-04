import React, { useState } from 'react';
import { Typography, Paper } from '@material-ui/core'
import { PieChart, Pie, Sector, ResponsiveContainer, Cell } from 'recharts';
import { useRouter } from 'next/router'
import { formatCurrency } from '../../utils'

import BigNumber from 'bignumber.js'

import classes from './vaultSplitGraph.module.css'

function CustomTooltip({ payload, label, active }) {
  if (active && payload && payload.length > 0) {
    return (
      <div className={ classes.tooltipContainer }>
        <Typography>Price per share</Typography>
        <Typography>{ payload[0].value }</Typography>
      </div>
    );
  }

  return null;
}

export default function VaultSplitGraph({ vaults }) {
  const router = useRouter()

  const [ activeIndex, setActiveIndex ] = useState(0)

  const data = vaults.filter((vault) => {
    return BigNumber(vault.balance).gt(0)
  }).map((vault) => {
    return {
      address: vault.address,
      icon: vault.icon,
      displayName: vault.displayName,
      symbol: vault.symbol,
      value: parseFloat(vault.balanceUSD)
    }
  })

  const COLORS = ['#103C64', '#004BBC', '#4782ED', '#BDE7FF',  '#8EC3FF']
  const onPieEnter = (data, index) => {
    setActiveIndex(index)
  }

  const sectorClicked = (payload) => {
    router.push('/invest/'+payload.address)
  }

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);

    return (
      <g>
        <image xlinkHref={payload.icon} width={ 70 } height={ 70 } x={cx-35} y={cy-35} onClick={ () => { sectorClicked(props.payload) } } />
        <Sector
          onClick={ () => { sectorClicked(props.payload) } }
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          onClick={ () => { sectorClicked(props.payload) } }
        />
        <text x={cx - 50} y={270} textAnchor={'start'} fill="#888">
          {`$ ${formatCurrency(value)}`}
        </text>
      </g>
    );
  };

  return (
    <div className={ classes.vaultPerformanceGraph }>
      <ResponsiveContainer width='99%' height={ 300 }>
        <PieChart width={ '99%' } height={300}>
          <Pie
            activeIndex={ activeIndex }
            activeShape={ renderActiveShape }
            data={ data }
            cx={150}
            cy={150}
            innerRadius={60}
            outerRadius={80}
            fill="#2F80ED"
            stroke='none'
            dataKey="value"
            onMouseMove={ onPieEnter }
          >
          {
          	data.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]}/>)
          }
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
