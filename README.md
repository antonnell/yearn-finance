# Yearn.Finance

[![Tests](https://github.com/antonnell/yearn-finance/workflows/Tests/badge.svg?branch=master)](https://github.com/antonnell/yearn-finance/actions?query=workflow%3ATests)

## TODO:
- [x] check values ( work in root token for all inputs, not processed/vault token)
- [x] add earn page
- [x] add cream lending
- [x] add cover protocol
- [x] add overall vault statistics
- [x] remember vault filter selections
- [x] Add row based view for dashboard/invest
- [x] Implement more breakpoints
- [x] add Backscrather vault
- [x] add withdrawal fee amount under withdraw
- [x] add how many vault tokens you will get under deposit
- [x] Graphs show $ value growth instead of just holdings
- [x] Add vault type groupings (Stablecoin, Bitcoin, Ethereum, )
- [ ] Expand stats screen to include a dashboard style view. Cards with customised vaults displayed. Graphs, the whole shebang.



map myInvestment filter to only return your investment balance/total vault * exposure.
improve mapTokenAddressToInfo() in investStore
improve loader information for system overview
'epxlore' - drill down into 1 vault.
asset descriptions - get more


## Getting started
- Make sure to have nodejs installed. This app is built using [Next.js](https://nextjs.org/learn/basics/create-nextjs-app) and [react](https://reactjs.org/docs/getting-started.html).
- Run `npm install`
- Create an account on [etherscan](https://etherscan.io/) then go to [your API keys](https://etherscan.io/myapikey) page and add a new API key there.
- Create an account on [infura](https://infura.io/dashboard) and create an [ethereum project](https://infura.io/dashboard/ethereum) there. This will give you an endpoint url that looks like `https://mainnet.infura.io/v3/some_key`. Alternatively, you can also run your own [ethereum rpc server](https://geth.ethereum.org/docs/rpc/server) instead of infura.
- You can now run the nextjs app this way: `NEXT_PUBLIC_ETHERSCAN_KEY=your_etherscan_key NEXT_PUBLIC_PROVIDER=your_infura_endpoint_url npm run dev`
- That's it! You can now start hacking and submit PRs. Some of us are in [discord](http://discord.yearn.finance/) in the #dev channel if you have questions.
