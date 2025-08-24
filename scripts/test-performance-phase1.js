#!/usr/bin/env node

/**
 * Performance Test Script for Phase 1 Image Optimization
 * Tests Lighthouse performance scores before and after optimization
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs').promises;
const path = require('path');

const TEST_URLS = [
  'http://localhost:3035',
  'http://localhost:3035/board',
  'http://localhost:3035/timeline',
];

const PERFORMANCE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    onlyCategories: ['performance'],
  },
};

async function runLighthouse(url, options) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const runnerResult = await lighthouse(url, {...options, port: chrome.port}, PERFORMANCE_CONFIG);
  await chrome.kill();
  return runnerResult;
}

async function testPagePerformance(url) {
  console.log(`\n🔍 Testing: ${url}`);
  
  try {
    const result = await runLighthouse(url, {});
    
    const performance = result.lhr.categories.performance;
    const metrics = result.lhr.audits;
    
    console.log(`📊 Performance Score: ${Math.round(performance.score * 100)}/100`);
    
    if (metrics['first-contentful-paint']) {
      console.log(`⚡ FCP: ${metrics['first-contentful-paint'].displayValue}`);
    }
    
    if (metrics['largest-contentful-paint']) {
      console.log(`📈 LCP: ${metrics['largest-contentful-paint'].displayValue}`);
    }
    
    if (metrics['total-blocking-time']) {
      console.log(`🚧 TBT: ${metrics['total-blocking-time'].displayValue}`);
    }
    
    if (metrics['cumulative-layout-shift']) {
      console.log(`📏 CLS: ${metrics['cumulative-layout-shift'].displayValue}`);
    }
    
    // Image optimization specific metrics
    if (metrics['modern-image-formats']) {
      const score = metrics['modern-image-formats'].score;
      console.log(`🖼️  Modern Image Formats: ${score === 1 ? '✅ Pass' : '❌ Fail'}`);
    }
    
    if (metrics['efficiently-encode-images']) {
      const score = metrics['efficiently-encode-images'].score;
      console.log(`🗜️  Efficiently Encoded Images: ${score === 1 ? '✅ Pass' : '❌ Fail'}`);
    }
    
    if (metrics['properly-size-images']) {
      const score = metrics['properly-size-images'].score;
      console.log(`📐 Properly Sized Images: ${score === 1 ? '✅ Pass' : '❌ Fail'}`);
    }
    
    return {
      url,
      performance: Math.round(performance.score * 100),
      fcp: metrics['first-contentful-paint']?.numericValue || 0,
      lcp: metrics['largest-contentful-paint']?.numericValue || 0,
      tbt: metrics['total-blocking-time']?.numericValue || 0,
      cls: metrics['cumulative-layout-shift']?.numericValue || 0,
      modernImages: metrics['modern-image-formats']?.score === 1,
      efficientImages: metrics['efficiently-encode-images']?.score === 1,
      properlySized: metrics['properly-size-images']?.score === 1,
    };
    
  } catch (error) {
    console.error(`❌ Error testing ${url}:`, error.message);
    return null;
  }
}

async function generateReport(results) {
  const validResults = results.filter(r => r !== null);
  
  if (validResults.length === 0) {
    console.log('\n❌ No valid results to report');
    return;
  }
  
  console.log('\n📋 PHASE 1 IMAGE OPTIMIZATION RESULTS');
  console.log('=====================================');
  
  const avgPerformance = validResults.reduce((sum, r) => sum + r.performance, 0) / validResults.length;
  const avgLCP = validResults.reduce((sum, r) => sum + r.lcp, 0) / validResults.length;
  const avgFCP = validResults.reduce((sum, r) => sum + r.fcp, 0) / validResults.length;
  
  console.log(`\n📊 Average Performance Score: ${Math.round(avgPerformance)}/100`);
  console.log(`⚡ Average FCP: ${Math.round(avgFCP)}ms`);
  console.log(`📈 Average LCP: ${Math.round(avgLCP)}ms`);
  
  // Image optimization success rate
  const modernImagesPass = validResults.filter(r => r.modernImages).length;
  const efficientImagesPass = validResults.filter(r => r.efficientImages).length;
  const properlySizedPass = validResults.filter(r => r.properlySized).length;
  
  console.log('\n🖼️  Image Optimization Results:');
  console.log(`📱 Modern Formats: ${modernImagesPass}/${validResults.length} pages pass`);
  console.log(`🗜️  Efficient Encoding: ${efficientImagesPass}/${validResults.length} pages pass`);
  console.log(`📐 Proper Sizing: ${properlySizedPass}/${validResults.length} pages pass`);
  
  // Success evaluation
  console.log('\n🎯 Phase 1 Success Evaluation:');
  if (avgPerformance >= 90) {
    console.log('✅ EXCELLENT: Performance score target achieved (90+)');
  } else if (avgPerformance >= 70) {
    console.log('⚠️  GOOD: Performance improved, continue with Phase 2');
  } else if (avgPerformance >= 50) {
    console.log('⚠️  MODERATE: Some improvement, investigate further optimizations');
  } else {
    console.log('❌ NEEDS WORK: Performance still low, review implementation');
  }
  
  // Save detailed results
  const reportPath = path.join(__dirname, '..', 'reports', 'phase1-performance-test.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    phase: 'Phase 1 - Image Optimization',
    averagePerformance: avgPerformance,
    results: validResults 
  }, null, 2));
  
  console.log(`\n💾 Detailed results saved to: ${reportPath}`);
}

async function main() {
  console.log('🚀 Starting Phase 1 Performance Test...');
  console.log('📊 Testing Image Optimization Impact');
  console.log('⏱️  This may take 2-3 minutes...\n');
  
  // Check if server is running
  try {
    const response = await fetch('http://localhost:3035');
    if (!response.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.error('❌ Error: Development server not running on port 3035');
    console.log('💡 Please start the server with: npm run dev -- -p 3035');
    process.exit(1);
  }
  
  const results = [];
  
  for (const url of TEST_URLS) {
    const result = await testPagePerformance(url);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await generateReport(results);
  
  console.log('\n✅ Phase 1 performance testing complete!');
  console.log('📈 Review results above to determine next optimization phase');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPagePerformance, generateReport };