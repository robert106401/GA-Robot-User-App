const fs = require("fs");
const path = require("path");
const QRCode = require("../node_modules/qrcode-terminal/vendor/QRCode");
const QRErrorCorrectLevel = require("../node_modules/qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel");

const url = process.argv[2] || "exp://192.168.1.241:8081";
const outputPath = process.argv[3] || path.join(process.cwd(), "expo-qr.html");
const svgOutputPath = process.argv[4] || path.join(process.cwd(), "expo-qr.svg");

const qr = new QRCode(-1, QRErrorCorrectLevel.L);
qr.addData(url);
qr.make();

const moduleCount = qr.getModuleCount();
const scale = 12;
const quietZone = 4;
const size = (moduleCount + quietZone * 2) * scale;

const rects = [];
for (let row = 0; row < moduleCount; row += 1) {
  for (let col = 0; col < moduleCount; col += 1) {
    if (qr.isDark(row, col)) {
      rects.push(
        `<rect x="${(col + quietZone) * scale}" y="${(row + quietZone) * scale}" width="${scale}" height="${scale}"/>`
      );
    }
  }
}

const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Expo Go QR Code</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f7f3ea;
        color: #22211d;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(92vw, 720px);
        text-align: center;
      }
      .qr {
        display: inline-block;
        padding: 22px;
        background: white;
        border: 1px solid #e1d9c9;
        border-radius: 8px;
      }
      svg {
        width: min(76vw, 440px);
        height: auto;
        display: block;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
      }
      p {
        margin: 14px auto 0;
        max-width: 560px;
        line-height: 1.5;
        font-size: 17px;
      }
      code {
        display: inline-block;
        margin-top: 10px;
        padding: 8px 10px;
        border-radius: 8px;
        background: #efe4ce;
        font-size: 16px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>用 iPhone 相机扫描</h1>
      <div class="qr">
        <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
          <rect width="100%" height="100%" fill="#fff"/>
          <g fill="#000">${rects.join("")}</g>
        </svg>
      </div>
      <p>打开 iPhone 自带相机，对准这个二维码，然后点弹出的 Expo Go 链接。</p>
      <code>${url}</code>
    </main>
  </body>
</html>
`;

fs.writeFileSync(outputPath, html);
fs.writeFileSync(
  svgOutputPath,
  `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    <rect width="100%" height="100%" fill="#fff"/>
    <g fill="#000">${rects.join("")}</g>
  </svg>`
);
console.log(outputPath);
console.log(svgOutputPath);
