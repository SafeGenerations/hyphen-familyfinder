// test-imports.js
try {
  require('./src/src-modern/ModernGenogramApp.js');
  console.log('✅ Main app imports OK!');
} catch (error) {
  console.log('❌ Import error:', error.message);
}