# Component Images Upload Folder

This folder stores all component images uploaded by admins through the web interface.

## Important Notes:

✅ **Images are saved permanently** - Files uploaded here persist on the server
✅ **Automatic file naming** - Files are named with timestamp to prevent conflicts
✅ **5MB size limit** - Each image can be up to 5MB
✅ **Supported formats** - JPG, PNG, GIF

## File Location:
- Server path: `backend/uploads/components/`
- URL path: `http://localhost:5000/uploads/components/filename.jpg`
- Database reference: Stored in `imageUrl` field of component document

## Backup Recommendations:
1. Include this folder in your server backups
2. Consider cloud storage (AWS S3, Cloudinary) for production
3. Keep uploads folder in version control (with .gitkeep)

## Production Setup:
For production deployment, consider using:
- **Firebase Storage** (already using Firebase)
- **AWS S3** (scalable cloud storage)
- **Cloudinary** (image CDN with optimization)

Current setup works perfectly for local/development use!
