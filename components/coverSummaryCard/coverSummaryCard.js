import { Typography, Paper } from "@material-ui/core";
import Skeleton from "@material-ui/lab/Skeleton";
import BigNumber from "bignumber.js";
import { useRouter } from "next/router";
import * as moment from "moment";

import { formatCurrency } from "../../utils";

import classes from "./coverSummaryCard.module.css";

export default function coverSummaryCard({ coverProtocol }) {
  const getLogoForProtocol = protocol => {
    if (!protocol) {
      return "/tokens/unknown-logo.png";
    }
    return `/cover/${protocol.toLowerCase()}_icon.png`;
  };

  const claimPoolData = coverProtocol.poolData[0].claimPoolData;
  const claimAsset = coverProtocol.poolData[0].claimAsset;
  const collateralAsset = coverProtocol.poolData[0].collateralAsset;

  return (
    <Paper elevation={0} className={classes.coverSummaryContainer}>
      <div className={classes.coverTitleContainer}>
        <div className={classes.coverOutline}>
          <div className={classes.coverLogo}>
            {!coverProtocol ? (
              <Skeleton />
            ) : (
              <img
                src={getLogoForProtocol(coverProtocol.name)}
                onError={e => {
                  e.target.onerror = null;
                  e.target.src = "/tokens/unknown-logo.png";
                }}
                alt=""
                width={60}
                height={60}
              />
            )}
          </div>
        </div>
        <div className={classes.coverTitle}>
          <Typography variant="h1">
            {!coverProtocol ? (
              <Skeleton />
            ) : (
              `${coverProtocol.protocolDisplayName}`
            )}
          </Typography>
          <Typography>
            {!coverProtocol ? <Skeleton /> : `Claim Tokens`}
          </Typography>
        </div>
      </div>
      <div>
        <div className={classes.coverDetailGroup}>
          <Typography className={classes.coverDetailTitle}>
            Expiration Date
          </Typography>
          <Typography className={classes.coverDetailValue}>
            {moment(coverProtocol.expires[0] * 1000).format("Do MMM YYYY")}
          </Typography>
        </div>
        <div className={classes.coverDetailGroup}>
          <Typography className={classes.coverDetailTitle}>
            Liquidity Available
          </Typography>
          <Typography className={classes.coverDetailValue}>
            ${" "}
            {!claimPoolData ? (
              <Skeleton style={{ minWidth: "200px " }} />
            ) : (
              formatCurrency(claimPoolData.liquidity)
            )}
          </Typography>
        </div>
        <div className={classes.coverDetailGroup}>
          <Typography className={classes.coverDetailTitle}>
            Purchase Fee
          </Typography>
          <Typography className={classes.coverDetailValue}>
            {!claimPoolData ? (
              <Skeleton style={{ minWidth: "200px " }} />
            ) : (
              formatCurrency(BigNumber(claimPoolData.swapFee))
            )}{" "}
            %
          </Typography>
        </div>
        <div className={classes.coverDetailGroup}>
          <Typography className={classes.coverDetailTitle}>
            Token Price
          </Typography>
          <Typography className={classes.coverDetailValue}>
            ${" "}
            {!claimPoolData ? (
              <Skeleton style={{ minWidth: "200px " }} />
            ) : (
              formatCurrency(claimPoolData.price, 4)
            )}
          </Typography>
        </div>
        <div className={classes.coverDetailGroup}>
          <Typography className={classes.coverDetailTitle}>
            Cover Amount
          </Typography>
          <Typography className={classes.coverDetailValue}>
            ${" "}
            {!claimAsset ? (
              <Skeleton style={{ minWidth: "200px " }} />
            ) : (
              formatCurrency(claimAsset.balance)
            )}
          </Typography>
        </div>
      </div>
    </Paper>
  );
}
