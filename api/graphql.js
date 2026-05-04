// Vercel Serverless Function — proxies GraphQL requests to Shopify Admin API
const https = require('https');

const STORE = 'cf6huz-e6.myshopify.com';
const API_VERSION = '2026-01';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!TOKEN) {
    res.status(500).json({ error: 'SHOPIFY_ACCESS_TOKEN not configured' });
    return;
  }

  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  const options = {
    hostname: STORE,
    port: 443,
    path: `/admin/api/${API_VERSION}/graphql.json`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': TOKEN,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  return new Promise((resolve, reject) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', (chunk) => (data += chunk));
      proxyRes.on('end', () => {
        res.status(proxyRes.statusCode).setHeader('Content-Type', 'application/json').send(data);
        resolve();
      });
    });

    proxyReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    proxyReq.write(body);
    proxyReq.end();
  });
};
