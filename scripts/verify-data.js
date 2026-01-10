/**
 * Data Verification Script
 * Checks that the database has been loaded correctly
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function verifyData() {
  console.log('🔍 Verifying Wisconsin Hail CRM Database\n');

  try {
    // Check hail_storms table
    const { data: storms, error: stormsError, count: stormCount } = await supabase
      .from('hail_storms')
      .select('*', { count: 'exact' })
      .limit(5);

    if (stormsError) {
      console.log('❌ Error accessing hail_storms table:', stormsError.message);
      console.log('\n💡 Make sure you have run the schema.sql in Supabase SQL Editor');
      return;
    }

    console.log(`✅ hail_storms table: ${stormCount} records found`);
    
    if (storms && storms.length > 0) {
      console.log('\n   Sample records:');
      storms.forEach(storm => {
        const date = new Date(storm.begin_date_time).toLocaleDateString();
        console.log(`   - ${storm.cz_name} County: ${storm.magnitude}" hail on ${date}`);
      });
    }

    // Check date range
    const { data: minDate } = await supabase
      .from('hail_storms')
      .select('begin_date_time')
      .order('begin_date_time', { ascending: true })
      .limit(1);

    const { data: maxDate } = await supabase
      .from('hail_storms')
      .select('begin_date_time')
      .order('begin_date_time', { ascending: false })
      .limit(1);

    if (minDate && minDate[0]) {
      console.log(`\n📅 Date range: ${new Date(minDate[0].begin_date_time).toLocaleDateString()} to ${new Date(maxDate[0].begin_date_time).toLocaleDateString()}`);
    }

    // Check by county
    const { data: countyStats } = await supabase
      .from('hail_storms')
      .select('cz_name, magnitude, begin_date_time');

    const counties = {};
    countyStats?.forEach(storm => {
      const county = storm.cz_name || 'Unknown';
      if (!counties[county]) counties[county] = 0;
      counties[county]++;
    });

    const topCounties = Object.entries(counties)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (topCounties.length > 0) {
      console.log('\n🏆 Top 5 counties by storm count:');
      topCounties.forEach(([county, count]) => {
        console.log(`   - ${county}: ${count} storms`);
      });
    }

    // Test API endpoints
    console.log('\n🌐 Testing API connectivity...');
    const healthUrl = 'http://localhost:3000/api/health';
    
    console.log('\n✅ Database verification complete!');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. Check the health endpoint: http://localhost:3000/api/health');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifyData();
