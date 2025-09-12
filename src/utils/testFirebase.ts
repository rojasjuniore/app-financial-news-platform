import { db } from '../services/firebase/firebase';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('🔄 Testing Firebase connection from frontend...');
    
    // Test write
    const testDocRef = doc(collection(db, 'test_connection'), 'test_doc');
    await setDoc(testDocRef, {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Frontend connection test'
    });
    console.log('✅ Write successful');
    
    // Test read
    const docSnap = await getDoc(testDocRef);
    if (docSnap.exists()) {
      console.log('✅ Read successful:', docSnap.data());
    }
    
    // Clean up
    await deleteDoc(testDocRef);
    console.log('✅ Delete successful');
    
    return { success: true, message: 'Firebase connection working!' };
  } catch (error: any) {
    console.error('❌ Firebase test failed:', error);
    
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        message: 'Permission denied. Please update Firestore security rules.',
        instructions: `
          1. Go to https://console.firebase.google.com/
          2. Select project: trading-system-ac16f
          3. Go to Firestore Database → Rules
          4. Update rules to allow access
          5. Click "Publish"
        `
      };
    }
    
    return { success: false, message: error.message };
  }
};