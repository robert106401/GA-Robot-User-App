# GA Robot User App 全业务流程与运营体系图

这份文档用于统一产品、设计、运营、工程和数据团队对 GA Robot User App 的业务理解。重点不是只画用户点击路径，而是说明：每一个用户业务流程背后，运营体系如何配置、驱动、监控和干预。

## 1. 业务范围

当前 App 覆盖的用户业务场景包括：

- 新用户 onboarding、注册、登录、第三方登录、基础资料收集
- Home 发现、营销 banner、待处理提醒、热销商品、合作商家优惠
- App 预点单、购物车、checkout、支付、取货、过期处理
- VM 设备端选品后，App 扫码支付
- VM 地图、附近设备、设备详情、库存和营业状态
- Wallet eCard、Add Funds、Bonus Balance、Auto Reload
- Benefits、优惠券、饮品券、积分兑换、会员等级、EXP、missions
- Gift：饮品券、钱包 eCard、礼品码、领取和过期
- Partner Offers：合作商家券、付费 partner voucher、核销
- Activity：订单、钱包、支付、礼品、权益使用记录
- Account：个人资料、支付方式、通知偏好、隐私、安全、帮助与 QA 工具

## 2. 全局业务地图

```mermaid
flowchart TD
  U["用户打开 App"] --> AUTH{"是否已登录?"}

  AUTH -- "未登录" --> OB["Onboarding\n产品价值介绍"]
  OB --> SIGN["Sign In / Create Account"]
  SIGN --> METHOD{"身份方式"}
  METHOD -- "Email / SMS" --> OTP["发送验证码\n输入 6 位码\n自动验证"]
  METHOD -- "Google / Apple" --> SSO["第三方身份验证\n短暂 transition"]
  OTP --> PROFILE["Create Account\n基础资料 + Terms + Marketing opt-in"]
  SSO --> PROFILE
  PROFILE --> HOME["Home"]

  AUTH -- "已登录" --> HOME

  HOME --> DISCOVERY["发现与运营内容\nBanner / Best Sellers / Needs Attention"]
  HOME --> ORDER["App 预点单"]
  HOME --> SCAN["Scan & Pay\n支付 VM 端订单"]
  HOME --> MAP["VM Map / Nearby"]
  HOME --> GIFT["Gift"]
  HOME --> REWARDS["Rewards"]
  HOME --> ACCOUNT["Account"]

  ORDER --> CHECKOUT["统一 Checkout\n权益 + 支付"]
  SCAN --> VM_CHECKOUT["VM Order Checkout\n同样享受权益"]
  GIFT --> GIFT_CHECKOUT["Gift Checkout"]
  REWARDS --> REWARD_ASSETS["优惠券 / 饮品券 / 积分兑换 / 等级权益"]
  ACCOUNT --> WALLET["Wallet / Add Funds / Auto Reload"]
  ACCOUNT --> ACTIVITY["Activity / Receipts / Support"]

  CHECKOUT --> CASHIER["Cashier / Payment"]
  VM_CHECKOUT --> CASHIER
  GIFT_CHECKOUT --> CASHIER
  WALLET --> CASHIER

  CASHIER --> RESULT{"业务结果"}
  RESULT --> ORDER_RECORD["订单 / 取货 / VM 出货"]
  RESULT --> WALLET_RECORD["钱包余额与流水"]
  RESULT --> GIFT_RECORD["礼品码与领取状态"]
  RESULT --> REWARD_RECORD["权益核销 / 积分 / EXP"]
  RESULT --> ACTIVITY
```

## 3. 运营体系总图

运营体系不是单个页面，而是驱动 App 内容、价格、权益、状态、消息和数据反馈的业务中台。

