Create a pluggable storage abstraction layer for the existing Node.js backend that supports local filesystem storage for offline development, Cloudflare R2 object storage, and AWS S3 + Glacier storage for production, switchable via an environment variable.

Requirements:

Implement a unified storage interface: upload(file) -> { key, url } and delete(key).

Provide three drivers:

local → store files on disk under /uploads/dev, serve via Express static route.

r2 → upload to Cloudflare R2 using S3-compatible SDK.

s3-glacier → upload to AWS S3 with automatic lifecycle migration to Glacier for long-term storage.

Select driver using STORAGE_DRIVER=local | r2 | s3-glacier.

Do not change business logic — integrate via a single storage adapter.

Ensure folder structure: receipts/{userId}/{yyyy}/{mm}/{uuid}.ext.

Update environment variable templates and add minimal documentation.

Deliverables:

/src/storage/{index.ts, local.ts, r2.ts, s3-glacier.ts}

Updated upload route using the unified storage adapter

Updated .env file

.env.example additions

AWS S3 + Glacier setup documentation