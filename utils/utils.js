import BigNumber from 'bignumber.js'

// todo: get navigator declared somehow? probably an issue with using nextjs
// function getLang() {
//  if (window.navigator.languages != undefined)
//   return window.navigator.languages[0];
//  else
//   return window.navigator.language;
// }

export function formatCurrency(amount, decimals=2) {
  if(amount && !isNaN(amount)) {
    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return formatter.format(amount)
  } else {
    return null
  }
}

export function formatAddress(address) {
  if (address) {
    address = address.substring(0,6)+'...'+address.substring(address.length-4,address.length)
    return address
  } else {
    return null
  }
}

export function bnDec(decimals) {
  return new BigNumber(10)
          .pow(parseInt(decimals))
}
