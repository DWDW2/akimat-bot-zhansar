import supabaseAdmin from './supabaseAdminClient';

const uploadFile = async (bucketName, filePath, fileData, options) => {
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, fileData, options);

  if (error) {
    throw error;
  }

  console.log(`File uploaded to ${filePath}`);
};

export default uploadFile;