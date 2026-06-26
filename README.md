# G&A Robot

面向用户端的自动售货机 App 原型，覆盖 Android 和 iPhone。当前版本使用 Expo + React Native 的单仓方案，先完成信息架构、核心导航、首页营销、SKU 分类、扫码支付入口、VM 地图和会员中心的可运行骨架。

## Core Modules

- `Home`: 主要功能入口、营销内容、热销饮品、合作商家优惠券、未使用资产提醒
- `SKU category`: 按分类浏览咖啡、奶茶和其他饮品
- `Scan & Pay`: 扫码支付入口，后续接入相机权限、VM 设备码和支付 SDK
- `VM Map`: 周边 VM 设备列表与地图能力的接入位
- `Me`: 会员等级、权益、积分、充值、版本升级

## Tech Direction

- Cross-platform: Expo + React Native
- State: 先用本地状态和 mock data，后续可接 Zustand/Redux Toolkit
- Navigation: 当前使用轻量自定义底部导航，正式项目可切换到 React Navigation
- Map: 后续接入 `react-native-maps` 或高德/Google Maps SDK
- Scan: 后续接入 `expo-camera` 或原生扫码模块
- Payment: 按市场接入 Apple Pay、Google Pay、Stripe、Adyen、微信/支付宝等

## Suggested Commands

```bash
npm install
npm run start
npm run typecheck
npm test
```

然后在 Expo Go、iOS Simulator 或 Android Emulator 中打开。

需要持续外网访问时，使用带自动重启的 Expo tunnel：

```bash
./scripts/expo-tunnel.sh start
./scripts/expo-tunnel.sh status
./scripts/expo-tunnel.sh stop
```

日志位于 `.expo/tunnel.log`。watchdog 会每 15 秒检查本地 Metro 和公网 `exp.direct` 链接，连续失败后会自动重启。启动前会清理占用 `8081` 的旧 Expo 进程，避免非交互模式卡在端口选择；健康后会刷新 `expo-qr.html` 和 `expo-qr.svg`。

如果希望登录后自动守护 tunnel，可以安装 launchd：

```bash
cp scripts/com.ga.expo-tunnel.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.ga.expo-tunnel.plist
launchctl kickstart -k gui/$(id -u)/com.ga.expo-tunnel
```

如果项目位于 `~/Documents` 且 launchd 日志出现 `can't open input file`，这是 macOS 隐私权限限制。可以把项目移到非 Documents 目录，或在 System Settings 中给启动环境授予文件访问权限；临时稳定运行可直接执行 `./scripts/expo-tunnel.sh supervise`。

免费 Expo tunnel 的域名仍由 Expo/ngrok 管理，不等同于生产环境的永久保留域名。

核心用户状态使用 AsyncStorage 持久化，包括购物车、收藏、钱包余额、订单、支付记录和钱包流水。

## Product Docs

- [Product Blueprint](docs/product-blueprint.md)
- [Implementation Roadmap](docs/implementation-roadmap.md)
- [Content and Navigation Guide](docs/content-style-guide.md)
- [Design Tokens](docs/design-tokens.md)
- [Shared Component Patterns](docs/component-patterns.md)
- [QA Checklist](docs/qa-checklist.md)
