import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export default function LoginPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tgId, setTgId] = useLocalStorage('tgId', '');
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    if (router.query.tgId && typeof router.query.tgId === 'string') {
      setTgId(router.query.tgId);
      void router.push('./api/notion/login');
    }
    else {
        //wait 50ms to set message
       if(router.query.tgId === undefined) {
           setTimeout(() => {
               setMessage('Error: Something went wrong. Please try again.');
           }, 2000);
       }
    }
  }, [router, setTgId]);

  return <h1>{message}</h1>;
}