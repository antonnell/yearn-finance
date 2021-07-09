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

export default function SystemProtocolsGraph({ assets, filters, layout, handleNavigate }) {

  const [activeIndex, setActiveIndex] = useState(0);

  const onExplore = () => {
    handleNavigate('assets');
  }

  if(!assets || assets.length === 0) {
    return <Skeleton variant='circle' width={200} height={200} />
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
          <Button variant='outlined' className={ classes.exploreButton } onClick={onExplore}>
            <Typography variant='h5'>Explore</Typography>
          </Button>
        </div>
        <ResponsiveContainer width={700} height={400}>
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={ renderActiveShape }
              data={data}
              cx={150}
              cy={180}
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
            <Legend layout='vertical' align='right' verticalAlign='top' iconType='square' width={300} />
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } else {
    return (
      <div className={classes.vaultPerformanceGraph}>
        <div className={ classes.actionsBar }>
          <Typography variant='h6'>Assets</Typography>
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
            <YAxis type="category" dataKey="name" interval={0} width={120}/>
            <Tooltip cursor={{fill: 'transparent'}}  content={<CustomTooltip />} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}
