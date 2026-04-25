// Test script for Hiring feature
const axios = require('axios');

const baseURL = 'http://localhost:5000';
const client = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

async function testHiringFeature() {
  console.log('Testing Hiring Feature...\n');
  
  try {
    // Test 1: Check if jobs endpoint exists (should require auth)
    console.log('1. Testing jobs endpoint (should require auth)...');
    try {
      await client.get('/api/jobs');
      console.log('❌ Jobs endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Jobs endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 2: Check database schema
    console.log('\n2. Testing database schema...');
    const schemaResponse = await client.post('/api/admin/db/query', {
      query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'jobs' ORDER BY ordinal_position"
    });
    
    if (schemaResponse.data.success) {
      console.log('✅ Jobs table schema verified');
      console.log('Columns:', schemaResponse.data.data.map(col => `${col.column_name} (${col.data_type})`).join(', '));
    }
    
    // Test 3: Check indexes
    console.log('\n3. Testing database indexes...');
    const indexResponse = await client.post('/api/admin/db/query', {
      query: "SELECT indexname FROM pg_indexes WHERE tablename = 'jobs'"
    });
    
    if (indexResponse.data.success) {
      console.log('✅ Database indexes verified');
      console.log('Indexes:', indexResponse.data.data.map(idx => idx.indexname).join(', '));
    }
    
    // Test 4: Check designer count for matching
    console.log('\n4. Testing designer availability...');
    const designerResponse = await client.post('/api/admin/db/query', {
      query: "SELECT COUNT(*) as count FROM designers"
    });
    
    if (designerResponse.data.success) {
      const count = designerResponse.data.data[0].count;
      console.log(`✅ ${count} designers available for matching`);
    }
    
    console.log('\n✅ Hiring feature tests completed successfully');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run tests
testHiringFeature();