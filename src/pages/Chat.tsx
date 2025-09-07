import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChatLayout from '../components/Chat/ChatLayout';

const Chat: React.FC = () => {
  const { articleId } = useParams<{ articleId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Actualizar título de la página sin react-helmet-async
  useEffect(() => {
    document.title = `${t('chat.title')} - DeepCapitals`;
    
    // Actualizar meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t('chat.metaDescription'));
    }
    
    // Limpiar al desmontar
    return () => {
      document.title = 'DeepCapitals - Financial News';
    };
  }, []);

  const handleClose = () => {
    navigate(-1); // Regresar a la página anterior
  };

  return (
    <div className="h-full">
      <ChatLayout 
        initialArticleId={articleId}
        onClose={handleClose}
      />
    </div>
  );
};

export default Chat;