```mermaid
flowchart LR
  subgraph OPS["运营体系 / Operations Platform"]
    CMS["内容与活动 CMS\nBanner / onboarding / 商品标签 / 首页卡片"]
    SKU["商品与库存运营\nSKU / 价格 / VM 库存 / 售罄 / 推荐"]
    PROMO["优惠与权益引擎\nCoupon / Voucher / Member price / Bonus"]
    LOYALTY["会员成长体系\nPoints / EXP / Tier / Missions / Check-in"]
    WALLET["钱包运营\nCash / Bonus / Add Funds / Auto Reload / Liability"]
    ORDER["订单与履约运营\n预点单 / VM 支付 / 出货 / 过期 / 异常"]
    VM["设备运营\n机器状态 / 地点 / 库存 / 故障 / 云端回调"]
    PARTNER["合作商家运营\nOffer inventory / Sponsored placement / Voucher redemption"]
    CRM["CRM 与消息\nPush / Email / SMS / Receipt / Reminder / Win-back"]
    RISK["风控与幂等\n支付失败 / 重复核销 / 异常补偿 / QA controls"]
    DATA["数据分析\nFunnel / Cohort / ROI / LTV / Exception dashboard"]
  end

  subgraph APP["User App"]
    ONBOARD["Onboarding / Auth"]
    HOME["Home"]
    ORDER_APP["Order / Checkout"]
    SCAN["Scan & Pay"]
    MAP["VM Map"]
    GIFT["Gift"]
    REWARDS["Rewards"]
    ME["Account / Wallet / Activity"]
  end

  CMS --> ONBOARD
  CMS --> HOME
  SKU --> HOME
  SKU --> ORDER_APP
  SKU --> MAP
  PROMO --> ORDER_APP
  PROMO --> SCAN
  PROMO --> GIFT
  PROMO --> REWARDS
  LOYALTY --> HOME
  LOYALTY --> REWARDS
  WALLET --> ME
  WALLET --> ORDER_APP
  WALLET --> SCAN
  ORDER --> ORDER_APP
  ORDER --> SCAN
  ORDER --> ME
  VM --> SCAN
  VM --> MAP
  PARTNER --> HOME
  PARTNER --> REWARDS
  CRM --> HOME
  CRM --> ME
  RISK --> ORDER_APP
  RISK --> SCAN
  RISK --> REWARDS
  DATA --> OPS
```

## 4. 核心业务流程

### 4.1 Onboarding / 注册 / 登录

```mermaid
flowchart TD
  A["App Onboarding\n产品价值介绍"] --> B["Sign In"]
  B --> C{"选择登录/注册方式"}
  C -- "Email / SMS" --> D["输入手机号或邮箱"]
  D --> E["Send Code"]
  E --> F["60 秒倒计时\n任意 6 位码自动验证"]
  F --> G["Create Account\n基础资料收集"]
  C -- "Google / Apple" --> H["第三方身份验证"]
  H --> I["Verified transition"]
  I --> G
  G --> J["Terms / Privacy / Marketing opt-in"]
  J --> K["进入 Home"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| Onboarding 内容运营 | 5-6 页价值介绍、排序、图片、文案 | 教育用户核心价值，降低注册前不确定性 |
| 身份策略 | Email/SMS、Google、Apple、验证码重发规则 | 覆盖北美常见登录习惯，降低注册门槛 |
| Consent 管理 | Terms、Privacy、Marketing opt-in | 满足合规和后续 CRM 授权 |
| 新用户分层 | 来源、登录方式、是否跳过 onboarding、是否 opt-in | 为首单激励、召回和新用户旅程提供数据 |

关键数据：

- onboarding_view、onboarding_next、onboarding_skip
- auth_method_selected、otp_sent、otp_verified、third_party_verified
- profile_completed、terms_accepted、marketing_opt_in

### 4.2 Home 发现与运营内容

```mermaid
flowchart TD
  A["Home"] --> B["Needs Attention\n订单/券/钱包提醒"]
  A --> C["Marketing Banner"]
  A --> D["Quick Actions\nScan & Pay / Add Funds / Rewards / Nearby"]
  A --> E["Best Sellers"]
  A --> F["Partner Offers"]
  A --> G["Wallet / Tier / Points summary"]
  B --> H["用户进入具体业务流程"]
  C --> H
  D --> H
  E --> H
  F --> H
  G --> H
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 首页坑位运营 | banner、活动卡、热销 SKU、合作商家位置 | 把运营目标转化成用户入口 |
| 个性化排序 | 新用户、会员等级、余额、过期券、附近 VM | 提升点击率和转化率 |
| Needs Attention | 即将过期券、待取订单、钱包提醒 | 把运营提醒转成用户行动 |
| 内容实验 | banner A/B、CTA 文案、卡片排序 | 优化激活、复购和充值转化 |

关键数据：

- impression、click、source_module、campaign_id
- home_to_checkout、home_to_rewards、home_to_add_funds
- needs_attention_open、needs_attention_resolved

### 4.3 App 预点单 / Pickup Order

