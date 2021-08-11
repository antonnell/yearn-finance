import { Typography, Tooltip } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { ETHERSCAN_URL } from '../../stores/constants';

import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import classes from './vaultStrategyCard.module.css';

export default function vaultStrategyCard({ strategy, vault }) {
  const onStrategyClicked = () => {
    window.open(`${ETHERSCAN_URL}address/${strategy.address}`);
  };

  const mapStrategyToDescription = (name, tokens) => {
    // generic farms
    if (name.includes('StrategyLenderYieldOptimiser')) {
      return `This strategy lends the ${tokens} on various lending platforms such as CREAM, AAVE or ALPHA HOMORA to gain yield.`;
    } else if (name.includes('StrategyGenericLevCompFarm')) {
      return `This strategy supplies the ${tokens} on Compound and borrows an additional amount of the ${tokens} to maximize COMP farming. Flashloans are used to obtain additional ${tokens} from dYdX in order to gain additional leverage and boost the APY. Earned COMP is harvested and sold for more ${tokens} and re-deposited into the vault.`;
    } else if (name.includes('StrategyAH2Earncy')) {
      return `Lends ${tokens} on Alpha Homora v2 to generate interest. Users of Alpha Homora borrow ${tokens} to perform leveraged yield-farming on Alpha’s platform.`;
    } else if (name.includes('StrategyIdle')) {
      return `This strategy supplies ${tokens} on IDLE.finance to farm COMP and IDLE. Rewards are harvested, sold for more ${tokens}, and deposited back to the vault.`;
    } else if (name.includes('StrategyCurve') && name.includes('VoterProxy')) {
      return `This vault accepts deposits of ${tokens} tokens obtained by supplying either aDai, aUSDC or aUSDT to the liquidity pool on Curve.fi. ${tokens} tokens are staked in the gauge on Curve.fi to earn CRV rewards. Rewards are swapped for one of the underlying assets and resupplied to the liquidity pool to obtain more ${tokens}.`;
    } else if (name.includes('StrategyDAI3pool')) {
      return `This vault deposits ${tokens} into the 3pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.`;
    } else if (name.includes('StrategyHegicETH') || name.includes('StrategyHegicWBTC')) {
      return `These three strategies work together to alternatively use HEGIC to buy ETH or WBTC lots on HEGIC.co. While the vault is building up the required 888,000 HEGIC needed to buy a lot, it lends it out on C.R.E.A.M to earn interest. The vault also keeps a buffer of HEGIC in reserve for withdrawals earning interest in CREAM.`;
    } else if (name.includes('StrategyMKRVaultDAIDelegate')) {
      return `Users deposit ETH, which is used to mint DAI from MakerDAO. DAI is then deposited into our v1 yDAI vault, which earns CRV. CRV is periodically harvested, sold for more ETH and re-deposited into the vault.`;
    } else if (name === 'IBLevComp') {
      return 'Supplies DAI on Compound and opens a long-term debt for an additional amount of DAI from Ironbank without the need for collateral, to maximize COMP farming. Earned COMP is harvested and sold for more DAI and re-deposited into the vault.';
    } else if (name.includes('StrategysteCurveWETHSingleSided')) {
      return 'Supplies WETH to the liquidity pool on Curve here to obtain steCRV tokens which it then puts into the v2 Curve stETH Pool yVault (yvsteCRV)to gain yield.';
    } else if (name.includes('StrategyeCurveWETHSingleSided')) {
      return 'Supplies WETH to the liquidity pool on Curve here to obtain eCRV tokens which it then puts into the v2 Curve sETH Pool yVault (yveCRV) to gain yield.';
    } else if (name.includes('DAOFeeClaim')) {
      return 'This vault converts your CRV into yveCRV, earning you a continuous share of Curve fees. The more converted, the greater the rewards. Every Friday, these can be claimed from the vault as 3Crv (Curve’s 3pool LP token).';
    } else if (name.includes('LPProfitSwitching')) {
      return 'Earn is a lending aggregator that strives to attain the highest yield for supported coins (DAI, USDC, USDT, TUSD, sUSD, or wBTC) at all times. It does this by programmatically shifting these coins between several lending protocols (AAVE, dYdX, and Compound) operating on the Ethereum blockchain.';
    } else if (name.includes('StrategyDAI3Pool')) {
      return 'This vault deposits DAI into the 3Pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.';
    } else if (name.includes('StrategyUSDC3pool')) {
      return 'This vault deposits USDC into the 3pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.';
    } else if (name.includes('StrategyUSDT3pool')) {
      return 'This vault deposits USDT into the 3pool on Curve.fi. The 3Crv tokens are then deposited into the Curve 3Pool yVault.';
    } else if (name.includes('StrategyTUSDypool')) {
      return 'Thıs vault deposits TUSD into the YPool on Curve.fi. The yCRV are then deposited into the Curve YPool yVault.';
    } else if (name.includes('StrategyVaultUSDC')) {
      return 'This vault deposits aLINK as collateral on Aave to borrow USDC. The USDC is deposited into the v1 USDC yVault. Profits are harvested and used to buy additional LINK, supplied as collateral on Aave in exchange for aLINK and re-deposited into the vault.';
    } else if (name.includes('StrategymUSDCurve')) {
      return 'This vault deposits mUSD into the mUSD/3Crv pool on Curve.fi. The crvMUSD is then deposited into the Curve mUSD Pool yVault.';
    } else if (name.includes('StrategyMakerYFIDAIDelegate')) {
      return 'This debt-based strategy opens a Maker Vault, locks up YFI, draws DAI and earns yield by depositing into Yearn DAI Vault.';
    } else if (name.includes('StrategySynthetixRewardsGeneric')) {
      return 'This universal strategy harvests farm of the week and can be easily refashioned for new farms as they appear.';
    } else if (name.includes('StrategyYearnVECRV')) {
      return 'This strategy claims weekly 3CRV rewards and uses them to acquire more yveCRV via market-buy or mint, depending on which is most efficient at time of harvest.';
    } else if (name.includes('Strategy1INCHGovernance')) {
      return 'Stakes 1INCH token on 1INCH DAO to collect governance rewards. Rewards are harvested and deposited back into the vault.';
    }

    else if (name.includes('StrategyMakerETHDAIDelegate')) {
      return 'This strategy uses ETH to mint DAI at MakerDAO. This newly minted DAI is then deposited into the v2 DAI yVault.';
    } else if (name.includes('PoolTogether')) {
      return `Supplies ${tokens} to the PoolTogether protocol to farm POOL. Rewards are harvested, sold for more ${tokens}, and deposited back into the vault. If it gets the prize of the week it will also be added to the vault.`;
    } else if (name.includes('StrategyAH2Earncy')) {
      return `Lends ${tokens} on Alpha Homora v2 to generate interest. Users of Alpha Homora borrow ${tokens} to perform leveraged yield-farming on Alpha Homora’s platform.`;
    } else if (name.includes('SingleSidedCrv')) {
      return `Deposits ${tokens} to a ${tokens} curve pool on curve.fi, and switches to the most profitable curve pool.`;
    } else if (name.includes('StrategyCurveIBVoterProxy')) {
      return `This vault accepts deposits of ib3CRV tokens obtained by supplying either cyDAI, cyUSDC, or cyUSDT to the liquidity pool on Curve in exchange for ib3CRV tokens. ib3CRV are staked in the gauge on Curve Finance to earn CRV rewards. Rewards are swapped for one of the underlying assets and resupplied to the liquidity pool to obtain more ib3CRV.`;
    } else if (name.includes('Curve') && name.includes('VoterProxy')) {
      return `This vault accepts deposits of ${tokens} tokens obtained by supplying supported tokens to the liquidity pool on Curve. ${tokens} tokens are staked in the gauge on Curve to earn CRV rewards. Rewards are swapped for one of the underlying assets and resupplied to the liquidity pool to obtain more ${tokens}.`;
    } else if (name.includes('StrategystETHCurve')) {
      return 'This vault accepts deposits of steCRV tokens obtained by supplying either ETH or stETH to the liquidity pool on Curve here. steCRV are staked in the gauge on curve.finance to earn CRV and LDO rewards. Rewards are swapped for WETH and resupplied to the liquidity pool to obtain more steCRV.';
    } else if (name.includes('StrategyRook')) {
      return `Supplies ${tokens} to KeeperDAO to farm ROOK. Rewards are harvested, sold for more ${tokens}, and deposited back into the vault.`
    } else if (name.includes('StrategySynthetixSusdMinter')) {
      return `Stakes SNX at Synthetix to mint sUSD. The newly minted sUSD is then deposited into the v2 sUSD yVault to earn yield. Yield from sUSD and rewards from weekly fees plus vested rewards (when claimable) are swapped for more SNX and re-deposited into the vault.`
    } else if (name.includes('Convex')) {
      return `Supplies ${tokens} to Convex Finance to farm CVX. Rewards are harvested, sold for more ${tokens}, and deposited back into the vault.`
    }

    else {
      return "I don't have a description for this strategy yet.";
    }
  };

  return (
    <div>
      <div className={classes.lineDivider}></div>
      <Accordion elevation="0">
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography className={classes.accHeading}>
            {!strategy ? <Skeleton /> : strategy.name}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className={classes.stratDescBox}>
          <Typography className={classes.stratDesc}>
            {mapStrategyToDescription(strategy.name, vault.tokenMetadata.displayName)}
          </Typography>
          </div>
          <Tooltip placement="right-start" arrow="true" title="View on Etherscan"><div className={classes.viewEtherscan} onClick={onStrategyClicked}>&nbsp;</div></Tooltip>
        </AccordionDetails>
      </Accordion>
    </div>
  );
}
