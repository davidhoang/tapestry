/**
 * Simple test file to verify the recommendation engine works correctly
 */
import { recommendationEngine } from './recommendation-engine';

async function testRecommendationEngine() {
  console.log('Testing Recommendation Engine...');

  try {
    // Test with a mock workspace
    const testRequest = {
      workspaceId: 1,
      userId: 1,
      limit: 10,
      forceRefresh: true,
    };

    console.log('Generating recommendations...');
    const recommendations = await recommendationEngine.generate(testRequest);
    
    console.log(`✅ Generated ${recommendations.length} recommendations`);
    
    // Test each recommendation type
    const types = Array.from(new Set(recommendations.map(r => r.type)));
    console.log(`📊 Recommendation types: ${types.join(', ')}`);
    
    // Show details of first recommendation
    if (recommendations.length > 0) {
      const first = recommendations[0];
      console.log(`📝 First recommendation:
        Type: ${first.type}
        Title: ${first.title}
        Score: ${first.score}
        Priority: ${first.priority}
        Candidates: ${first.candidates.length}
        Reasoning: ${first.reasoning.join('; ')}`);
    }

    // Test getting saved recommendations
    console.log('\nTesting saved recommendations...');
    const saved = await recommendationEngine.getSavedRecommendations(testRequest);
    console.log(`✅ Retrieved ${saved.length} saved recommendations`);

    console.log('\n🎉 Recommendation Engine test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testRecommendationEngine()
  .then(() => {
    console.log('Test completed successfully');
  })
  .catch((error) => {
    console.error('Test failed:', error);
  });

export { testRecommendationEngine };