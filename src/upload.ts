import supabaseAdmin from "./supabase";
import { Readable } from 'stream';

const uploadFile = async (bucketName: string, filePath: string, fileStream: Readable, options: any = {}) => {
  try {
    // Convert the stream to a buffer
    const chunks: any[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        ...options,
        upsert: true,
      });

    if (error) {
      throw error;
    }

    console.log(`File uploaded to ${filePath}`);
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};


export default uploadFile;