import React from 'react';
import { useRouter } from 'next/router';

function Redirect() {
  const router = useRouter();
  const { address, section } = router.query;
  if (section === 'invest') {
    router.replace('/invest/' + address);
  } else if (section === 'lend') {
    router.push('/lend?address=' + address);
  }
  return <span></span>;
}

export default Redirect;
