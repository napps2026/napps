Admin upload notes

Use the `admin/upload.html` page to upload images to your S3 bucket via the serverless function.

Environment variables required for `netlify/functions/upload-image.js`:

- `S3_BUCKET` — your bucket name
- `AWS_REGION` (or `S3_REGION`) — AWS region, e.g. `us-east-1`
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` — credentials with PutObject permission on the bucket
 - `ADMIN_KEY` — secret key used to protect the admin UI and upload endpoint

How it works:
1. Open `admin/upload.html` in your deployed site (or locally when Netlify dev is running).
2. Select an image and click Upload. The function returns a public S3 URL.

Security note:
- The function currently sets `ACL: public-read`. For production, prefer signed URLs or a bucket policy that restricts write access to authenticated callers.

If you want, I can:
- Add signed upload URLs (pre-signed POST) so clients can upload directly to S3 without passing the file through the function.
- Integrate direct upload from the registration and teacher forms (auto-upload images and store returned URL).