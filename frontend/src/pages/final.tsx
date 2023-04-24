import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';


export default function FinalPage() {
  const router = useRouter();
  const { access_token, name } = router.query;
  const [tgId, setTgId] = useLocalStorage('tgId', '');
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    if (access_token && name && tgId) {
      const fetchData = async () => {
        try {
          const response = await axios.post('/api/notion/savetodb', {
            access_token,
            name,
            telegramId: tgId,
          });

          console.log(response.data);
            setMessage('Success! You can now close this window.');
        } catch (error) {
          console.error(error);
            setMessage('Error: Something went wrong. Please try again.');
        }
      };

      void fetchData();
    }
  }, [access_token, name, tgId]);
    
  return (
    <div>
      {message}
    </div>
  );
}