```mermaid
flowchart TD
  A["浏览商品"] --> B["SKU detail / customization"]
  B --> C["Add to cart"]
  C --> D["Checkout"]
  D --> E["权益计算\nCoupon / Voucher / Points / Bonus"]
  E --> F["选择支付方式"]
  F --> G["Cashier"]
  G --> H{"支付成功?"}
  H -- "否" --> I["支付失败\n不生成订单、不扣权益"]
  H -- "是" --> J["Prepaid Order created"]
  J --> K["显示取货信息与有效期"]
  K --> L{"用户是否按时取货?"}
  L -- "是" --> M["Completed"]
  L -- "否" --> N["Expired"]
  N --> O["金额转入 Bonus Balance\n生成钱包记录"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 商品运营 | SKU、价格、标签、图片、库存、售罄 | 决定用户能买什么、看到什么 |
| 价格/权益引擎 | 会员价、券、积分、bonus 使用优先级 | 保证前后端价格一致，避免错算 |
| 订单策略 | pickup window、过期规则、订单状态 | 管理履约承诺和异常处理 |
| CRM 提醒 | 支付成功、取货提醒、即将过期、过期补偿说明 | 降低未取货和投诉 |
| 数据看板 | 商品浏览、加购、支付、取货、过期 | 判断商品和运营活动质量 |

异常重点：

- 支付失败：不生成订单，不扣券，不扣积分
- 库存变化：下单前需要二次校验或锁库存
- 过期未取：按业务规则进入 Bonus Balance，而不是现金退款

### 4.4 VM 设备端选品，App 扫码支付

```mermaid
flowchart TD
  A["用户在 VM 设备端选饮品"] --> B["VM 创建未支付订单"]
  B --> C["App Scan & Pay 扫码"]
  C --> D["解析 VM order\n订单号 / 商品 / 价格 / 机器"]
  D --> E["App 端权益计算\n同样享受 benefits"]
  E --> F["Cashier payment"]
  F --> G["App 订单状态: Paid"]
  G --> H["云端通知 VM 支付成功"]
  H --> I["VM 出饮料"]
  I --> J["云端回调 App"]
  J --> K["App 订单状态: Completed"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| VM 订单同步 | QR 解析 VM order，而不是创建 prepaid order | 保证 App 支付的是设备端真实订单 |
| 权益一致性 | VM app pay 同样使用券、积分、bonus、会员价 | 用户不会因为支付路径不同而损失权益 |
| 设备履约监控 | Paid 和 Completed 分离 | 识别“已付款但未出货”的售后风险 |
| 机器运营 | 机器状态、库存、故障、地点、时段活动 | 支持机器级运营和故障定位 |
| 对账 | VM order number、payment id、dispense callback | 支持财务和客服核查 |

异常重点：

- VM order 过期或被取消：App 应提示重新扫码
- 支付成功但 VM 未出货：进入 support-needed 状态
- 云端回调延迟：App 显示 paid/dispensing，不应直接 completed

### 4.5 VM Map / Nearby

```mermaid
flowchart TD
  A["用户打开 Nearby / VM Map"] --> B{"是否授权定位?"}
  B -- "允许" --> C["展示附近 VM"]
  B -- "拒绝" --> D["手动搜索 / 默认城市"]
  C --> E["筛选\n距离 / 可用优惠 / 品类 / 24h / 热饮"]
  D --> E
  E --> F["VM Detail"]
  F --> G["库存亮点 / 机器状态 / 导航 / 可售 SKU"]
  G --> H["去扫码或预点单"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 设备运营 | 机器地理位置、营业状态、故障状态 | 帮用户找到可用机器，降低空跑 |
| 库存运营 | 每台 VM 的可售 SKU 和库存亮点 | 支持按库存推荐和导流 |
| 本地活动 | campus/store/VM 级活动 | 提高特定机器销量 |
| 权限运营 | LBS 授权时机、拒绝态替代路径 | 避免强制授权导致流失 |

### 4.6 Wallet / Add Funds / Bonus / Auto Reload

```mermaid
flowchart TD
  A["Wallet eCard"] --> B["Cash Balance"]
  A --> C["Bonus Balance"]
  A --> D["Add Funds"]
  D --> E["选择充值金额"]
  E --> F["匹配充值 bonus 活动"]
  F --> G["Cashier"]
  G --> H["Cash 入账"]
  H --> I["Bonus 入账"]
  A --> J["Auto Reload"]
  J --> K["设置触发阈值和充值金额"]
  K --> L["余额低于阈值"]
  L --> G
  C --> M["符合规则时优先用于 GA Robot 消费"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 充值活动 | Add $X get $Y bonus | 提升预付资金和复购 |
| 资金规则 | Cash / Bonus 分账、使用顺序、适用范围 | 控制财务责任和用户预期 |
| Auto Reload | 阈值、金额、默认关闭、授权支付方式 | 提升留存和消费连续性 |
| 钱包流水 | Cash、Bonus、top-up、expired order credit | 支持审计、客服和财务对账 |

异常重点：

- 充值支付失败：不入账
- Bonus 不等于现金，需要明确解释
- 预点单过期金额转 Bonus，需要在 Activity 和 Wallet detail 讲清楚

### 4.7 Rewards / Benefits / Points / EXP / Tier

```mermaid
flowchart TD
  A["用户行为"] --> B{"行为类型"}
  B -- "购买" --> C["获得 Points / EXP"]
  B -- "Add Funds" --> D["获得 Wallet EXP"]
  B -- "Gift" --> E["获得 Gift EXP"]
  B -- "Check-in / Mission" --> F["获得 Behavior EXP"]
  C --> G["Tier progress"]
  D --> G
  E --> G
  F --> G
  G --> H["Tier benefits"]
  A --> I["Points balance"]
  I --> J["兑换 coupon / voucher"]
  J --> K["My Rewards"]
  K --> L["Checkout 使用"]
  L --> M["Benefit usage record"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 积分规则 | points per dollar、兑换成本、过期规则 | 管理用户价值感和财务成本 |
| EXP 规则 | purchase、wallet、gift、mission contribution | 引导业务目标行为 |
| Tier 体系 | 等级门槛、权益包、会员价 | 提升长期留存 |
| 权益生命周期 | claimed、active、used、expired | 防止重复使用和用户混淆 |
| 任务运营 | daily check-in、streak、限时任务 | 增加打开频次和复购 |

关键数据：

- points_earned、points_redeemed、exp_earned
- reward_claimed、reward_used、reward_expired
- tier_progress_view、tier_upgraded

### 4.8 Gift：饮品券与 Wallet eCard

```mermaid
flowchart TD
  A["Gift tab"] --> B["选择 occasion"]
  B --> C{"礼品类型"}
  C -- "Drink Voucher" --> D["选择券类型/金额"]
  C -- "Wallet eCard" --> E["选择 eCard 金额"]
  D --> F["填写收礼人和祝福语"]
  E --> F
  F --> G["Review"]
  G --> H["权益计算\nPoints benefit if eligible"]
  H --> I["Cashier"]
  I --> J["礼品码 issued"]
  J --> K{"收礼人状态"}
  K -- "领取" --> L["Gift claimed"]
  K -- "未领取" --> M["Active until expiry"]
  K -- "过期" --> N["Gift expired"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 场景运营 | birthday、exam、thank you、holiday | 提升送礼转化 |
| 礼品 SKU | voucher 类型、eCard 金额、有效期 | 管理商品化礼品 |
| 增长运营 | 收礼人打开、领取、注册、首购 | Gift 是拉新渠道 |
| CRM | 送达提醒、领取提醒、即将过期提醒 | 提高领取率 |
| 风控 | 礼品码唯一、领取幂等、过期状态 | 防止重复领取和客服争议 |

### 4.9 Partner Offers

```mermaid
flowchart TD
  A["Home / Rewards 展示 partner offer"] --> B["Offer detail"]
  B --> C{"Offer 类型"}
  C -- "免费领取" --> D["Claim coupon"]
  C -- "付费 voucher / ticket" --> E["Purchase partner offer"]
  E --> F["权益计算\n通常不使用 Bonus"]
  F --> G["Cashier"]
  G --> H["Partner voucher issued"]
  D --> I["My Rewards"]
  H --> I
  I --> J["到合作商家核销"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 商家运营 | offer 库存、价格、佣金、展示时段 | 变现和本地生活合作 |
| Sponsored placement | Home / Rewards 推荐位 | 提高商家曝光 |
| 核销规则 | 有效期、使用条件、条码/券码 | 支持商家核销和对账 |
| 数据报表 | impression、claim、purchase、redemption | 给商家和内部运营评估 ROI |

### 4.10 Activity / Receipt / Support

```mermaid
flowchart TD
  A["业务动作完成"] --> B{"记录类型"}
  B -- "Order" --> C["Order history / detail"]
  B -- "Payment" --> D["Payment receipt"]
  B -- "Wallet" --> E["Wallet ledger"]
  B -- "Gift" --> F["Gift activity"]
  B -- "Benefit" --> G["Benefit usage record"]
  C --> H["Support / reconciliation"]
  D --> H
  E --> H
  F --> H
  G --> H
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 审计链路 | order number、payment id、wallet transaction、gift code | 支持用户信任和客服处理 |
| 异常售后 | 支付失败、未出货、订单过期、余额不足 | 把复杂问题转成可解释状态 |
| 财务对账 | 订单、支付、钱包、bonus、partner voucher | 降低财务和客服成本 |
| CRM 触发 | receipt、pickup reminder、gift claimed、expiry alert | 用交易事件驱动消息 |

### 4.11 Account / Settings / Permissions

```mermaid
flowchart TD
  A["Account"] --> B["Personal Info"]
  A --> C["Wallet & Payments"]
  A --> D["Notification Preferences"]
  A --> E["Privacy & Data"]
  A --> F["Theme / Display"]
  A --> G["Help / About"]
  D --> H["Push / Email / SMS opt-in"]
  E --> I["Consent and data controls"]
  C --> J["Payment method and auto reload authorization"]
```

| 运营环节 | 体现方式 | 作用 |
| --- | --- | --- |
| 用户资料 | 姓名、邮箱、手机、邮编、生日 | 支持收据、会员权益、生日活动、地区运营 |
| 通知偏好 | receipt、reward、campaign、support | 合规地做 CRM |
| 隐私合规 | consent、data policy、account id | 满足北美市场基本要求 |
| 支付设置 | 默认支付方式、wallet、auto reload | 支持交易转化和复购 |

## 5. 权益统一计算原则

权益和价格不能散落在不同页面里。所有交易型流程都应该调用同一套价格/权益规则。

```mermaid
flowchart LR
  A["App preorder"] --> ENGINE["Unified pricing & benefit engine"]
  B["VM Scan & Pay"] --> ENGINE
  C["Gift purchase"] --> ENGINE
  D["Partner offer purchase"] --> ENGINE
  E["Add Funds"] --> ENGINE

  ENGINE --> RULES["Rules\nmember price / coupon / voucher / points / bonus / exclusions"]
  RULES --> RESULT["Payable amount\nbenefits applied\npoints/EXP estimate\nusage records"]
```

建议原则：

- App 预点单和 VM App Pay 必须使用一致的 coupon、voucher、points、member price 规则。
- Bonus Balance 不是现金，适用范围应明确，通常不应用于 partner purchases。
- Benefit usage record 必须在支付成功后生成，支付失败不应核销。
- Points/EXP 的 earn 和 redeem 需要可追踪，便于客服和数据分析。
- 每一笔 checkout 都应该能解释：原价、优惠、积分、bonus、实付、支付方式。

## 6. 状态与异常模型

```mermaid
stateDiagram-v2
  [*] --> Browsing
  Browsing --> Checkout: 选商品 / 扫 VM / 送礼 / partner offer
  Checkout --> PaymentPending: 打开 Cashier
  PaymentPending --> Failed: 支付失败 / 余额不足
  PaymentPending --> Paid: 支付成功

  Paid --> ReadyToCollect: App 预点单
  ReadyToCollect --> Completed: 用户取货
  ReadyToCollect --> Expired: 超过 pickup window
  Expired --> BonusCredited: 金额进入 Bonus Balance

  Paid --> VMPaid: VM App Pay
  VMPaid --> Dispensing: 云端通知 VM
  Dispensing --> Completed: VM 出货回调
  Dispensing --> SupportNeeded: 无回调 / 机器故障

  Paid --> GiftIssued: Gift
  GiftIssued --> GiftClaimed: 收礼人领取
  GiftIssued --> GiftExpired: 礼品过期

  Paid --> PartnerVoucherIssued: Partner offer
  PartnerVoucherIssued --> PartnerRedeemed: 商家核销

  Failed --> Checkout: 重试 / 换支付方式 / Add Funds
  BonusCredited --> Wallet
  Completed --> Activity
  GiftClaimed --> Activity
  PartnerRedeemed --> Activity
```

## 7. 运营看板建议

### 激活看板

- onboarding completion rate
- sign-in method distribution
- OTP sent to verified rate
- third-party verified to profile completed rate
- profile completion rate
- first order / first scan / first add funds

### 交易看板

- product impression to detail
- detail to cart
- cart to checkout
- checkout to payment success
- payment success to pickup / dispense completed
- failed payment rate by method

### VM 设备看板

- scan success rate
- QR resolved to paid rate
- paid to dispense callback latency
- paid but not dispensed exceptions
- exception rate by VM
- inventory availability by VM and SKU

### 钱包看板

- Add Funds conversion
- bonus campaign ROI
- auto reload opt-in rate
- cash balance liability
- bonus balance liability
- bonus used / expired / credited from expired orders

### 权益看板

- coupon claim rate
- voucher redemption rate
- points earn / redeem ratio
- reward expiry rate
- benefit usage by checkout type
- tier upgrade and retention by tier

### 礼品看板

- gift started to sent
- gift sent to claimed
- recipient account creation
- recipient first purchase
- gift expired rate

### Partner 看板

- partner offer impression
- claim / purchase conversion
- voucher redemption
- partner revenue
- sponsored placement performance

### 售后与异常看板

- payment failure
- insufficient wallet balance
- expired prepaid orders
- VM paid but not dispensed
- duplicate benefit attempts
- support tickets by root cause

## 8. 业务流程与运营触点总表

| 业务流程 | 用户目标 | 运营体系体现 | 核心配置 | 核心数据 |
| --- | --- | --- | --- | --- |
| Onboarding | 理解产品价值 | 内容运营、激活漏斗 | 页数、图片、文案、排序 | view、next、skip |
| 注册/登录 | 快速进入账户 | 身份策略、consent、CRM 分层 | OTP、SSO、terms、opt-in | method、verified、profile_completed |
| Home | 发现下一步行动 | CMS、个性化、campaign ranking | banner、quick action、best seller | impression、click、source |
| App 预点单 | 提前购买并取货 | SKU、价格、权益、订单运营 | SKU、库存、pickup window | cart、payment、pickup、expired |
| VM App Pay | 为设备端订单付款 | VM order sync、权益统一、设备履约 | QR、VM order、cloud callback | paid、dispensed、machine_id |
| VM Map | 找到可用机器 | 设备运营、库存运营、位置策略 | VM 状态、库存、筛选 | location、vm_detail、navigate |
| Wallet | 管理余额 | 钱包运营、资金规则 | cash、bonus、ledger | balance、top_up、bonus_used |
| Add Funds | 充值拿 bonus | 充值活动、财务责任 | amount、bonus、campaign | conversion、liability |
| Auto Reload | 自动补足余额 | 支付授权、留存运营 | threshold、reload amount | opt_in、triggered |
| Rewards | 使用权益 | 权益引擎、积分、会员等级 | coupon、voucher、points、tier | claim、redeem、use、expire |
| Gift | 给别人送饮品/余额 | 场景运营、拉新、CRM | occasion、gift SKU、expiry | sent、claimed、recipient_first_purchase |
| Partner Offer | 购买/领取合作权益 | 商家运营、核销、赞助位 | offer、inventory、commission | impression、purchase、redeem |
| Activity | 查记录和凭证 | 审计、客服、对账 | receipt、linked IDs | record_open、support_case |
| Notifications | 被提醒和召回 | CRM、生命周期运营 | push/email/SMS rules | delivered、opened、converted |
| Account | 管理资料和偏好 | 合规、支付设置、隐私 | profile、payment、privacy | updated、opt_in、default_payment |

## 9. 产品与工程落地建议

- 把“权益计算”抽象成统一服务，不要在 App preorder、VM pay、Gift、Partner 中各算一套。
- 把 VM payment status 和 VM dispense status 分离，否则无法处理“已付款但未出货”。
- 把 Bonus Balance 的规则写入产品文案和流水详情，避免用户以为它等同现金。
- 把 Activity 做成审计中心，而不只是历史列表；每条记录都应能追溯 order/payment/wallet/benefit/gift code。
- 把 CRM 权限和通知偏好映射到具体业务事件：receipt、pickup reminder、reward expiry、gift claim、support exception。
- 把所有运营坑位都设计成可配置：Home banner、best sellers、partner offers、missions、Add Funds offers。
- 对所有支付成功后的业务动作做幂等：订单创建、权益核销、积分入账、礼品码发放、partner voucher issuing。

