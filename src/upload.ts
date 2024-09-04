import supabaseAdmin from "./supabase";

const uploadFile = async (bucketName:string, filePath:string, fileData:any, options:any) => {
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, fileData, options);

  if (error) {
    throw error;
  }

  console.log(`File uploaded to ${filePath}`);
};

export default uploadFile;
