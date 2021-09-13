
import {withStyles, StyledComponentProps } from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import Switch from '@material-ui/core/Switch';

// import * as classes from  './header.module.css';
import { makeStyles } from '@material-ui/core/styles';



  


  const useStyles  = makeStyles((theme:any) =>({
    root: {
      width: 58,
      height: 32,
      padding: 0,
      margin: theme.spacing(1),
    },
    switchBase: {
      paddingTop: 1.5,
      width: '75%',
      margin: 'auto',
      '&$checked': {
        transform: 'translateX(28px)',
        color: '#212529',
        width: '30%',
        '& + $track': {
          backgroundColor: '#212529',
          border: `1px solid #212529`,
          opacity: 1,
        },
      },
      '&$focusVisible &$thumb': {
        color: '#ffffff',
        border: '6px solid #fff',
      },
      // '&$thumb': {
      //   color: '#ffffff',
      //   border: '6px solid #fff',
      // }
    },
    track: {
      borderRadius: 32 / 2,
      border:'1px solid rgba(128,128,128, 0.2)',
      backgroundColor: '#ffffff',
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'border']),
    },
    checked: {},
    focusVisible: {},

}))
  
interface IProps{
    icon: any;
    checkedIcon: any;
    checked: any;
    onChange: any;
  }

type SProps = IProps;
function StyledSwitch(props: SProps){
    const classes = useStyles();
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );

    }

export default StyledSwitch


