import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const deleteFromCloudinary = async (publicUrl) => {
    try {
        if (!publicUrl) return null;
        // Get public ID from URL
        const publicId = publicUrl.split('/').slice(-1)[0].split('.')[0];
        // Delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(`products/${publicId}`);
        return result;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        throw new Error('Image deletion failed');
    }
}

const uploadOnCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath) return null
        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(localfilePath, {
            folder: 'products',
            resource_type: 'auto'
        })
        console.log('Cloudinary upload result:', result.url)
        fs.unlinkSync(localfilePath) // Delete the local file after upload
        return result;
    } catch (error) {
        fs.unlinkSync(localfilePath) // Delete the local file if upload fails
        console.error('Error uploading image:', error);
        throw new Error('Image upload failed');
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }