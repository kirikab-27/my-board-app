const fs = require('fs');
const path = require('path');

// SVGをPNGに変換するためのNode.jsスクリプト
// Canvas APIを使用してアイコンを生成

const createPWAIcon = (size, outputPath) => {
  // SVGの内容を定義（board themed icon）
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景円 -->
      <circle cx="256" cy="256" r="256" fill="#1976d2"/>
      
      <!-- 掲示板アイコン -->
      <rect x="128" y="160" width="256" height="192" rx="16" fill="white" opacity="0.9"/>
      
      <!-- 投稿線 -->
      <rect x="160" y="200" width="192" height="8" rx="4" fill="#1976d2"/>
      <rect x="160" y="220" width="128" height="8" rx="4" fill="#1976d2"/>
      <rect x="160" y="240" width="160" height="8" rx="4" fill="#1976d2"/>
      
      <!-- いいねハート -->
      <path d="M320 280 C320 270, 330 260, 340 260 C350 260, 360 270, 360 280 C360 290, 340 310, 340 310 C340 310, 320 290, 320 280 Z" fill="#ff4444"/>
      
      <!-- コメントアイコン -->
      <rect x="160" y="270" width="80" height="40" rx="8" fill="#f5f5f5" stroke="#1976d2" stroke-width="2"/>
      <circle cx="180" cy="285" r="3" fill="#1976d2"/>
      <circle cx="200" cy="285" r="3" fill="#1976d2"/>
      <circle cx="220" cy="285" r="3" fill="#1976d2"/>
    </svg>
  `;

  // SVGファイルとして保存
  const svgPath = path.join(__dirname, `../public/icons/icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  
  console.log(`✅ Created SVG icon: ${size}x${size} at ${svgPath}`);
  
  // PNGへの変換は手動で行う必要がある旨をログ出力
  console.log(`⚠️  Manual conversion required: Convert ${svgPath} to ${outputPath}`);
  console.log(`   Recommended: Use online converter or image editor to convert SVG to PNG`);
};

// 192x192と512x512のアイコンを生成
const iconsDir = path.join(__dirname, '../public/icons');

// ディレクトリが存在することを確認
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 PWA Icon Generation Script');
console.log('================================');

// 192x192 アイコン生成
createPWAIcon(192, path.join(iconsDir, 'icon-192x192.png'));

// 512x512 アイコン生成  
createPWAIcon(512, path.join(iconsDir, 'icon-512x512.png'));

console.log('\n📋 Next Steps:');
console.log('1. Convert the generated SVG files to PNG format');
console.log('2. Place the PNG files in public/icons/ directory');
console.log('3. Verify manifest.json references are correct');
console.log('\n🔧 Conversion Options:');
console.log('- Online: https://convertio.co/svg-png/');
console.log('- GIMP: Open SVG → Export as PNG with specified dimensions');
console.log('- Inkscape: CLI or GUI conversion');
console.log('- Adobe Illustrator/Photoshop: Import SVG → Export PNG');