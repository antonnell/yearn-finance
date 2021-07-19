import React, { useState, useEffect } from "react";
import { Typography } from "@material-ui/core";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Sector
} from "recharts";

import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from "../../utils";

import BigNumber from "bignumber.js";

import classes from "./systemAssetsGraph.module.css";

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

export default function SystemProtocolsGraph({ assets, layout }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if(activeIndex > assets.length) {
      setActiveIndex(0)
    }
  }, [assets.length])

  if(!assets || assets.length === 0) {
    return (
      <div className={classes.vaultPerformanceGraph}>
        <div className={ classes.actions }>
          <Typography variant='h6'>Asset Exposure</Typography>
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

  for(let i = 0; i < assets.length; i++) {
    if(i < limit) {
      data.push(assets[i])
    } else {
      if(i === limit) {
        data[limit] = {
          name: 'Other',
          balance: assets[i].balance
        }
      } else {
        data[limit].balance = BigNumber(data[limit].balance).plus(assets[i].balance).toNumber()
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
          <Typography variant='h6'>Asset Exposure</Typography>
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
            <Typography className={ classes.title }>{ `${data[activeIndex] ? data[activeIndex].name : ''}` }</Typography>
            <Typography className={ classes.subTitle }>{ (data[activeIndex] && data[activeIndex].description) ? data[activeIndex].description : 'You can filter by vault type Earn, Version 1, Version 2 or your invested vaults to drill down deeper into the vaults.' }</Typography>
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
          <Typography variant='h6'>Assets</Typography>
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
            <YAxis type="category" dataKey="name" interval={0} width={120}/>
            <Tooltip cursor={{fill: 'transparent'}}  content={<CustomTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
