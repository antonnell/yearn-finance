import Invest from "./invest";
import Lend from "./lend";
import LTV from "./ltv";
import About from './about'
import System from './system'

import { useRouter } from "next/router";

function Home({ changeTheme, ...props }) {
  const router = useRouter();
  const activePath = router.asPath;
  if (activePath.includes("/invest")) {
    return <Invest props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/lend")) {
    return <Lend props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/ltv")) {
    return <LTV props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/stats")) {
    return <System props={props} changeTheme={changeTheme} />;
  } else {
    return <About props={props} changeTheme={changeTheme} />;
  }
}

export default Home;
