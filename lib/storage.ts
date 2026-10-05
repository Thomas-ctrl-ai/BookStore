import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

function bucket() { const value = process.env.S3_BUCKET; if (!value || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) throw new Error("Private file storage is not configured."); return value; }
function client() { return new S3Client({ region: process.env.S3_REGION || "auto", ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}), forcePathStyle: Boolean(process.env.S3_ENDPOINT), credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } }); }
export async function createUploadUrl(key: string, mimeType: string, contentLength: number) { return getSignedUrl(client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: mimeType, ContentLength: contentLength }), { expiresIn: 300 }); }
export async function createDownloadUrl(key: string) { return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn: 60 }); }
export async function deletePrivateFile(key: string) { await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key })); }
export function newPrivateFileKey(orderId: string, extension = "pdf") { return `print-orders/${orderId}/${randomUUID()}.${extension}`; }
