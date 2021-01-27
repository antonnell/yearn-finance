import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Typography } from '@material-ui/core'
import classes from './configure.module.css'

function Configure() {
  const router = useRouter()

  return (
    <div className={ classes.configureContainer }>
      <Typography variant='h3'>YEARN</Typography>
      <Typography variant='h4'>finance</Typography>
      <div className={ classes['dot-pulse'] }></div>
    </div>
  )
}

export default Configure
