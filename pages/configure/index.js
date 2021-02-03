import { useRouter } from 'next/router'
import { Typography } from '@material-ui/core'
import { withTheme } from '@material-ui/core/styles';
import classes from './configure.module.css'

function Configure({ theme }) {
  const router = useRouter()

  return (
    <div className={ classes.configureContainer }>
      <Typography variant='h3'>YEARN</Typography>
      <Typography variant='h4'>finance</Typography>
      <div className={ theme.palette.type === 'light' ? classes['dot-pulse'] : classes['dot-pulse-dark'] }></div>
    </div>
  )
}

export default withTheme(Configure)
