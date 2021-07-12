import React, { useState, useEffect } from 'react';
import { Typography, Button } from "@material-ui/core";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  YAxis,
  XAxis,
  Sector
} from "recharts";

import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from "../../utils";

import BigNumber from "bignumber.js";

import classes from "./systemVaultsGraph.module.css";

function CustomTooltip({ payload, active }) {
  if (active && payload && payload.length > 0) {
    return (
      <div className={classes.tooltipContainer}>
        <div className={classes.tooltipValue}>
          <Typography className={classes.val}>
            {payload[0].payload.name}
          </Typography>
          <Typography className={classes.valBold}>
            ${formatCurrency(payload[0].payload.balance)}
          </Typography>
        </div>
      </div>
    );
  }

  return null;
}

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius-2}
        outerRadius={outerRadius+2}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

const getVaultTypeDescription = (vault) => {
  if(!vault) {
    return ''
  }

  switch (vault.type) {
    case 'Earn':
      return `Before vaults, iEarn was the only product. This vault takes ${vault.symbol} and supplies it to different lending protocols to generate yield.`
    case 'v1':
      return `The first iteration of Yearn vaults. ${vault.symbol} is supplied to the vault and farmed using a strategy.`
    case 'v2':
      return `The second iteration of Yearn vaults. ${vault.symbol} is supplied to the vault and farmed using multiple strategies.`
    default:
      return 'You can filter by vault type Earn, Version 1, Version 2 or your invested vaults to drill down deeper into the vaults.'
  }
}

export default function SystemStrategiesGraph({ vaults, filters, layout, handleNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if(activeIndex > vaults.length) {
      setActiveIndex(0)
    }
  }, [vaults.length])

  const onExplore = (vault) => {
    handleNavigate('vault', vault);
  }

  if(!vaults || vaults.length === 0) {
    return (
      <div className={classes.vaultPerformanceGraph}>
        <div className={ classes.actions }>
          <Typography variant='h6'>Vaults In System</Typography>
        </div>
        <div className={ classes.piePlusHover }>
          <Skeleton variant='circle' width={200} height={200} className={ classes.pieSkelly }/>
          <div>
            <Skeleton width={ 200 } height={ 40 } className={ classes.pieInfoSkelly }/>
            <Skeleton width={ 200 } height={ 70 } className={ classes.pieInfoSkelly }/>
            <Skeleton width={ 200 } height={ 70 } className={ classes.pieInfoSkelly }/>
          </div>
        </div>
      </div>)
  }

  const limit = 16
  let data = []

  for(let i = 0; i < vaults.length; i++) {
    if(i < limit) {
      data.push(vaults[i])
    } else {
      if(i === limit) {
        data[limit] = {
          name: 'Other',
          balance: vaults[i].balance
        }
      } else {
        data[limit].balance = BigNumber(data[limit].balance).plus(vaults[i].balance).toNumber()
      }
    }
  }

  const total = data.reduce((acc, current) => {
    if(isNaN(current.balance)) {
      return acc
    }
    return BigNumber(acc).plus(current.balance).toNumber()
  }, 0)

  const COLORS = [
    "#0045ff",
    "#1162df",
    "#1d76ca",
    "#2686b8",
    "#2f96a7",
    "#4db6ac",
    "#009688",
    "#00796b",
    "#004d40",
    "#c57fa4",
    "#fa6faa",
    "#f5921d",
    "#f8682f",
    "#ff005e",
    "#da0052",
    "#b60046",
    "#93003a"
  ];
  const onPieEnter = (data, index) => {
    setActiveIndex(index);
  };

  if(layout === 'pie') {
    return (
      <div className={classes.vaultPerformanceGraph}>
        <div className={ classes.actions }>
          <Typography variant='h6'>Vaults In System</Typography>
        </div>
        <div className={ classes.piePlusHover }>
          <ResponsiveContainer width={300} height={260}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={ renderActiveShape }
                data={data}
                cx={150}
                cy={130}
                innerRadius={50}
                outerRadius={100}
                fill="#FF0000"
                stroke="none"
                dataKey="balance"
                onMouseMove={onPieEnter}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className={ classes.hoveredText }>
            <div className={ classes.displayInline }>
              <Typography className={ classes.title }>{ `${ data[activeIndex] ? data[activeIndex].name : ''} Vault` }</Typography>
              {
                data[activeIndex].name !== 'Other' &&
                <Button size='small' variant='outlined' onClick={ () => { onExplore(data[activeIndex]) } } className={ classes.exploreButton }>Explore</Button>
              }
            </div>
            <Typography className={ classes.subTitle }>{ getVaultTypeDescription(data[activeIndex]) }</Typography>
            <div className={ classes.value }>
              <Typography className={ classes.valueTitle }>Total Share</Typography>
              <Typography className={ classes.valueValue }>{ data[activeIndex] ? formatCurrency(BigNumber(data[activeIndex].balance).times(100).div(total).toFixed(2)) : "0" } %</Typography>
            </div>
            <div className={ classes.value }>
              <Typography className={ classes.valueTitle }>Total Value</Typography>
              <Typography className={ classes.valueValue }>$ { data[activeIndex] ? formatCurrency(data[activeIndex].balance) : "0" }</Typography>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={classes.vaultPerformanceGraph}>
        <div className={ classes.actionsBar }>
          <Typography variant='h6'>Vaults</Typography>
        </div>
        <ResponsiveContainer width={700} height={400}>
          <BarChart
            layout="vertical"
            width={700}
            height={400}
            data={data}
            margin={{
              top: 5,
              bottom: 5,
            }}
            barSize={12}
            barGap={5}
          >
            <Bar dataKey="balance" fill="#8884d8">
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
            <XAxis type="number"/>
            <YAxis type="category" dataKey="name" interval={0} width={120} />
            <Tooltip cursor={{fill: 'transparent'}}  content={<CustomTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
