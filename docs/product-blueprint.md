# Vending Machine App Product Blueprint

## Product Positioning

这个 App 是用户与自动售货机网络的入口。它需要同时承担三件事：

1. 提升购买效率：找到机器、扫码、选品、支付、取货。
2. 提升复购：会员等级、积分、充值、券包、权益提醒。
3. 提升商业转化：热销推荐、营销内容、商家合作优惠券、机器附近活动。

## Primary Navigation

### HOME

首页是交易和增长的聚合页。

- 顶部资产卡：积分、未使用券、会员权益、余额或充值入口
- 主 CTA：扫码购买、附近 VM、充值
- 营销 Banner：新品、限时折扣、品牌联名
- 热销推荐：咖啡、奶茶、功能饮料等 Top SKU
- 合作商家优惠券：附近商家、餐饮、出行、生活服务
- 待使用资产提醒：即将过期券、已解锁权益、可兑换积分

### SKU Category

以用户理解的饮品分类组织商品。

- Coffee: 美式、拿铁、摩卡、冷萃
- Milk Tea: 原味奶茶、珍珠奶茶、水果茶、低糖系列
- Fresh & Healthy: 果汁、气泡水、低卡饮品
- Energy: 功能饮料、运动补给
- Snacks: 轻食、搭配小食

每个 SKU 建议包含：

- 商品名、价格、会员价
- 温度、甜度、容量
- 库存状态
- 所在最近 VM
- 标签：热销、新品、低糖、限时优惠

### Scan Pay

扫码支付是核心购买路径。

- 扫描 VM 设备码或商品码
- 识别机器、库存和可售 SKU
- 支持购物车或单品直购
- 支持券、积分、余额和第三方支付
- 支付成功后显示取货码、机器出货状态和售后入口

### VM Map

地图页解决用户找机器的问题。

- 当前定位附近 VM
- 距离、营业状态、库存亮点
- 支持筛选：咖啡、奶茶、可用优惠、24h、支持热饮
- 点击机器展示详情：地址、导航、可售 SKU、故障状态

### Me

会员中心沉淀资产和账户能力。

- 会员等级与成长值
- 积分、券包、权益、余额
- 充值卡和交易记录
- 设置、帮助、客服、版本升级
- App version、强制升级和灰度升级策略

## Key User Flows

### Nearby Purchase

1. 打开 HOME，看到附近 VM 与热销推荐。
2. 点击扫码购买或进入 VM Map。
3. 扫描机器码，确认 SKU 与库存。
4. 使用券或积分抵扣。
5. 支付成功，机器出货。
6. 订单进入交易记录，积分入账。

### Coupon Conversion

1. HOME 展示合作商家券或即将过期券。
2. 用户领取或使用券。
3. 系统根据券的限制过滤可购买 SKU。
4. 付款后核销券，并更新资产卡。

### Membership Growth

1. 用户在 Me 查看等级权益。
2. 通过购买、充值、签到或活动获取成长值。
3. 升级后解锁会员价、生日券、免费加料等权益。

## Data Domains

- User: profile, membership, balance, points
- Wallet: promotional Coupons, purchased or received Vouchers, benefits, recharge cards
- SKU: category, price, nutrition, media, tags, stock
- VM: location, status, capabilities, inventory
- Order: cart, payment, dispense status, after-sales
- Campaign: Offers, banners, promotions, and merchant Coupons
- App: version, upgrade policy, feature flags

## MVP Scope

- 五个主导航页
- Mock SKU、优惠券、VM 设备和会员资产
- 首页资产卡和热销推荐
- SKU 分类和商品列表
- 扫码支付占位流程
- VM 列表式地图占位
- 会员中心资产与版本信息

## Post-MVP

- 真机扫码和相机权限
- 定位、地图 SDK 和导航
- 设备库存实时同步
- 支付 SDK 与退款
- 出货状态轮询
- Push 通知
- 多语言与多币种
- AB 测试和营销自动化
