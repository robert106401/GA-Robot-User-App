# Implementation Roadmap

## Phase 1: Product Prototype

- 建立 Expo + React Native 单仓项目
- 完成 HOME、SKU、扫码、VM Map、Me 的页面骨架
- 使用 mock data 模拟会员资产、SKU、VM、券和营销内容
- 明确视觉风格、颜色、卡片密度和导航结构

## Phase 2: Transaction MVP

- 接入登录与用户身份
- 接入 VM 设备码扫码
- 接入 SKU 与库存 API
- 接入购物车和订单 API
- 接入支付网关
- 增加支付结果页和出货状态页

## Phase 3: Location and Growth

- 接入定位权限和地图 SDK
- 增加附近 VM、距离排序和筛选
- 接入券包、积分和会员等级
- 增加营销 Banner、活动配置和合作商家券
- 增加 Push、过期提醒和复购提醒

## Phase 4: Production Hardening

- 加入崩溃监控、埋点和性能指标
- 增加强制升级、灰度升级和远程配置
- 完成 iOS/Android 权限说明、隐私合规和支付合规
- 加入离线降级、设备故障提示和售后入口
- 建立自动化测试和发布流水线

## Recommended API Boundaries

```txt
GET  /v1/home
GET  /v1/skus?category=&vmId=
GET  /v1/vms/nearby?lat=&lng=
POST /v1/scan/resolve
POST /v1/orders
POST /v1/payments
GET  /v1/orders/{id}/dispense-status
GET  /v1/me
GET  /v1/wallet
GET  /v1/app/version
```

## Native Capabilities

- Camera: 扫码 VM 设备码和商品码
- Location: 附近 VM 与导航
- Push Notification: 券过期、订单状态、活动提醒
- Secure Storage: token、设备绑定、支付相关短期凭据
- Deep Link: 活动页、商家券、订单详情

## Risk Notes

- 设备库存和 App 展示不一致会直接影响支付体验，需要订单创建前做库存锁定。
- 出货链路需要幂等设计，避免支付成功但重复出货或不出货。
- 地图和扫码权限在 iOS/Android 的拒绝态要有清晰替代路径。
- 券、积分、会员价需要统一价格引擎，避免前后端计算不一致。

