import { firestore as db } from "./firebase.js";

const createDocument = async (collection, docId, data) => {
    try {
        if (!collection || !docId) {
            throw new Error('Collection name and document ID must be non-empty strings');
        }   
        console.log(`Collection: ${collection}, Document ID: ${docId}`);   
      const docRef = db.collection(collection).doc(docId);
      await docRef.set(data);
      console.log(`Document ${docId} created successfully in collection ${collection}`);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };
  
  const readDocument = async (collection, docId) => {
    try {
    if (!collection || !docId) {
      throw new Error('Collection name and document ID must be non-empty strings');
    }
    console.log(`Collection: ${collection}, Document ID: ${docId}`);
    
      const docRef = db.collection(collection).doc(docId);
      const doc = await docRef.get();
      if (doc.exists) {
        console.log(`Document data for ${docId}:`, doc.data());
        return doc.data();
      } else {
        console.log(`No such document in collection ${collection}`);
        return null;
      }
    } catch (error) {
      console.error('Error reading document:', error);
    }
  };
  
  const updateDocument = async (collection, docId, data) => {
    try {
      const docRef = db.collection(collection).doc(docId);
      await docRef.update(data);
      console.log(`Document ${docId} updated successfully in collection ${collection}`);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };
  
  const deleteDocument = async (collection, docId) => {
    try {
      const docRef = db.collection(collection).doc(docId);
      await docRef.delete();
      console.log(`Document ${docId} deleted successfully from collection ${collection}`);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };


export {createDocument, updateDocument, deleteDocument, readDocument}