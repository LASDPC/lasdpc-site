# Public media routes

The database stores object keys such as `profile/example.png`; the upload API
returns `{ "key": "profile/example.png" }`. Browser URLs use `/media` (or the
HTTPS prefix configured at frontend build time). The backend S3 client connects
to `MINIO_ENDPOINT` and must never use the browser prefix for S3 operations.

The existing Nginx `/media/profile/` route serves profile photos and user
avatars. Profile banners, blog covers, project images and infrastructure images
also have public page renderers. Add the following routes to the same HTTPS
server block if those media types are used in production:

```nginx
location ^~ /media/banner/ {
    limit_except GET { deny all; }
    proxy_pass http://127.0.0.1:9000/lasdpc-media/banner/;
    proxy_set_header Host 127.0.0.1:9000;
}
location ^~ /media/blog/ {
    limit_except GET { deny all; }
    proxy_pass http://127.0.0.1:9000/lasdpc-media/blog/;
    proxy_set_header Host 127.0.0.1:9000;
}
location ^~ /media/projects/ {
    limit_except GET { deny all; }
    proxy_pass http://127.0.0.1:9000/lasdpc-media/projects/;
    proxy_set_header Host 127.0.0.1:9000;
}
location ^~ /media/clusters/ {
    limit_except GET { deny all; }
    proxy_pass http://127.0.0.1:9000/lasdpc-media/clusters/;
    proxy_set_header Host 127.0.0.1:9000;
}
```

Do not proxy `/media/` as a whole. Markdown images are also uploaded to MinIO,
but Docs content requires login; serving `/media/markdown/` publicly would
remove that page-level protection for images. The current Compose setup grants
anonymous download access to the entire bucket, so sensitive Docs images should
not be uploaded there. A separate authenticated media delivery flow and private
bucket are needed before treating those images as private.

After changing Nginx, run `sudo nginx -t && sudo systemctl reload nginx`.
Check one known object per enabled prefix with `curl -I` through the HTTPS
domain. No MongoDB or MinIO migration is needed for profile images.
