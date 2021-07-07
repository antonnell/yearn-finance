import React, { useState } from "react";
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
  XAxis
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

export default function SystemStrategiesGraph({ vaults, filters, layout, handleNavigate }) {

  const [activeIndex, setActiveIndex] = useState(0);

  const onExplore = () => {
    handleNavigate('strategies');
  }

  if(!vaults || vaults.length === 0) {
    return <Skeleton variant='circle' width={200} height={200} />
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
          <Button variant='outlined' className={ classes.exploreButton } onClick={onExplore}>
            <Typography variant='h5'>Explore</Typography>
          </Button>
        </div>
        <ResponsiveContainer width={700} height={400}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              data={data}
              cx={150}
              cy={180}
              innerRadius={80}
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
            <Legend layout='vertical' align='right' verticalAlign='top' iconType='square' width={300} />
            <Tooltip content={<CustomTooltip />} />
            <text x={150} dx={-20} y={180} dy={10} fill="#999">
              Vaults
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } else {
    return (
      <div className={classes.vaultPerformanceGraph}>
        <div className={ classes.actionsBar }>
          <Typography variant='h6'>Vaults</Typography>
          <Button variant='outlined' className={ classes.exploreButton } onClick={onExplore}>
            <Typography variant='h5'>Explore</Typography>
          </Button>
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
