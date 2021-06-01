import React, { useState, useEffect } from "react";
import { Typography } from "@material-ui/core";
import {
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import * as moment from "moment";
import BigNumber from "bignumber.js";
import Skeleton from "@material-ui/lab/Skeleton";
import { bnDec, formatCurrency } from "../../utils";
import { useRouter } from "next/router";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";

import { GET_VAULT_PERFORMANCE, ACCOUNT_CHANGED } from "../../stores/constants";

import stores from "../../stores/index.js";

import classes from "./vaultPerformanceGraph.module.css";

function CustomTooltip({ payload, active }) {
  if (active && payload && payload.length > 0) {
    return (
      <div className={classes.tooltipContainer}>
        {payload.length === 2 && (
          <React.Fragment>
            <div className={classes.tooltipInfo}>
              <div className={classes.tooltipIcon}>
                <div className={classes.blueDot}></div>
              </div>
              <div>
                <Typography>Balance</Typography>
                <Typography>{formatCurrency(payload[0].value)}</Typography>
              </div>
            </div>
            <div className={classes.tooltipInfo}>
              <div className={classes.tooltipIcon}>
                <div className={classes.orangeDot}></div>
              </div>
              <div>
                <Typography>Share Price:</Typography>
                <Typography>{formatCurrency(payload[1].value, 4)}</Typography>
              </div>
            </div>
          </React.Fragment>
        )}
        {payload.length === 1 && (
          <div className={classes.tooltipInfo}>
            <div className={classes.tooltipIcon}>
              <div className={classes.orangeDot}></div>
            </div>
            <div>
              <Typography>Share Price:</Typography>
              <Typography>{formatCurrency(payload[0].value, 4)}</Typography>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default function VaultPerformanceGraph({ vault }) {
  const router = useRouter();
  const [dataDuration, setDataDuration] = useState("Month");

  const storeAccount = stores.accountStore.getStore("account");
  const [account, setAccount] = useState(storeAccount);

  useEffect(() => {
    const accountChanged = () => {
      const storeAccount = stores.accountStore.getStore("account");
      setAccount(storeAccount);
    };

    stores.emitter.on(ACCOUNT_CHANGED, accountChanged);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CHANGED, accountChanged);
    };
  }, []);

  let data = [];

  const currentTime = new Date();
  const currentBlock = stores.accountStore.getStore("currentBlock");

  if (
    vault &&
    vault.historicData &&
    vault.historicData.getPricePerFullShare &&
    vault.historicData.getPricePerFullShare.length > 0
  ) {
    data = vault.historicData.getPricePerFullShare[0].values.map(
      (val, index) => {
        return {
          time: moment(
            currentTime - 13200 * (currentBlock - val.blockNumber)
          ).format("D MMM"),
          pricePerShare: BigNumber(val.value)
            .div(bnDec(18))
            .toPrecision(6),
          balanceOf: vault.historicData.balanceOf
            ? BigNumber(vault.historicData.balanceOf[0].values[index].value)
                .div(bnDec(18))
                .times(val.value)
                .div(bnDec(18))
                .toNumber()
            : 0
        };
      }
    );
  }

  if (
    vault &&
    vault.historicData &&
    vault.historicData.pricePerShare &&
    vault.historicData.pricePerShare.length > 0
  ) {
    data = vault.historicData.pricePerShare[0].values.map((val, index) => {
      return {
        time: moment(
          currentTime - 13200 * (currentBlock - val.blockNumber)
        ).format("D MMM"),
        pricePerShare: BigNumber(val.value)
          .div(bnDec(vault.decimals))
          .toPrecision(6),
        balanceOf: vault.historicData.balanceOf
          ? BigNumber(vault.historicData.balanceOf[0].values[index].value)
              .div(bnDec(18))
              .times(val.value)
              .div(bnDec(vault.decimals))
              .toNumber()
          : 0
      };
    });
  }

  const handleDataDuractionChanged = (event, newVal) => {
    setDataDuration(newVal);
    stores.dispatcher.dispatch({
      type: GET_VAULT_PERFORMANCE,
      content: { address: router.query.address, duration: newVal }
    });
  };

  return (
    <div className={classes.vaultPerformanceGraph}>
      <div className={classes.vaultDataToggle}>
        <ToggleButtonGroup
          className={classes.durationToggle}
          value={dataDuration}
          exclusive
          onChange={handleDataDuractionChanged}
        >
          <ToggleButton value="Week">Week</ToggleButton>
          <ToggleButton value="Month">Month</ToggleButton>
          <ToggleButton value="Year">Year</ToggleButton>
        </ToggleButtonGroup>
      </div>
      {!vault || data.length === 0 ? (
        <Skeleton
          variant="rect"
          width={window.innerWidth > 600 ? "100%" : window.innerWidth - 24}
          height={300}
        />
      ) : (
        <ResponsiveContainer
          width={window.innerWidth > 600 ? "99%" : window.innerWidth - 24}
          height={300}
        >
          <ComposedChart
            width={window.innerWidth > 600 ? 600 : window.innerWidth - 24}
            height={350}
            data={data}
          >
            <CartesianGrid strokeDasharray="5 8" vertical={false} />
            <Tooltip content={<CustomTooltip />} />
            <XAxis dataKey="time" tickCount={5} height={15} />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickCount={6}
              hide
              domain={[1, "dataMax"]}
            />{" "}
            <YAxis
              yAxisId="right"
              orientation="right"
              tickCount={6}
              tickLine={false}
              axisLine={false}
              allowDecimals
              width={50}
            />
            {account && account.address && (
              <Line
                type="monotone"
                yAxisId="right"
                dataKey="balanceOf"
                stroke="#2F80ED"
                dot={<div></div>}
                strokeWidth={3}
              />
            )}
            <Line
              type="monotone"
              yAxisId="left"
              dataKey="pricePerShare"
              stroke="#FF9029"
              dot={<div></div>}
              strokeWidth={3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
