# Yearn.Finance

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
- [ ] add withdrawal fee amount under withdraw
- [ ] add how many vault tokens you will get under deposit
- [ ] add balance auto refreshing every x seconds ( change to x48 subscription maybe )
- [ ] Refactor coingecko API call to be 1 call for all assets. If possible. (probably 2 (get all supported assets) filter addresses that are valid, do call)
- [ ] Change coingecko API to uniquote onchain calls if connected
- [ ] Include V1 style actions (deposit/withdraw) expanded for vaults. Similar to lending currently
- [ ] Add vault type groupings (Stablecoin, Bitcoin, Ethereum, )
- [ ] Expand stats screen to include a dashboard style view. Cards with customised vaults displayed. Graphs, the whole shebang.
- [ ] Graphs show $ value growth instead of just holdings
- [ ] implement mobx


## TO REVIEW WHETHER WE COMPLY/IF WE WANT TO COMPLY

- X48 Yearn.finance site review.
  https://hackmd.io/K2askVsDSVCuRx9mHqo4MQ

- Never try to open Metamask on first load
- Let users input amounts they don't have
- Multicall all the things
- Browse as any account
- Show data even if no web3 available
- Remember connected wallet
- Allow signing main transaction while approve is pending (this is just
- showing the status of transactions
- linking to etherscan transactions on completion or failure
- watch wallets and previously watched gets saved
- zaps
- WalletConnect support
- Direct link to contract's Etherscan page
- Add token to Metamask
- Lets users to desconnect the wallet
- WalletConnect option available
- ligth version for mobile
- show connected address (hide some characters)
- show connected network
- if testnet/manet changes.. don’t update instantly before showing a confirmation


 Expect txs to fail;
* Expect txs to take long time;
* Be network (main, xdai etc) aware;
* Do not connect to wallet instantly, wait till user request it.
* Support mobile options.

## Getting started
- Make sure to have nodejs installed. This app is built using [Next.js](https://nextjs.org/learn/basics/create-nextjs-app) and [react](https://reactjs.org/docs/getting-started.html).
- Run `npm install`
- Create an account on [etherscan](https://etherscan.io/) then go to [your API keys](https://etherscan.io/myapikey) page and add a new API key there.
- Create an account on [infura](https://infura.io/dashboard) and create an [ethereum project](https://infura.io/dashboard/ethereum) there. This will give you an endpoint url that looks like `https://mainnet.infura.io/v3/some_key`. Alternatively, you can also run your own [ethereum rpc server](https://geth.ethereum.org/docs/rpc/server) instead of infura.
- You can now run the nextjs app this way: `NEXT_PUBLIC_ETHERSCAN_KEY=your_etherscan_key NEXT_PUBLIC_PROVIDER=your_infura_endpoint_url npm run dev`
- That's it! You can now start hacking and submit PRs. Some of us are in [discord](http://discord.yearn.finance/) in the #dev channel if you have questions.