import Head from "next/head";
import classes from "./layout.module.css";
import Header from "../header";
import Navigation from "../navigation/navigation";
import SnackbarController from "../snackbar/snackbarController";


import { Web3ReactProvider } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
export const siteTitle = "Yearn";

interface IProps{
  children:any;
  configure:any;
  backClicked:any;
  changeTheme:any;
}

type Props = IProps



function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider)
  library.pollingInterval = 12000
  return library
}

function Layout(props: Props) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
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
      <div className={classes.content}>
        {!props.configure && (
          <Header backClicked={props.backClicked} changeTheme={props.changeTheme} />
        )}
        <SnackbarController />
        <main>{props.children}</main>
      </div>
    </div>
    </Web3ReactProvider>

  );
}


export default Layout
