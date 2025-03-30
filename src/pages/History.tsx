
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const navigate = useNavigate();
  
  // Redirect to Dashboard page since History functionality is now in Dashboard
  useEffect(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  return null;
};

export default History;
