import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { lighten, makeStyles } from '@material-ui/core/styles';
import Skeleton from '@material-ui/lab/Skeleton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';

import PublishIcon from '@material-ui/icons/Publish';
import GetAppIcon from '@material-ui/icons/GetApp';

import BigNumber from 'bignumber.js'


import { formatCurrency, formatAddress } from '../../utils'

import * as moment from 'moment'

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  { id: 'symbol', numeric: false, disablePadding: false, label: 'Asset' },
  { id: 'balance', numeric: true, disablePadding: false, label: 'Available to deposit' },
  { id: 'stabilityFee', numeric: true, disablePadding: false, label: 'Stability Fee' },
  { id: 'liquidationFee', numeric: true, disablePadding: false, label: 'Liquidation Fee' },
];

function EnhancedTableHead(props) {
  const { classes, order, orderBy, rowCount, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={ 'default' }
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              <Typography variant='h5'>{headCell.label}</Typography>
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

const useToolbarStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
  },
  highlight:
    theme.palette.type === 'light'
      ? {
          color: theme.palette.secondary.main,
          backgroundColor: lighten(theme.palette.secondary.light, 0.85),
        }
      : {
          color: theme.palette.text.primary,
          backgroundColor: theme.palette.secondary.dark,
        },
  title: {
    flex: '1 1 100%',
  },
}));

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%'
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 750,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  inline: {
    display: 'flex',
    alignItems: 'center'
  },
  icon: {
    marginRight: '12px'
  },
  textSpaced: {
    lineHeight: '1.5'
  },
  cell: {
  },
  cellSuccess: {
    color: '#4eaf0a',
  },
  cellAddress: {
    cursor: 'pointer'
  },
  aligntRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  skelly: {
    marginBottom: '12px',
    marginTop: '12px'
  },
  skelly1: {
    marginBottom: '12px',
    marginTop: '24px'
  },
  skelly2: {
    margin: '12px 6px'
  },
  tableBottomSkelly: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
}));

export default function EnhancedTable({ cdps }) {
  const classes = useStyles();
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('balance');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if(!cdps) {
    return(<div className={classes.root}>
      <Skeleton variant="rect" width={ '100%' } height={40} className={ classes.skelly1} />
      <Skeleton variant="rect" width={ '100%' } height={70} className={ classes.skelly} />
      <Skeleton variant="rect" width={ '100%' } height={70} className={ classes.skelly} />
      <Skeleton variant="rect" width={ '100%' } height={70} className={ classes.skelly} />
      <Skeleton variant="rect" width={ '100%' } height={70} className={ classes.skelly} />
      <Skeleton variant="rect" width={ '100%' } height={70} className={ classes.skelly} />
    </div>)
  }

  const addressClicked = (row, direction) => {
    if(direction === 'from') {
      window.open(`${row.fromChain.explorer}/tx/${row.txid}`, '_blank')
    } else {
      window.open(`${row.toChain.explorer}/tx/${row.swaptx}`, '_blank')
    }
  }

  return (
    <div className={classes.root}>
      <TableContainer>
        <Table
          className={classes.table}
          aria-labelledby="tableTitle"
          size={'medium'}
          aria-label="enhanced table"
        >
          <EnhancedTableHead
            classes={classes}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rowCount={cdps.length}
          />
          <TableBody>
            {stableSort(cdps, getComparator(order, orderBy))
              .map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    tabIndex={-1}
                    key={row.txid}
                  >
                    <TableCell className={ classes.cell }>
                      <div className={ classes.inline }>
                        <img src={`${row.tokenMetadata ? row.tokenMetadata.icon : '/tokens/unknown-logo.png'}`} width={ 30 } height={ 30 } alt='' onError={(e)=>{e.target.onerror = null; e.target.src='/tokens/unknown-logo.png' }} className={ classes.icon } />
                        <div className={ classes.aligntRight}>
                          <Typography variant='h5' className={ classes.textSpaced }>{ row.tokenMetadata.symbol }</Typography>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={ classes.cell } align='right'>
                      <Typography variant='h5' className={ classes.textSpaced }>{ formatCurrency(row.tokenMetadata.balance) } { row.tokenMetadata.symbol }</Typography>
                    </TableCell>
                    <TableCell className={ classes.cell } align='right'>
                      <Typography variant='h5' className={ classes.textSpaced }>{ formatCurrency(row.stabilityFee) } %</Typography>
                    </TableCell>
                    <TableCell className={ classes.cell } align='right'>
                      <Typography variant='h5' className={ classes.textSpaced }>{ formatCurrency(row.liquidationFee) } %</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
