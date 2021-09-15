import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import Link from '@material-ui/core/Link';

// Icons
import MoreVertIcon from '@material-ui/icons/MoreVert';

import classes from './moreMenu.module.css';

const StyledMenu = withStyles({
  paper: {
    border: '1px solid rgba(104,108,122,0.3)',
    fontSize: '12px !important',
  },
  list: {
    fontSize: '12px !important',
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    {...props}
  />
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
  },
}))(MenuItem);

export default function CustomizedMenus() {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        className={classes.moreBtn}
        aria-controls="customized-menu"
        aria-haspopup="true"
        color="primary"
        onClick={handleClick}
      >
        <MoreVertIcon />
      </Button>
      <StyledMenu
      className={classes.moreMenu}
        id="customized-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <Link className={classes.moreLink} href="https://docs.yearn.finance/" target="_blank">
          <StyledMenuItem>
              <ListItemText primary="Documentation" />
          </StyledMenuItem>
        </Link>
        <Link className={classes.moreLink} href="https://gov.yearn.finance/" target="_blank">
          <StyledMenuItem>
              <ListItemText primary="Governance" />
          </StyledMenuItem>
        </Link>
        <Link className={classes.moreLink} href="https://docs.yearn.finance/resources/audits" target="_blank">
          <StyledMenuItem>
              <ListItemText primary="Security Audits" />
          </StyledMenuItem>
        </Link>
      </StyledMenu>
    </div>
  );
}
