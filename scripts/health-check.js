const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001';

async function healthCheck() {
  console.log('\n🔍 Crypto Arbitrage Pro - Health Check\n');
  console.log('='.repeat(60));

  const checks = [];

  // 1. Check API
  console.log('\n📡 [1/4] فحص الـ API...');
  try {
    const response = await axios.get(`${API_URL}/api/health`, { timeout: 5000 });
    
    if (response.status === 200) {
      console.log('✅ الـ API يعمل بشكل صحيح');
      console.log(`   Status: ${response.status}`);
      console.log(`   Uptime: ${Math.floor(response.data.uptime / 1000)}s`);
      console.log(`   Clients: ${response.data.clients}`);
      checks.push({ name: 'API', status: '✅', details: response.data });
    } else {
      console.log(`⚠️  الـ API يرجع status غير متوقع: ${response.status}`);
      checks.push({ name: 'API', status: '⚠️', details: { status: response.status } });
    }
  } catch (error) {
    console.log('❌ خطأ في الاتصال بالـ API');
    console.log(`   ${error.message}`);
    checks.push({ name: 'API', status: '❌', details: { error: error.message } });
  }

  // 2. Check Opportunities
  console.log('\n🎯 [2/4] فحص الفرص...');
  try {
    const response = await axios.get(`${API_URL}/api/opportunities?limit=10`, { timeout: 5000 });
    
    if (response.status === 200) {
      const count = response.data.length;
      console.log(`✅ تم العثور على ${count} فرصة`);
      
      if (count > 0) {
        const topOpportunity = response.data[0];
        console.log(`   أفضل فرصة: ${topOpportunity.pair}`);
        console.log(`   الربح: $${topOpportunity.profit.usd.toFixed(2)}`);
      }
      
      checks.push({ name: 'Opportunities', status: '✅', details: { count } });
    }
  } catch (error) {
    console.log('⚠️  لا يمكن جلب الفرص');
    console.log(`   ${error.message}`);
    checks.push({ name: 'Opportunities', status: '⚠️', details: { error: error.message } });
  }

  // 3. Check Stats
  console.log('\n📊 [3/4] فحص الإحصائيات...');
  try {
    const response = await axios.get(`${API_URL}/api/stats`, { timeout: 5000 });
    
    if (response.status === 200) {
      const stats = response.data;
      console.log('✅ الإحصائيات متاحة');
      console.log(`   Total Scans: ${stats.totalScans}`);
      console.log(`   Opportunities: ${stats.opportunitiesFound}`);
      console.log(`   Total Profit: $${stats.totalProfit.toFixed(2)}`);
      checks.push({ name: 'Stats', status: '✅', details: stats });
    }
  } catch (error) {
    console.log('⚠️  لا يمكن جلب الإحصائيات');
    console.log(`   ${error.message}`);
    checks.push({ name: 'Stats', status: '⚠️', details: { error: error.message } });
  }

  // 4. Check DEXs
  console.log('\n🏦 [4/4] فحص DEXs...');
  try {
    const response = await axios.get(`${API_URL}/api/dexes`, { timeout: 5000 });
    
    if (response.status === 200) {
      const count = response.data.length;
      console.log(`✅ ${count} DEX مدعوم`);
      
      response.data.slice(0, 5).forEach(dex => {
        console.log(`   ${dex.icon} ${dex.name}`);
      });
      
      if (count > 5) {
        console.log(`   ... و ${count - 5} آخر`);
      }
      
      checks.push({ name: 'DEXs', status: '✅', details: { count } });
    }
  } catch (error) {
    console.log('⚠️  لا يمكن جلب قائمة DEXs');
    console.log(`   ${error.message}`);
    checks.push({ name: 'DEXs', status: '⚠️', details: { error: error.message } });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 ملخص الفحص');
  console.log('='.repeat(60));
  
  const passed = checks.filter(c => c.status === '✅').length;
  const total = checks.length;
  
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
  });
  
  console.log('\n' + '-'.repeat(60));
  console.log(`النتيجة: ${passed}/${total} فحص ناجح`);
  
  if (passed === total) {
    console.log('\n🎉 جميع الفحوصات ناجحة!');
    process.exit(0);
  } else {
    console.log('\n⚠️  بعض الفحوصات فشلت');
    process.exit(1);
  }
}

healthCheck().catch(error => {
  console.error('\n❌ خطأ غير متوقع:', error);
  process.exit(1);
});
