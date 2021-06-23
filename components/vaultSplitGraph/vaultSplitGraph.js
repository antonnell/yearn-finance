import React, { useState } from "react";
import { Typography } from "@material-ui/core";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Cell,
  Tooltip
} from "recharts";
import { formatCurrency } from "../../utils";

import BigNumber from "bignumber.js";

import classes from "./vaultSplitGraph.module.css";

function CustomTooltip({ payload, active }) {
  if (active && payload && payload.length > 0) {
    return (
      <div className={classes.tooltipContainer}>
        <div className={classes.tooltipValue}>
          <Typography className={classes.val}>
            {payload[0].payload.symbol}
          </Typography>
          <Typography className={classes.valBold}>
            {formatCurrency(payload[0].payload.value)}
          </Typography>
        </div>
      </div>
    );
  }

  return null;
}

export default function VaultSplitGraph({ vaults }) {

  const [activeIndex, setActiveIndex] = useState(0);

  const data = vaults
    .filter(vault => {
      return BigNumber(vault.balanceUSD).gt(0);
    })
    .map(vault => {
      return {
        address: vault.address,
        icon: vault.icon,
        displayName: vault.displayName,
        symbol: vault.symbol,
        value: BigNumber(vault.balanceUSD).toNumber()
      };
    });

  const COLORS = [
    "#0045ff",
    "#1162df",
    "#1d76ca",
    "#2686b8",
    "#2f96a7",
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
      <ResponsiveContainer width={60} height={60}>
        <PieChart width={60} height={60}>
          <Pie
            activeIndex={activeIndex}
            data={data}
            cx={25}
            cy={25}
            innerRadius={15}
            outerRadius={30}
            fill="#FF0000"
            stroke="none"
            dataKey="value"
            onMouseMove={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
