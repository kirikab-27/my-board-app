const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function drawBoardIcon(canvas, size) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    
    // 背景円 - My Board App のテーマカラー #1976d2
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    
    // 掲示板背景
    const boardWidth = size * 0.5;
    const boardHeight = size * 0.375;
    const boardX = size * 0.25;
    const boardY = size * 0.3125;
    const borderRadius = size * 0.03125;
    
    ctx.beginPath();
    ctx.roundRect(boardX, boardY, boardWidth, boardHeight, borderRadius);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    
    // 投稿線 1
    ctx.beginPath();
    ctx.roundRect(size * 0.3125, size * 0.390625, size * 0.375, size * 0.015625, size * 0.0078125);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    
    // 投稿線 2 (短め)
    ctx.beginPath();
    ctx.roundRect(size * 0.3125, size * 0.4296875, size * 0.25, size * 0.015625, size * 0.0078125);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    
    // 投稿線 3 (中間)
    ctx.beginPath();
    ctx.roundRect(size * 0.3125, size * 0.46875, size * 0.3125, size * 0.015625, size * 0.0078125);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    
    // いいねハート（単純な形状）
    ctx.fillStyle = '#ff4444';
    const heartX = size * 0.625;
    const heartY = size * 0.546875;
    const heartSize = size * 0.04;
    
    ctx.beginPath();
    ctx.moveTo(heartX, heartY + heartSize * 0.3);
    ctx.bezierCurveTo(
        heartX, heartY,
        heartX - heartSize * 0.5, heartY,
        heartX - heartSize * 0.5, heartY + heartSize * 0.3
    );
    ctx.bezierCurveTo(
        heartX - heartSize * 0.5, heartY + heartSize * 0.6,
        heartX, heartY + heartSize,
        heartX, heartY + heartSize
    );
    ctx.bezierCurveTo(
        heartX, heartY + heartSize,
        heartX + heartSize * 0.5, heartY + heartSize * 0.6,
        heartX + heartSize * 0.5, heartY + heartSize * 0.3
    );
    ctx.bezierCurveTo(
        heartX + heartSize * 0.5, heartY,
        heartX, heartY,
        heartX, heartY + heartSize * 0.3
    );
    ctx.fill();
    
    // コメントバブル
    const bubbleX = size * 0.3125;
    const bubbleY = size * 0.52734375;
    const bubbleWidth = size * 0.15625;
    const bubbleHeight = size * 0.078125;
    
    ctx.beginPath();
    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, size * 0.015625);
    ctx.fillStyle = '#f5f5f5';
    ctx.fill();
    ctx.strokeStyle = '#1976d2';
    ctx.lineWidth = size * 0.00390625;
    ctx.stroke();
    
    // コメントドット
    const dotSize = size * 0.00585937;
    const dotY = bubbleY + bubbleHeight/2;
    
    // ドット1
    ctx.beginPath();
    ctx.arc(bubbleX + bubbleWidth * 0.25, dotY, dotSize, 0, 2 * Math.PI);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    
    // ドット2
    ctx.beginPath();
    ctx.arc(bubbleX + bubbleWidth * 0.5, dotY, dotSize, 0, 2 * Math.PI);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
    
    // ドット3
    ctx.beginPath();
    ctx.arc(bubbleX + bubbleWidth * 0.75, dotY, dotSize, 0, 2 * Math.PI);
    ctx.fillStyle = '#1976d2';
    ctx.fill();
}

async function createPWAIcons() {
    const iconsDir = path.join(__dirname, '../public/icons');
    
    // アイコンディレクトリを確認
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
        console.log('📁 Created icons directory');
    }
    
    console.log('🎨 PWA Icon Creation Started');
    console.log('==============================');
    
    const sizes = [192, 512];
    
    for (const size of sizes) {
        console.log(`\n🖼️  Creating ${size}x${size} icon...`);
        
        // Canvasを作成
        const canvas = createCanvas(size, size);
        
        // アイコンを描画
        drawBoardIcon(canvas, size);
        
        // PNGとして保存
        const iconPath = path.join(iconsDir, `icon-${size}x${size}.png`);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(iconPath, buffer);
        
        console.log(`✅ Created: ${iconPath}`);
        console.log(`   Size: ${size}x${size} pixels`);
        console.log(`   File size: ${(buffer.length / 1024).toFixed(2)} KB`);
    }
    
    console.log('\n🎯 PWA Icon Generation Complete!');
    console.log('===================================');
    console.log('📋 Generated files:');
    console.log('- public/icons/icon-192x192.png (for mobile devices)');
    console.log('- public/icons/icon-512x512.png (for high-resolution displays)');
    console.log('\n✅ Next steps:');
    console.log('1. Verify icons in public/icons/ directory');
    console.log('2. Check manifest.json references');
    console.log('3. Test PWA installation functionality');
    console.log('\n🚀 Ready to implement install promotion UI!');
}

// アイコン作成を実行
createPWAIcons().catch(console.error);