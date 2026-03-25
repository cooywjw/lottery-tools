const https = require('https');
const url = require('url');

const API_KEY = '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';
const TAVILY_API_URL = 'https://api.tavily.com/search';

function makeRequest(postData) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(TAVILY_API_URL);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + e.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function search(query, options = {}) {
  const postData = JSON.stringify({
    api_key: API_KEY,
    query: query,
    search_depth: options.search_depth || 'basic',
    max_results: options.max_results || 5,
    include_answer: options.include_answer !== false,
    include_raw_content: options.include_raw_content || false
  });

  try {
    const result = await makeRequest(postData);
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args[0];
  
  if (!query) {
    console.log('Usage: node tavily-search.js "your search query"');
    process.exit(1);
  }
  
  const options = {};
  const depthArg = args.find(arg => arg.startsWith('--depth='));
  if (depthArg) {
    options.search_depth = depthArg.split('=')[1];
  }
  const maxArg = args.find(arg => arg.startsWith('--max='));
  if (maxArg) {
    options.max_results = parseInt(maxArg.split('=')[1]);
  }
  
  search(query, options).then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
}

module.exports = { search };
