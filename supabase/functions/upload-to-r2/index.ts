import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AWS Signature V4 helpers
async function hmacSHA256(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

async function sha256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function toHex(arr: Uint8Array): string {
  return [...arr].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<Uint8Array> {
  let k = await hmacSHA256(new TextEncoder().encode("AWS4" + key), dateStamp);
  k = await hmacSHA256(k, region);
  k = await hmacSHA256(k, service);
  k = await hmacSHA256(k, "aws4_request");
  return k;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const accountId = formData.get("accountId") as string;
    const accessKeyId = formData.get("accessKeyId") as string;
    const secretAccessKey = formData.get("secretAccessKey") as string;
    const bucketName = formData.get("bucketName") as string;
    const publicDomain = formData.get("publicDomain") as string;
    const folder = formData.get("folder") as string || "uploads";

    if (!file || !accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const fileBytes = new Uint8Array(await file.arrayBuffer());

    // R2 uses auto region
    const region = "auto";
    const service = "s3";
    const host = `${bucketName}.${accountId}.r2.cloudflarestorage.com`;
    const url = `https://${host}/${fileName}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = await sha256(fileBytes);
    const contentType = file.type || "application/octet-stream";

    const canonicalHeaders = [
      `content-type:${contentType}`,
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
    ].join("\n") + "\n";

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = [
      "PUT",
      "/" + fileName,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      await sha256(new TextEncoder().encode(canonicalRequest)),
    ].join("\n");

    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = toHex(await hmacSHA256(signingKey, stringToSign));

    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const r2Response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Host": host,
        "X-Amz-Content-Sha256": payloadHash,
        "X-Amz-Date": amzDate,
        "Authorization": authorization,
      },
      body: fileBytes,
    });

    if (!r2Response.ok) {
      const errorText = await r2Response.text();
      throw new Error(`R2 upload failed: ${r2Response.status} - ${errorText}`);
    }

    // Build public URL
    let resultUrl: string;
    if (publicDomain) {
      const domain = publicDomain.replace(/\/$/, "");
      resultUrl = `${domain}/${fileName}`;
    } else {
      resultUrl = url;
    }

    return new Response(JSON.stringify({ url: resultUrl, fileName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
