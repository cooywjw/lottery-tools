const https = require('https');
const url = require('url');

// ============================================================
// Claude Tool Interface - Tavily Search Tool
// ============================================================

const API_KEY = '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';
const TAVILY_API_URL = 'https://api.tavily.com/search';

// ----- Zod-like Schema (runtime validation) -----
const inputSchema = {
  type: 'object',
  properties: {
    query: { type: 'string', minLength: 1 },
    depth: { type: 'string', enum: ['basic', 'advanced'], default: 'basic' },
    max_results: { type: 'number', minimum: 1, maximum: 20, default: 5 },
    include_answer: { type: 'boolean', default: true },
    include_raw_content: { type: 'boolean', default: false }
  },
  required: ['query']
};

// ----- Tool Metadata -----
const toolMetadata = {
  name: 'web_search',
  aliases: ['tavily_search', 'search_web'],
  searchHint: 'search the web for current information',
  version: '1.1.0',
  capabilities: ['read', 'network'],
  category: 'network',
  trustLevel: 'safe',
  maxResultSizeChars: 10000
};

// ----- Helper Functions -----
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

function validateInput(input) {
  const errors = [];
  
  // Required field
  if (!input.query || typeof input.query !== 'string' || input.query.length < 1) {
    errors.push('query is required and must be a non-empty string');
  }
  
  // Depth enum
  if (input.depth && !['basic', 'advanced'].includes(input.depth)) {
    errors.push('depth must be "basic" or "advanced"');
  }
  
  // Max results range
  if (input.max_results !== undefined) {
    if (typeof input.max_results !== 'number' || input.max_results < 1 || input.max_results > 20) {
      errors.push('max_results must be a number between 1 and 20');
    }
  }
  
  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

// ----- Core Tool Implementation -----

/**
 * Tavily Web Search Tool - Claude Tool Interface
 * 
 * @implements {OpenClawTool}
 */
const tavilySearchTool = {
  // ----- Identity -----
  name: toolMetadata.name,
  aliases: toolMetadata.aliases,
  searchHint: toolMetadata.searchHint,
  
  // ----- Schema -----
  inputSchema,
  
  // ----- Execution -----
  async call(args, context, canUseTool, onProgress) {
    // Permission check
    if (canUseTool && !(await canUseTool('web_search'))) {
      return { 
        data: null, 
        error: 'Permission denied: web_search tool not authorized' 
      };
    }
    
    // Input validation
    const validation = validateInput(args);
    if (!validation.valid) {
      return { 
        data: null, 
        error: `Validation failed: ${validation.errors.join(', ')}` 
      };
    }
    
    // Progress callback
    if (onProgress) {
      onProgress({ type: 'progress', message: 'Searching Tavily API...', percent: 10 });
    }
    
    try {
      const postData = JSON.stringify({
        api_key: API_KEY,
        query: args.query,
        search_depth: args.depth || 'basic',
        max_results: args.max_results || 5,
        include_answer: args.include_answer !== false,
        include_raw_content: args.include_raw_content || false
      });
      
      if (onProgress) {
        onProgress({ type: 'progress', message: 'Sending request...', percent: 30 });
      }
      
      const result = await makeRequest(postData);
      
      if (onProgress) {
        onProgress({ type: 'progress', message: 'Processing results...', percent: 80 });
      }
      
      // Format output
      const output = {
        query: args.query,
        answer: result.answer || null,
        results: (result.results || []).map(r => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score
        })),
        response_time: result.response_time
      };
      
      if (onProgress) {
        onProgress({ type: 'progress', message: 'Complete', percent: 100 });
      }
      
      return { data: output };
      
    } catch (error) {
      if (onProgress) {
        onProgress({ type: 'error', message: error.message });
      }
      return { 
        data: null, 
        error: `Search failed: ${error.message}` 
      };
    }
  },
  
  // ----- Dynamic Description -----
  async description(input, options) {
    const depth = input.depth === 'advanced' ? '深度' : '基础';
    const max = input.max_results || 5;
    return `Tavily ${depth}搜索 "${input.query}"，返回最多 ${max} 条结果`;
  },
  
  // ----- Capability Checks -----
  isConcurrencySafe(input) {
    return true; // Search is read-only and safe to run concurrently
  },
  
  isReadOnly(input) {
    return true; // Search does not modify any data
  },
  
  isDestructive(input) {
    return false; // Search is never destructive
  },
  
  isEnabled() {
    return true; // Tool is always enabled
  },
  
  // ----- Result Rendering -----
  renderResult(output) {
    if (!output || !output.results) {
      return 'No results found.';
    }
    
    let text = '';
    if (output.answer) {
      text += `**摘要**: ${output.answer}\n\n`;
    }
    
    text += `**搜索结果** (${output.results.length}条):\n\n`;
    output.results.forEach((r, i) => {
      text += `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.content?.substring(0, 200)}...\n\n`;
    });
    
    return text;
  },
  
  maxResultSizeChars: toolMetadata.maxResultSizeChars
};

// ============================================================
// Legacy API (backward compatibility)
// ============================================================

async function search(query, options = {}) {
  const result = await tavilySearchTool.call(
    { 
      query, 
      depth: options.search_depth || options.depth,
      max_results: options.max_results || options.max,
      include_answer: options.include_answer,
      include_raw_content: options.include_raw_content
    },
    {},
    null,
    null
  );
  
  if (result.error) {
    throw new Error(result.error);
  }
  
  return result.data;
}

// ============================================================
// CLI Usage
// ============================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const query = args[0];
  
  if (!query) {
    console.log('Usage: node tavily-search.js "your search query" [--depth=basic|advanced] [--max=N]');
    console.log('');
    console.log('Options:');
    console.log('  --depth=basic|advanced  Search depth (default: basic)');
    console.log('  --max=N                 Max results 1-20 (default: 5)');
    process.exit(1);
  }
  
  const options = {};
  const depthArg = args.find(arg => arg.startsWith('--depth='));
  if (depthArg) {
    options.depth = depthArg.split('=')[1];
  }
  const maxArg = args.find(arg => arg.startsWith('--max='));
  if (maxArg) {
    options.max_results = parseInt(maxArg.split('=')[1]);
  }
  
  // Progress callback for CLI
  const onProgress = (progress) => {
    if (progress.type === 'progress') {
      process.stderr.write(`\r[${progress.percent}%] ${progress.message}`);
      if (progress.percent === 100) {
        process.stderr.write('\n');
      }
    }
  };
  
  tavilySearchTool.call({ query, ...options }, {}, null, onProgress).then(result => {
    if (result.error) {
      console.error('Error:', result.error);
      process.exit(1);
    }
    console.log(JSON.stringify(result.data, null, 2));
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

// ============================================================
// Exports
// ============================================================

module.exports = { 
  search,
  tool: tavilySearchTool,
  metadata: toolMetadata
};
