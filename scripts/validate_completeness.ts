import axios from 'axios';
import { Pool } from 'pg';
import 'dotenv/config';
import https from 'https';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const INFOLEG_BASE_URL =
  'https://servicios.infoleg.gob.ar/infolegInternet/api/v2.0';
const LEGISLACIONES_URL = `${INFOLEG_BASE_URL}/nacionales/normativos/legislaciones`;

interface YearValidationResult {
  year: number;
  expectedCount: number;
  actualCount: number;
  isComplete: boolean;
  difference: number;
}

const getExpectedCountForYear = async (year: number, agent: https.Agent): Promise<number> => {
  try {
    const params = {
      sancion: year.toString(),
      limit: '1', // We only need metadata, not the actual results
      offset: '1'
    };
    
    const response = await axios.get(LEGISLACIONES_URL, {
      params,
      httpsAgent: agent,
      headers: {
        'Accept': 'application/json'
      },
      timeout: 30000
    });
    
    if (response.status === 409) {
      console.log(`⚠️  Year ${year} returned 409 from API`);
      return 0;
    }
    
    const totalCount = response.data.metadata?.resultset?.count || 0;
    return totalCount;
    
  } catch (error: any) {
    console.error(`❌ Error fetching count for year ${year}:`, error.message);
    return -1; // Indicate an error occurred
  }
};

const getActualCountForYear = async (year: number): Promise<number> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM normas 
      WHERE EXTRACT(YEAR FROM sancion) = $1
    `;
    const result = await client.query(query, [year]);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`❌ Error querying database for year ${year}:`, error);
    return -1;
  } finally {
    client.release();
  }
};

const validateYearRange = async (startYear: number, endYear: number): Promise<YearValidationResult[]> => {
  console.log(`🔍 Validating legislation completeness from ${startYear} to ${endYear}...\n`);
  
  const agent = new https.Agent({
    rejectUnauthorized: false,
  });
  
  const results: YearValidationResult[] = [];
  const incompleteYears: YearValidationResult[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    console.log(`📅 Checking year ${year}...`);
    
    const expectedCount = await getExpectedCountForYear(year, agent);
    const actualCount = await getActualCountForYear(year);
    
    if (expectedCount === -1 || actualCount === -1) {
      console.log(`  ❌ Error checking year ${year} - skipping`);
      continue;
    }
    
    const isComplete = expectedCount === actualCount;
    const difference = expectedCount - actualCount;
    
    const result: YearValidationResult = {
      year,
      expectedCount,
      actualCount,
      isComplete,
      difference
    };
    
    results.push(result);
    
    if (!isComplete) {
      incompleteYears.push(result);
    }
    
    const status = isComplete ? '✅' : '❌';
    const diffText = isComplete ? '' : ` (missing ${difference})`;
    console.log(`  ${status} ${year}: ${actualCount}/${expectedCount}${diffText}`);
    
    // Small delay to be nice to the API
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n📊 VALIDATION SUMMARY:');
  console.log('=' .repeat(60));
  
  const completeYears = results.filter(r => r.isComplete);
  console.log(`✅ Complete years: ${completeYears.length}`);
  console.log(`❌ Incomplete years: ${incompleteYears.length}`);
  console.log(`📈 Total years checked: ${results.length}`);
  
  if (incompleteYears.length > 0) {
    console.log('\n🚨 INCOMPLETE YEARS DETAILS:');
    console.log('-'.repeat(60));
    incompleteYears.forEach(year => {
      console.log(`${year.year}: ${year.actualCount}/${year.expectedCount} (missing ${year.difference})`);
    });
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('- Re-run populate.ts for these specific years');
    console.log('- Consider increasing retry attempts or timeout values');
    console.log('- Check network stability during scraping');
    
    const totalMissing = incompleteYears.reduce((sum, year) => sum + year.difference, 0);
    console.log(`\n📊 Total missing legislations: ${totalMissing}`);
  } else {
    console.log('\n🎉 All years are complete! No missing data found.');
  }
  
  return results;
};

const fixIncompleteYears = async (incompleteYears: number[]): Promise<void> => {
  console.log(`🔧 This feature would re-scrape incomplete years: ${incompleteYears.join(', ')}`);
  console.log('💡 For now, manually re-run populate.ts with these specific years.');
  console.log('🚀 You can modify the year range in populate.ts main function.');
};

const main = async () => {
  console.log('🕵️  Starting legislation completeness validation...\n');
  
  // Configuration - modify these values as needed
  const START_YEAR = 1940;  // Change this to your desired start year
  const END_YEAR = 1945;    // Change this to your desired end year
  
  console.log(`🎯 Target range: ${START_YEAR} to ${END_YEAR}`);
  console.log(`📡 API endpoint: ${LEGISLACIONES_URL}`);
  console.log(`🗃️  Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
  
  try {
    const results = await validateYearRange(START_YEAR, END_YEAR);
    
    const incompleteYears = results
      .filter(r => !r.isComplete)
      .map(r => r.year);
    
    if (incompleteYears.length > 0) {
      console.log(`\n🔧 Years that need re-scraping: [${incompleteYears.join(', ')}]`);
      console.log('\n📝 To fix these, update populate.ts main function:');
      console.log(`   for (let year = ${Math.min(...incompleteYears)}; year <= ${Math.max(...incompleteYears)}; year++) {`);
      console.log('     // Or create a custom array: const yearsToFix = [' + incompleteYears.join(', ') + '];');
    }
    
  } catch (error) {
    console.error('💥 Validation failed:', error);
  } finally {
    await pool.end();
    console.log('\n👋 Validation complete. Database connection closed.');
  }
};

// Allow running with command line arguments
const args = process.argv.slice(2);
if (args.length === 2) {
  const startYear = parseInt(args[0]);
  const endYear = parseInt(args[1]);
  
  if (!isNaN(startYear) && !isNaN(endYear)) {
    console.log(`📋 Using command line arguments: ${startYear} to ${endYear}`);
    // You can modify the main function to accept these parameters
  }
}

main().catch(err => {
  console.error('💥 Script failed:', err);
  pool.end();
});
