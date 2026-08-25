/* eslint-disable */

declare namespace Cloudflare {
  interface Env {
    D1: D1Database
    R2: R2Bucket
    IMAGES: ImagesBinding
    ASSETS: Fetcher
  }
}

interface CloudflareEnv extends Cloudflare.Env {}
