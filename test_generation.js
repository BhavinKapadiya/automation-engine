require('dotenv').config();
const { shopifyApi, ApiVersion, Session } = require('@shopify/shopify-api');
const { OpenAI } = require('openai');
require('@shopify/shopify-api/adapters/node');
const { 
  analyzeProductWithAI, 
  buildSpecsTableHtml, 
  compileDescriptionHtml, 
  requestWithRetry 
} = require('./enricher');

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: ApiVersion.April26,
  isEmbeddedApp: false,
});

const session = new Session({
  id: `offline_${process.env.SHOP_URL}`,
  shop: process.env.SHOP_URL,
  state: 'offline',
  isOnline: false,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

const client = new shopify.clients.Graphql({ session });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GET_PRODUCTS_TEST = `
  query getProducts {
    products(first: 2) {
      edges {
        node {
          id
          title
          descriptionHtml
          vendor
          productType
          tags
          variants(first: 1) {
            edges {
              node {
                sku
              }
            }
          }
        }
      }
    }
  }
`;

async function testGeneration() {
  try {
    console.log('📡 Fetching 2 test products from Shopify...');
    const response = await requestWithRetry(client, GET_PRODUCTS_TEST);
    const edges = response.data.products.edges;

    for (let i = 0; i < edges.length; i++) {
      const product = edges[i].node;
      const sku = product.variants.edges[0]?.node?.sku || 'Not specified';
      console.log(`\n======================================================`);
      console.log(`PRODUCT ${i + 1}: "${product.title}"`);
      console.log(`ID: ${product.id}`);
      console.log(`SKU: ${sku}`);
      console.log(`======================================================`);

      console.log('🤖 Analyzing with AI...');
      const aiData = await analyzeProductWithAI(openai, product, sku);
      
      const specsTableHtml = buildSpecsTableHtml(aiData.specifications, product.title);
      const compiledDescriptionHtml = compileDescriptionHtml(aiData, specsTableHtml, product.descriptionHtml);

      console.log('\n--- OUTPUT RESULTS ---');
      console.log('PRODUCT ID:', product.id);
      console.log('CURRENT TITLE (KEEPING AS IS):', product.title);
      console.log('PROPOSED SEO TITLE (<=70 chars):', aiData.seo_title);
      console.log(`SEO Title Length: ${aiData.seo_title ? aiData.seo_title.length : 0} chars`);
      console.log('PROPOSED META DESCRIPTION (<=160 chars):', aiData.seo_meta_description);
      console.log(`Meta Description Length: ${aiData.seo_meta_description ? aiData.seo_meta_description.length : 0} chars`);
      console.log('PROPOSED DESCRIPTION HTML:\n', compiledDescriptionHtml);
      console.log('======================================================\n');
    }
  } catch (err) {
    console.error('Error during generation test:', err.message);
  }
}

testGeneration();
