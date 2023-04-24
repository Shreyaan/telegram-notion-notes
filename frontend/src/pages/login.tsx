import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export default function LoginPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tgId, setTgId] = useLocalStorage('tgId', '');
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    if (router.isReady) {
      const queryTgId = router.query.tgId;
  
      if (typeof queryTgId === 'string') {
        setTgId(queryTgId);
        void router.push('./api/notion/login');
      } else {
        setMessage('Error: Something went wrong. Please try again.');
      }
    }
  }, [router, router.isReady, router.query, setTgId]);

  return <h1>{message}</h1>;
}