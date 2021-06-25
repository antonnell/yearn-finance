import Invest from "./invest";
import Stats from "./stats";
import Lend from "./lend";
import LTV from "./ltv";
import CDP from "./cdp";
import About from './about'
import { useRouter } from "next/router";

function Home({ changeTheme, ...props }) {
  const router = useRouter();
  const activePath = router.asPath;
  if (activePath.includes("/lend")) {
    return <Lend props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/ltv")) {
    return <LTV props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/stats")) {
    return <Stats props={props} changeTheme={changeTheme} />;
  } else if (activePath.includes("/cdp")) {
    return <CDP props={props} changeTheme={changeTheme} />;
  } else {
    return <About props={props} changeTheme={changeTheme} />;
  }
}

export default Home;
