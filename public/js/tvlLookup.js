$(document).ready(function(){

  function convertToInternationalCurrencySystem (labelValue) {
    // Nine Zeroes for Billions
    return Math.abs(Number(labelValue)) >= 1.0e+9

    ? (Math.abs(Number(labelValue)) / 1.0e+9).toFixed(3) + " Billion"
    : Math.abs(Number(labelValue)) >= 1.0e+6
    ? (Math.abs(Number(labelValue)) / 1.0e+6).toFixed(3) + " Million"
    : Math.abs(Number(labelValue)) >= 1.0e+3
    ? (Math.abs(Number(labelValue)) / 1.0e+3).toFixed(3) + " Thousand"
    : Math.abs(Number(labelValue));
  }

  function formatDateToObjectKey (date) {
    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate();

    return `${[date.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
          ].join('-')}T00:00:00+00:00`;
  }

  //current TVL
  const URL = 'https://yearn.science/v1/tvl/latest'
  $.ajax({ url: URL,
    context: document.body,
    success: function(response){
      let tvl = response?.tvl
      $('#tvl-current').html(`$ ${convertToInternationalCurrencySystem(tvl)}`);
    }});

  // historic TVL change
  const HISTORIC_URL = 'https://yearn.science/v1/tvl'
  $.ajax({ url: HISTORIC_URL,
    context: document.body,
    success: function(response){
      const date = new Date()

      let today = formatDateToObjectKey(date)

      date.setDate(date.getDate()-1);
      let yesterday = formatDateToObjectKey(date)

      date.setDate(date.getDate()-29);
      let last_month = formatDateToObjectKey(date)

      let tvl = response[today]
      let tvl_yesterday = response[yesterday]
      let tvl_last_month = response[last_month]

      let isLoss = false
      let tvlChange = tvl - tvl_yesterday
      if(tvlChange < 0) {
        tvlChange = tvlChange * -1
        isLoss = true
      }

      $('#tvl-day').html(`${isLoss ? '-' : '+'} $ ${convertToInternationalCurrencySystem(tvlChange)}`);
      $('#tvl-day-indicator').html(`${isLoss ? '▼' : '▲'}`).addClass(isLoss ? 'indicator-down' : 'indicator-up').removeClass(isLoss ? 'indicator-up' : 'indicator-down');

      isLoss = false
      tvlChange = tvl - tvl_last_month
      if(tvlChange < 0) {
        tvlChange = tvlChange * -1
        isLoss = true
      }

      $('#tvl-month').html(`${isLoss ? '-' : '+'} $ ${convertToInternationalCurrencySystem(tvlChange)}`);
      $('#tvl-month-indicator').html(`${isLoss ? '▼' : '▲'}`).addClass(isLoss ? 'indicator-down' : 'indicator-up').removeClass(isLoss ? 'indicator-up' : 'indicator-down');
    }});
});
