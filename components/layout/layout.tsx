import Head from "next/head";
import classes from "./layout.module.css";
import Header from "../header/header";
import Navigation from "../navigation/navigation";
import SnackbarController from "../snackbar/snackbarController";

import Web3 from "web3";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Fortmatic from "fortmatic";
import Modal from '../../components/accountManager/test/Modal';
import ModalResult from '../../components/accountManager/test/ModalResult';
import Loader from "../../components/accountManager/Loader";


import { useState } from "react";
import { apiGetAccountAssets } from "../../utils/helpers/api";
import { getChainData } from "../../utils/helpers/utilities";
import styled from "styled-components";
import { IAssetData } from "../../utils/helpers/types";
import stores from "../../stores";

// import AccountManager from "../../stores/accountManager";
export const siteTitle = "Yearn";

const SModalContainer = styled.div`
  width: 100%;
  position: relative;
  word-wrap: break-word;
`;

const SModalTitle = styled.div`
  margin: 1em 0;
  font-size: 20px;
  font-weight: 700;
`;

const SModalParagraph = styled.p`
  margin-top: 30px;
`;

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

interface IAppState {
  fetching: boolean;
  address: string;
  web3: any;
  provider: any;
  connected: boolean;
  chainId: number;
  networkId: number;
  assets: IAssetData[];
  showModal: boolean;
  pendingRequest: boolean;
  result: any | null;
}


interface IProps {
  children: any
  configure: any
  backClicked: any
  changeTheme: any
}

type Props= IProps;



function initWeb3(provider: any) {
  const web3: any = new Web3(provider);
  
    web3.eth.extend({
      methods: [
        {
          name: "chainId",
          call: "eth_chainId",
          outputFormatter: web3.utils.hexToNumber
        }
      ]
    });
  
    return web3;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: "",
  web3: null,
  provider: null,
  connected: false,
  chainId: 1,
  networkId: 1,
  assets: [],
  showModal: false,
  pendingRequest: false,
  result: null
};


