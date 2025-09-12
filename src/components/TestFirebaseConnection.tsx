import React, { useEffect, useState } from 'react';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../services/firebase/firebase';

export const TestFirebaseConnection: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isLoading: true,
    error: null as string | null,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    database: process.env.REACT_APP_FIREBASE_NAME_DB || '(default)'
  });
  
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  useEffect(() => {
    const testFirestore = async () => {
      try {
        setConnectionStatus(prev => ({ ...prev, isLoading: true }));
        
        // Intentar leer de la colección 'news'
        const newsQuery = query(collection(db, 'news'), limit(1));
        const snapshot = await getDocs(newsQuery);
        
        setConnectionStatus(prev => ({ 
          ...prev, 
          isConnected: true, 
          isLoading: false,
          error: null 
        }));
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setTestResult({
            success: true,
            message: `✅ Successfully connected to qa-deepcapitals! Found ${snapshot.size} document(s)`,
            data: {
              docId: doc.id,
              hasData: !!doc.data(),
              collections: ['news']
            }
          });
        } else {
          setTestResult({
            success: true,
            message: '✅ Connected to qa-deepcapitals but no documents found in news collection',
            data: { collections: ['news'] }
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setConnectionStatus(prev => ({ 
          ...prev, 
          isConnected: false, 
          isLoading: false,
          error: errorMessage 
        }));
        setTestResult({
          success: false,
          message: `❌ Error connecting to Firestore: ${errorMessage}`,
          data: null
        });
      }
    };

    testFirestore();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: connectionStatus.isConnected ? '#10b981' : connectionStatus.isLoading ? '#f59e0b' : '#ef4444',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        Firebase Connection Status
      </div>
      <div style={{ fontSize: '14px' }}>
        <div>📍 Project: {connectionStatus.projectId}</div>
        <div>💾 Database: {connectionStatus.database}</div>
        <div>🔌 Status: {connectionStatus.isLoading ? 'Connecting...' : connectionStatus.isConnected ? 'Connected' : 'Disconnected'}</div>
        {connectionStatus.error && (
          <div>❌ Error: {connectionStatus.error}</div>
        )}
        {testResult && (
          <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '8px' }}>
            <div>{testResult.message}</div>
            {testResult.data && (
              <pre style={{ fontSize: '12px', marginTop: '4px' }}>
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};