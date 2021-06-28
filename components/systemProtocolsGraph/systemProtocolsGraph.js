import React, { useState } from "react";
import { Typography } from "@material-ui/core";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend
} from "recharts";
import Skeleton from '@material-ui/lab/Skeleton';
import { formatCurrency } from "../../utils";

import BigNumber from "bignumber.js";

import classes from "./systemProtocolsGraph.module.css";

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

export default function SystemProtocolsGraph({ protocols, filters }) {

  const [activeIndex, setActiveIndex] = useState(0);

  if(!protocols || protocols.length === 0) {
    return <Skeleton variant='circle' width={200} height={200} />
  }
  const limit = 16
  let data = []

  protocols = protocols.filter((vault) => {
    let { versions, search } = filters

    let returnValue = true;
    if (versions && versions.length > 0) {
      returnValue = versions.includes(vault.type);
    }

    if (returnValue === true && search && search !== '') {
      returnValue = vault.name.toLowerCase().includes(search.toLowerCase())
    }

    return returnValue;
  })

  for(let i = 0; i < protocols.length; i++) {
    if(i < limit) {
      data.push(protocols[i])
    } else {
      if(i === limit) {
        data[limit] = {
          name: 'Other',
          balance: protocols[i].balance
        }
      } else {
        data[limit].balance = BigNumber(data[limit].balance).plus(protocols[i].balance).toNumber()
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

  return (
    <div className={classes.vaultPerformanceGraph}>
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
          <text x={150} dx={-22} y={180} dy={10} fill="#999">
            Protocols
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