function Layout(props: Props){

 const getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: process.env.REACT_APP_INFURA_ID
        }
      },
    //   torus: {
    //     package: Torus
    //   },
      fortmatic: {
        package: Fortmatic,
        options: {
          key: process.env.REACT_APP_FORTMATIC_KEY
        }
      },
    //   authereum: {
    //     package: Authereum
    //   },
    //   bitski: {
    //     package: Bitski,
    //     options: {
    //       clientId: process.env.REACT_APP_BITSKI_CLIENT_ID,
    //       callbackUrl: window.location.href + "bitski-callback.html"
    //     }
    //   }
    };
    return providerOptions;
  };

  const [state, setState ] = useState<IAppState>(INITIAL_STATE);
  const getNetwork = () => getChainData(state.chainId).network;

  const web3Modal_temp = new Web3Modal({
    network: getNetwork(),
    cacheProvider: true,
    providerOptions: getProviderOptions()
  })

  const [web3Modal, setWeb3Modal] = useState<Web3Modal>(web3Modal_temp)
  const [web3Init, setWeb3Init] = useState(false);

  const getAccountAssets = async () => {
    const { address, chainId } = state;
    setState({...state, fetching: true });
    try {
      // get account balances
      const assets = await apiGetAccountAssets(address, chainId);

      await setState({...state, fetching: false, assets });
    } catch (error) {
      console.error(error); // tslint:disable-line
      await setState({...state,  fetching: false });
    }
  };

  const onConnect = async () => {
    const provider = await web3Modal.connect();

    await subscribeProvider(provider);

    const web3: any = initWeb3(provider);

    const accounts = await web3.eth.getAccounts();

    const address = accounts[0];

    const networkId = await web3.eth.net.getId();

    const chainId = await web3.eth.chainId();
   
    console.log('state here --->',{
      ...state,
        web3,
        provider,
        connected: true,
        address,
        chainId,
        networkId
      } )
      stores.accountStore.setStore({
        account: { address: address} ,
        web3context:{library: {provider: provider}},
        accountManager  :{
          ...state,
          web3,
          provider,
          connected: true,
          address,
          chainId,
          networkId
        }
      })
    await setState({
    ...state,
      web3,
      provider,
      connected: true,
      address,
      chainId,
      networkId
    });
    await getAccountAssets();
  };
  
  const subscribeProvider = async (provider) => {
    if (!provider.on) {
      return;
    }
    provider.on("close", () => this.resetApp());
    provider.on("accountsChanged", async (accounts: string[]) => {
      await setState({...state,  address: accounts[0] });
      stores.accountStore.setStore({
        account: { address: accounts[0] },
        accountManager  :{...state,  address: accounts[0] },
        web3context: { library: { provider: provider } }
      })
      await getAccountAssets();
    });
    provider.on("chainChanged", async (chainId: number) => {
      const { web3 } = state;
      const networkId = await web3.eth.net.getId();
      await setState({...state,  chainId, networkId });
      stores.accountStore.setStore({
        accountManager  :{...state,  chainId, networkId }
      })
      await getAccountAssets();
    });

    provider.on("networkChanged", async (networkId: number) => {
      const { web3 } = state;
      const chainId = await web3.eth.chainId();
      await setState({...state,  chainId, networkId });
      stores.accountStore.setStore({
        accountManager  :{...state,  chainId, networkId }
      })
      await getAccountAssets();
    });
  };


  if(!web3Init){
    console.log('running',web3Modal,state);
    if(web3Modal.cachedProvider){
      onConnect();
      setWeb3Init(true);
    }else{

    }
   

    // setWeb3Modal(web3Modal_temp)
  }


  const toggleModal = () =>
        setState({ ...state, showModal: !state.showModal });

  const resetApp = async () => {
            const { web3 } = state;
            if (web3 && web3.currentProvider && web3.currentProvider.close) {
              await web3.currentProvider.close();
            }
            await web3Modal.clearCachedProvider();
            setState({ ...INITIAL_STATE });
            stores.accountStore.setStore({
              account: null ,
              web3context:null,
              accountManager  :INITIAL_STATE
            })
          }
 
  const {
    assets,
    address,
    connected,
    chainId,
    fetching,
    showModal,
    pendingRequest,
    result
  } = state;
  return (
    <div className={classes.container}>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <link
          rel="preload"
          href="/fonts/Inter/Inter-Regular.ttf"
          as="font"
          crossOrigin=""
        />
        <link
          rel="preload"
          href="/fonts/Inter/Inter-Bold.ttf"
          as="font"
          crossOrigin=""
        />
        <meta name="description" content="Yearn.finance" />
        <meta name="og:title" content="Yearn" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      {!props.configure && (
        <Navigation backClicked={props.backClicked} changeTheme={props.changeTheme} />
      )}
      {/* <AccountManager /> */}
      <div className={classes.content}>
        {!props.configure && (
          <Header backClicked={props.backClicked} changeTheme={props.changeTheme}
                toggleModal={onConnect}
                logout={resetApp}
           />
        )}
        <SnackbarController />
        <main>{props.children}</main>

        <Modal show={showModal} toggleModal={toggleModal}>
          {pendingRequest ? (
            <SModalContainer>
              <SModalTitle>{"Pending Call Request"}</SModalTitle>
              <SContainer>
                <Loader />
                <SModalParagraph>
                  {"Approve or reject request using your wallet"}
                </SModalParagraph>
              </SContainer>
            </SModalContainer>
          ) : result ? (
            <SModalContainer>
              <SModalTitle>{"Call Request Approved"}</SModalTitle>
              <ModalResult>{result}</ModalResult>
            </SModalContainer>
          ) : (
            <SModalContainer>
              <SModalTitle>{"Call Request Rejected"}</SModalTitle>
            </SModalContainer>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default Layout