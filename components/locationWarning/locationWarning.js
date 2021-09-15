import { Dialog, Typography, Button } from '@material-ui/core';
import classes from "./locationWarning.module.css";

export default function locationWarning({ close }) {

  return (
    <Dialog fullScreen open={ true } onClose={close} >
      <div className={ classes.dialogContainer }>
        <div className={classes.warningContainer}>
          <img src='/logo-stacked.svg' className={ classes.warningIcon } />
          <Typography className={classes.para2} align='center'>
            Please take caution when using yearn.fi and any other defi product.
          </Typography>
          <Typography className={classes.para2} align='center'>
            Persons accessing the Website need to be aware that they are responsible themselves for the compliance with all local rules and regulations.
          </Typography>
          <Typography className={classes.para1} align='center'>
            Yearn.fi is unavailable to residences of United States of America.
          </Typography>
          <div className={ classes.buttonsContainer }>
            <Button
              fullWidth
              variant='contained'
              size='large'
              className={classes.primaryButton }
              onClick={close}>
              <Typography className={ classes.buttonTextPrimary }>I understand, proceed to the app</Typography>
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
