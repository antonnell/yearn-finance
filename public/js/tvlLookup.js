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

  //only doing current TVL
  const URL = 'https://yearn.science/v1/tvl/latest'
  $.ajax({ url: URL,
    context: document.body,
    success: function(response){
      let tvl = response?.tvl
      $('#tvl-current').html(`$ ${convertToInternationalCurrencySystem(tvl)}`);
    }});




  //
  // const currentTimestamp = Date.now() / 1000 | 0
  //
  // $.ajax({ url: `https://ec2-3-239-19-233.compute-1.amazonaws.com/api/query?query=sum%28yearn%7Bparam%3D%22tvl%22%7D%29+%2B+avg%28yearn%7Bparam%3D%22vecrv+balance%22%7D%29+*+avg%28yearn%7Bparam%3D%22crv+price%22%7D%29+%2B+sum%28yearn_vault%7Bparam%3D%22tvl%22%7D%29+%2B+sum%28iearn%7Bparam%3D%22tvl%22%7D%29+%2B+sum%28ironbank%7Bparam%3D%22tvl%22%7D%29+-+sum%28yearn%7Bparam%3D%22tvl%22%2Cvault%3D~%22curve.fi%2F%28y%7Cbusd%29%22%7D%29&time=${currentTimestamp}`,
  //   context: document.body,
  //   success: function(response){
  //     let tvl = response?.data?.result[0]?.value[1]
  //
  //     $('#tvl-current').html(`$ ${convertToInternationalCurrencySystem(tvl)}`);
  //   }});
  //
  // $.ajax({ url: `https://ec2-3-239-19-233.compute-1.amazonaws.com/api/query_range?query=sum(yearn%7Bparam%3D%22tvl%22%7D)%20%2B%20avg(yearn%7Bparam%3D%22vecrv%20balance%22%7D)%20*%20avg(yearn%7Bparam%3D%22crv%20price%22%7D)%20%2B%20sum(yearn_vault%7Bparam%3D%22tvl%22%7D)%20%2B%20sum(iearn%7Bparam%3D%22tvl%22%7D)%20%2B%20sum(ironbank%7Bparam%3D%22tvl%22%7D)%20-%20sum(yearn%7Bparam%3D%22tvl%22%2Cvault%3D~%22curve.fi%2F(y%7Cbusd)%22%7D)&&start=${currentTimestamp-86400}&end=${currentTimestamp}&step=86400`,
  //   context: document.body,
  //   success: function(response){
  //     let tvlYesterday = response?.data?.result[0]?.values[0][1]
  //     let tvlNow = response?.data?.result[0]?.values[1][1]
  //
  //     let isLoss = false
  //     let tvlChange = tvlNow - tvlYesterday
  //     if(tvlChange < 0) {
  //       tvlChange = tvlChange * -1
  //       isLoss = true
  //     }
  //
  //     $('#w-node-_46935bc9-0220-5ce3-3a9e-71589d3bc51a-8b22666b').html(`${isLoss ? '-' : '+'} $ ${convertToInternationalCurrencySystem(tvlChange)}`);
  //     $('#w-node-f7911679-36ee-dfee-8fef-6ecc33cb620b-8b22666b').html(`${isLoss ? '▼' : '▲'}`).addClass(isLoss ? 'indicator-down' : 'indicator-up').removeClass(isLoss ? 'indicator-up' : 'indicator-up');
  //
  //   }});
  //
  // $.ajax({ url: `https://ec2-3-239-19-233.compute-1.amazonaws.com/api/query_range?query=sum(yearn%7Bparam%3D%22tvl%22%7D)%20%2B%20avg(yearn%7Bparam%3D%22vecrv%20balance%22%7D)%20*%20avg(yearn%7Bparam%3D%22crv%20price%22%7D)%20%2B%20sum(yearn_vault%7Bparam%3D%22tvl%22%7D)%20%2B%20sum(iearn%7Bparam%3D%22tvl%22%7D)%20%2B%20sum(ironbank%7Bparam%3D%22tvl%22%7D)%20-%20sum(yearn%7Bparam%3D%22tvl%22%2Cvault%3D~%22curve.fi%2F(y%7Cbusd)%22%7D)&&start=${currentTimestamp-2592000}&end=${currentTimestamp}&step=86400`,
  //   context: document.body,
  //   success: function(response){
  //     let tvlLastMonth = response?.data?.result[0]?.values[0][1]
  //     let tvlNow = response?.data?.result[0]?.values[response?.data?.result[0]?.values.length-1][1]
  //
  //     let isLoss = false
  //     let tvlChange = tvlNow - tvlLastMonth
  //     if(tvlChange < 0) {
  //       tvlChange = tvlChange * -1
  //       isLoss = true
  //     }
  //
  //     $('#w-node-_3ba17473-150a-885c-a2a3-ec0f4c9f55cf-8b22666b').html(`${isLoss ? '-' : '+'} $ ${convertToInternationalCurrencySystem(tvlChange)}`);
  //     $('#w-node-_3ba17473-150a-885c-a2a3-ec0f4c9f55d1-8b22666b').html(`${isLoss ? '▼' : '▲'}`).addClass(isLoss ? 'indicator-down' : 'indicator-up').removeClass(isLoss ? 'indicator-up' : 'indicator-up');;
  //   }});
});
