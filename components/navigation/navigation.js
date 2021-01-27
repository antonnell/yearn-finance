import { Typography, Paper } from '@material-ui/core'

import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import BarChartIcon from '@material-ui/icons/BarChart';

import { useRouter } from 'next/router'

import classes from './navigation.module.css'

export default function Navigation({ children }) {
  const router = useRouter()

  function handleNavigate(route) {
    router.push(route)
  }

  console.log(router)

  const activePath = router.pathname

  return (
    <div className={ classes.navigationContainer }>
      <div className={ classes.navigationHeading }>
        <Typography variant='h3'>YEARN</Typography>
        <Typography variant='h4'>finance</Typography>
      </div>

      <div className={ classes.navigationContent }>
        <div className={ activePath.includes('/invest') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/invest') }}>
          <div className={ classes.navigationOptionIcon_invest } ></div>
          <Typography variant='h2'>Invest</Typography>
        </div>
        <div className={ activePath.includes('/insure') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/insure') }}>
          <div className={ classes.navigationOptionIcon_insure } ></div>
          <Typography variant='h2'>Insure</Typography>
        </div>
        <div className={ activePath.includes('/lend') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/lend') }}>
          <div className={ classes.navigationOptionIcon_lending } ></div>
          <Typography variant='h2'>Lend</Typography>
        </div>
        <div className={ activePath.includes('/stats') ? classes.navigationOptionActive : classes.navigationOption } onClick={ () => { handleNavigate('/stats') }}>
          <BarChartIcon className={ classes.navigationOptionIcon } />
          <Typography variant='h2'>Stats</Typography>
        </div>
      </div>

      <div className={ classes.socials }>
        <div className={ `${classes.socialButton} ${classes.telegram}` }></div>
        <div className={ `${classes.socialButton} ${classes.twitter}` }></div>
        <div className={ `${classes.socialButton} ${classes.medium}` }></div>
      </div>
    </div>
  )
}
