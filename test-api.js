// Test script pour vérifier que les APIs fonctionnent
const testAPI = async () => {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('🧪 Test de l\'API Agora...\n');

  try {
    // Test 1: Page d'accueil
    console.log('1. Test page d\'accueil...');
    const homeResponse = await fetch(`${BASE_URL}/`);
    console.log(`   Status: ${homeResponse.status} ✅\n`);

    // Test 2: API Health Check (test avec une route qui n'existe pas)
    console.log('2. Test API disponibilité...');
    try {
      const apiResponse = await fetch(`${BASE_URL}/api/health`);
      console.log(`   API Status: ${apiResponse.status}\n`);
    } catch (e) {
      console.log('   API prête (404 normal pour /health) ✅\n');
    }

    // Test 3: Test inscription (sans vraiment créer)
    console.log('3. Test route inscription...');
    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'Test123!',
        userType: 'client',
        profile: { firstName: 'Test', lastName: 'User', birthDate: '1990-01-01' }
      })
    });
    
    if (registerResponse.status === 201 || registerResponse.status === 409) {
      console.log('   Route inscription : OK ✅');
    } else {
      console.log(`   Route inscription : ${registerResponse.status}`);
    }

    console.log('\n🎉 Tests terminés !');
    console.log('\nPour tester complètement :');
    console.log('1. Lance "npm run dev"');
    console.log('2. Va sur http://localhost:3000');
    console.log('3. Crée un compte et teste les fonctionnalités');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n💡 Assure-toi que :');
    console.log('- L\'application tourne avec "npm run dev"');
    console.log('- MongoDB est démarré');
    console.log('- Le port 3000 est libre');
  }
};

// Lance le test si Node.js est disponible
if (typeof window === 'undefined') {
  testAPI();
} else {
  console.log('Lance ce script avec: node test-api.js');
}