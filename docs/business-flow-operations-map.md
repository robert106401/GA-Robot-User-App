# GA Robot User App Business Flow & Operations Map

This document maps the full user-facing business flow and explains how the operations system supports each journey. It is intended for product, operations, design, and engineering alignment.

## Scope

The current app covers these business domains:

- Account and onboarding
- Home discovery and personalized shortcuts
- App preorder for VM pickup
- VM Scan & Pay for machine-side orders
- Wallet eCard, Add Funds, Bonus Balance, and Auto Reload
- Benefits, coupons, vouchers, points, tiers, EXP, and missions
- Gifts: drink voucher and wallet eCard
- Partner offers and partner vouchers
- Activity history: orders, wallet, payments, gifts
- Account settings, payment methods, notification preferences, and QA tools

## End-To-End Business Map

```mermaid
flowchart TD
  U["User opens GA Robot App"] --> AUTH{"Signed in?"}
  AUTH -- "No" --> OB["App onboarding\nValue education"]
  OB --> SIGN["Sign In / Create Account"]
  SIGN --> IDV{"Identity method"}
  IDV -- "Email / SMS OTP" --> OTP["Send code\nEnter 6-digit code\nAuto verify"]
  IDV -- "Google / Apple" --> SSO["Third-party verified\nTransition back to app"]
  OTP --> PROFILE["Create Account\nCollect profile basics"]
  SSO --> PROFILE
  PROFILE --> HOME["Home"]
  AUTH -- "Yes" --> HOME

  HOME --> DISCOVERY["Discovery surfaces\nBanners, best sellers, partner offers,\nneeds attention, nearby shortcuts"]
  HOME --> ORDER["Order tab\nBrowse products"]
  HOME --> SCAN["Scan & Pay\nVM QR order payment"]
  HOME --> GIFT["Gift tab\nSend voucher/eCard"]
  HOME --> REWARDS["Rewards tab\nPoints, benefits, coupons, vouchers"]
  HOME --> ACCOUNT["Account\nWallet, settings, history"]

  ORDER --> CART["Cart / SKU detail\nCustomization and cart"]
  CART --> CHECKOUT["Checkout\nBenefits, points, payment method"]
  CHECKOUT --> CASHIER["Secure cashier"]
  CASHIER --> PREPAID["Prepaid order created\nPickup code / collection window"]
  PREPAID --> ORDER_DETAIL["Order detail\nReady, completed, expired"]

  SCAN --> VM_SCAN["Open camera simulation\nVM QR recognized"]
  VM_SCAN --> VM_ORDER["VM order loaded\nItems, price, order number"]
  VM_ORDER --> VM_BENEFITS["Eligible app benefits applied\nCoupons, vouchers, points"]
  VM_BENEFITS --> CASHIER
  CASHIER --> VM_PAID["VM order paid"]
  VM_PAID --> VM_CLOUD["VM cloud confirms dispense"]
  VM_CLOUD --> ORDER_DETAIL

  GIFT --> GIFT_SETUP["Choose occasion and gift type"]
  GIFT_SETUP --> GIFT_DETAILS["Recipient, amount/item, message"]
  GIFT_DETAILS --> GIFT_REVIEW["Review gift\nApply benefits if eligible"]
  GIFT_REVIEW --> CASHIER
  CASHIER --> GIFT_SENT["Gift sent\nGift code issued"]
  GIFT_SENT --> ACTIVITY_GIFT["Gift activity\nClaimed / active / expired"]

  REWARDS --> MY_REWARDS["My Rewards\nCoupons, vouchers, point rewards"]
  REWARDS --> POINTS["Points center\nRedeem rewards"]
  REWARDS --> TIER["Tier journey\nEXP, benefits, progress"]
  REWARDS --> MISSIONS["Missions / check-in\nBehavior incentives"]

  ACCOUNT --> WALLET["Wallet eCard\nCash + Bonus balance"]
  WALLET --> ADD_FUNDS["Add Funds\nBonus campaigns"]
  WALLET --> AUTO_RELOAD["Auto Reload settings"]
  ACCOUNT --> HISTORY["Activity history\nOrders, wallet, payments, gifts"]
  ACCOUNT --> SETTINGS["Profile, security, notifications,\npayment methods, display settings"]

  ADD_FUNDS --> CASHIER
  CASHIER --> WALLET_UPDATED["Wallet updated\nCash and Bonus records"]

  DISCOVERY --> OPS["Operations system"]
  PREPAID --> OPS
  VM_PAID --> OPS
  GIFT_SENT --> OPS
  MY_REWARDS --> OPS
  WALLET_UPDATED --> OPS
```

## Operations System Layer

The operations system is not a single page. It is the platform layer that decides what the app shows, what benefits are eligible, how orders move through states, and how the business learns from user behavior.

```mermaid
flowchart LR
  subgraph OPS["Operations System"]
    CMS["Campaign / content management\nBanners, best sellers, product labels"]
    PROMO["Promotion engine\nCoupons, vouchers, bonus offers,\nmember pricing"]
    LOYALTY["Loyalty engine\nPoints, EXP, tiers, missions,\ncheck-in, referrals"]
    WALLET_OPS["Wallet operations\nCash, Bonus, Add Funds,\nAuto Reload, exception credits"]
    ORDER_OPS["Order operations\nPrepaid pickup window,\nVM order status, cloud dispense"]
    PARTNER_OPS["Partner operations\nOffer inventory, paid vouchers,\npartner redemption"]
    CRM["CRM / notification rules\nReceipts, reminders, rewards,\nwin-back, lifecycle messaging"]
    RISK["Risk and QA controls\nPayment failure simulation,\nbenefit usage records,\nanti-duplication"]
    ANALYTICS["Analytics\nFunnel, conversion, redemption,\nrepeat purchase, cohort value"]
  end

  subgraph APP["User App"]
    HOME["Home"]
    ORDER["Order / Checkout"]
    SCAN["VM Scan & Pay"]
    GIFT["Gift"]
    REWARDS["Rewards"]
    WALLET["Wallet"]
    ACTIVITY["Activity / History"]
    ACCOUNT["Account"]
  end

  CMS --> HOME
  CMS --> ORDER
  PROMO --> ORDER
  PROMO --> SCAN
  PROMO --> GIFT
  PROMO --> REWARDS
  LOYALTY --> HOME
  LOYALTY --> REWARDS
  LOYALTY --> ORDER
  WALLET_OPS --> WALLET
  WALLET_OPS --> ORDER
  WALLET_OPS --> SCAN
  ORDER_OPS --> ORDER
  ORDER_OPS --> SCAN
  ORDER_OPS --> ACTIVITY
  PARTNER_OPS --> HOME
  PARTNER_OPS --> REWARDS
  CRM --> HOME
  CRM --> ACTIVITY
  CRM --> ACCOUNT
  RISK --> ORDER
  RISK --> WALLET
  RISK --> REWARDS
  ANALYTICS --> OPS
```

## Core Business Flows

### 1. Account Creation And Login

```mermaid
flowchart TD
  A["App onboarding"] --> B["Sign In"]
  B --> C{"User chooses method"}
  C -- "Email / SMS" --> D["Enter phone or email"]
  D --> E["Send code"]
  E --> F["6-digit code auto verification"]
  F --> G["Create Account\nAccount details"]
  C -- "Google / Apple" --> H["Third-party identity verified"]
  H --> I["Transition back to app"]
  I --> G
  G --> J["Terms accepted\nOptional marketing opt-in"]
  J --> K["Home"]
```

Operations role:

- Defines onboarding value messages and sequencing.
- Supports identity policy: accepted login methods, OTP retry/resend rules, and third-party profile completion requirements.
- Captures consent: terms acceptance, privacy acknowledgement, marketing preference.
- Feeds CRM segmentation: new account, profile completion, marketing opt-in, first-session behavior.

### 2. App Preorder For VM Pickup

```mermaid
flowchart TD
  A["Browse products"] --> B["SKU detail / customization"]
  B --> C["Add to cart"]
  C --> D["Checkout"]
  D --> E["Benefit eligibility\nCoupons, vouchers, points"]
  E --> F["Select payment method"]
  F --> G["Secure cashier"]
  G --> H{"Payment success?"}
  H -- "No" --> I["Payment failed\nNo mutation"]
  H -- "Yes" --> J["Prepaid order created"]
  J --> K["Pickup code / redemption method"]
  K --> L{"Collected before expiry?"}
  L -- "Yes" --> M["Completed"]
  L -- "No" --> N["Expired"]
  N --> O["Paid amount moved to Bonus Balance\nException wallet record"]
```

Operations role:

- Manages menu availability, pricing, labels, recommendation priority, and product merchandising.
- Configures benefit rules and prevents duplicate use through benefit usage records.
- Owns pickup policy: collection window, expired order handling, and customer-facing recovery rule.
- Monitors funnel: product view, cart, checkout, payment success, pickup, expiry.
- Creates interventions: pickup reminders, expiring-order alerts, post-expiry service recovery.

### 3. VM Scan & Pay

```mermaid
flowchart TD
  A["User chooses drink on VM"] --> B["VM creates unpaid order"]
  B --> C["App scans VM QR"]
  C --> D["App loads VM order\nItems, price, VM, order number"]
  D --> E["App evaluates benefits\nSame rules as app checkout"]
  E --> F["Cashier payment"]
  F --> G["Order status: Paid"]
  G --> H["Cloud tells VM payment succeeded"]
  H --> I["VM dispenses drink"]
  I --> J["Cloud notifies app"]
  J --> K["Order status: Completed"]
```

Operations role:

- Synchronizes VM-side order data with app checkout: item, price, machine, order number.
- Applies the same benefit policy as app orders, so users do not lose benefits when paying for VM orders.
- Tracks machine fulfillment status and separates app payment success from VM dispense completion.
- Enables operational monitoring: machine failure, payment without dispense, late cloud callback, order reconciliation.
- Supports local VM campaigns: machine-specific products, campus promos, time-based incentives.

### 4. Wallet, Add Funds, Bonus, And Auto Reload

```mermaid
flowchart TD
  A["Wallet eCard"] --> B["Cash Balance"]
  A --> C["Bonus Balance"]
  A --> D["Add Funds"]
  D --> E["Select amount"]
  E --> F["Bonus campaign applied"]
  F --> G["Cashier payment"]
  G --> H["Cash credited"]
  H --> I["Bonus credited"]
  A --> J["Auto Reload"]
  J --> K["Threshold and reload amount"]
  K --> L["Low balance trigger"]
  L --> G
  C --> M["Used first for eligible GA Robot drinks"]
```

Operations role:

- Configures Add Funds offers: amount, bonus value, reward rate.
- Defines Bonus Balance rules: where bonus can be used, priority of use, and exclusions such as partner purchases.
- Controls Auto Reload thresholds and amounts.
- Tracks liability: cash balance, bonus balance, top-up history, exception credits.
- Drives revenue operations: prepaid wallet adoption, repeat purchase, breakage risk, and bonus ROI.

### 5. Benefits, Rewards, Points, EXP, And Tiers

```mermaid
flowchart TD
  A["User activity"] --> B{"Activity type"}
  B -- "Purchase" --> C["Earn points and EXP"]
  B -- "Add Funds" --> D["Earn wallet EXP"]
  B -- "Gift" --> E["Earn gift EXP"]
  B -- "Check-in / mission" --> F["Earn behavior EXP"]
  C --> G["Tier progress"]
  D --> G
  E --> G
  F --> G
  G --> H["Tier benefits"]
  A --> I["Points balance"]
  I --> J["Redeem point rewards"]
  J --> K["Coupon / voucher added to My Rewards"]
  K --> L["Benefit applied in checkout"]
  L --> M["Benefit usage record"]
```

Operations role:

- Defines earn rules: points per dollar, EXP per action, streak bonuses, referral/gift rewards.
- Maintains tiers and benefit packages: Gold, Platinum, Diamond, and member price eligibility.
- Curates point rewards and cost levels.
- Tracks reward lifecycle: active, used, expired.
- Optimizes incentives: which behaviors need missions, which cohorts need bonus offers, which tiers need better retention benefits.

### 6. Gift Flow

```mermaid
flowchart TD
  A["Gift tab"] --> B["Choose occasion"]
  B --> C{"Gift type"}
  C -- "Drink voucher" --> D["Select drink/value"]
  C -- "Wallet eCard" --> E["Select amount"]
  D --> F["Recipient and message"]
  E --> F
  F --> G["Review gift"]
  G --> H["Apply eligible points/benefits"]
  H --> I["Cashier payment"]
  I --> J["Gift code issued"]
  J --> K{"Recipient status"}
  K -- "Claims" --> L["Gift claimed"]
  K -- "No action" --> M["Gift active until expiry"]
  K -- "Expired" --> N["Gift expired"]
```

Operations role:

- Defines gift occasions, suggested copy, recommended gift type, and voucher design.
- Controls gift validity, claim rules, and recipient experience.
- Uses gift flow as acquisition: recipient may become a new registered user.
- Tracks sender/recipient graph for referral and CRM.
- Measures viral loop: gift sent, gift opened, gift claimed, first purchase after gift.

### 7. Partner Offers

```mermaid
flowchart TD
  A["Home / Rewards partner offers"] --> B["Offer detail"]
  B --> C{"Offer type"}
  C -- "Free claim" --> D["Claim coupon"]
  C -- "Paid partner voucher / ticket" --> E["Purchase offer"]
  E --> F["Points benefit eligibility"]
  F --> G["Cashier payment"]
  G --> H["Partner voucher issued"]
  D --> I["My Rewards"]
  H --> I
  I --> J["Redeem with partner"]
```

Operations role:

- Manages partner inventory, pricing, claim limits, expiry, and presentation.
- Defines whether partner purchases can use wallet cash, points benefit, or bonus.
- Reconciles partner voucher issuance and redemption.
- Tracks partner performance: impressions, claims, purchases, redemption, repeat visits.
- Supports co-marketing campaigns and sponsored placement on Home.

### 8. Activity, Receipts, And Customer Support

```mermaid
flowchart TD
  A["Completed business action"] --> B{"Record type"}
  B -- "Order" --> C["Order history and detail"]
  B -- "Payment" --> D["Payment receipt"]
  B -- "Wallet" --> E["Wallet ledger"]
  B -- "Gift" --> F["Gift activity"]
  B -- "Benefit" --> G["Used benefit record"]
  C --> H["Support / reconciliation"]
  D --> H
  E --> H
  F --> H
  G --> H
```

Operations role:

- Provides audit trail for user trust and support resolution.
- Links order numbers, payment IDs, wallet transactions, benefit usage, and gift codes.
- Supports exception workflows: failed payment, expired prepaid order, VM paid but not dispensed, insufficient wallet cash.
- Enables lifecycle messages: receipts, reminders, expiry alerts, completion notifications.

## Operations Touchpoints By Business Flow

| Business flow | User-facing moment | Operations system role | Key data generated |
| --- | --- | --- | --- |
| Onboarding | Value introduction | Defines value proposition order and activation journey | Onboarding completion, skip, sign-in start |
| Login / registration | OTP, Google/Apple, profile completion | Identity policy, consent, CRM segmentation | Identity method, terms acceptance, marketing opt-in |
| Home discovery | Banners, best sellers, partner offers | Campaign ranking, merchandising, personalization | Impression, click, conversion source |
| App preorder | Cart, checkout, pickup code | Menu, pricing, benefits, pickup policy | Order, payment, points, EXP, benefit usage |
| VM Scan & Pay | Pay for VM-selected item in app | VM order sync, benefit eligibility, cloud dispense tracking | VM order, machine, paid status, completed status |
| Wallet / Add Funds | Top up, bonus, auto reload | Wallet liability, bonus rules, top-up campaigns | Cash ledger, bonus ledger, reload setting |
| Rewards | Points, coupons, vouchers | Reward catalog, redemption cost, expiry | Reward issue/use/expiry, points delta |
| Tiers / EXP | Member journey | Earn rules, tier thresholds, benefit unlocks | EXP record, tier state, mission completion |
| Gifts | Send voucher/eCard | Gift catalog, validity, recipient acquisition | Gift code, recipient, claim/expiry status |
| Partner offers | Claim/purchase partner value | Partner inventory, sponsored placement, redemption rules | Partner voucher, payment, redemption |
| Activity / receipts | History and detail | Audit, support, reconciliation | Receipts, ledger, linked IDs |
| Notifications | Reminders and offers | CRM rules and lifecycle messaging | Push/email/SMS event, opt-in state |

## State And Exception Model

```mermaid
stateDiagram-v2
  [*] --> Browsing
  Browsing --> Checkout: Add item / select VM order / gift / offer
  Checkout --> PaymentPending: Open cashier
  PaymentPending --> Failed: Payment failure or insufficient balance
  PaymentPending --> Paid: Payment success

  Paid --> ReadyToCollect: App preorder
  ReadyToCollect --> Completed: User collects
  ReadyToCollect --> Expired: Pickup window missed
  Expired --> BonusCredited: Paid amount moved to Bonus Balance

  Paid --> VMPaid: VM Scan & Pay
  VMPaid --> Completed: Cloud dispense callback
  VMPaid --> SupportNeeded: No dispense callback / machine issue

  Paid --> GiftIssued: Gift flow
  GiftIssued --> GiftClaimed: Recipient claims
  GiftIssued --> GiftExpired: Expiry reached

  Paid --> PartnerVoucherIssued: Partner offer
  PartnerVoucherIssued --> PartnerRedeemed: Redeemed with partner

  Failed --> Checkout: Retry / change payment / add funds
  BonusCredited --> Wallet
  Completed --> Activity
  GiftClaimed --> Activity
  PartnerRedeemed --> Activity
```

## Recommended Operating Dashboards

To make the operations system actionable, the team should monitor:

- Activation funnel: onboarding completion, sign-in method, profile completion, first order.
- Commerce funnel: product view, cart, checkout, payment success, pickup/dispense completion.
- VM health: scan success, paid orders, dispense callbacks, no-dispense exceptions by machine.
- Wallet health: add funds conversion, auto reload adoption, cash/bonus balance liability.
- Rewards efficiency: coupon claim, voucher redemption, points redemption, benefit usage, expiry.
- Gift loop: gift sent, gift claimed, recipient account creation, recipient first purchase.
- Partner performance: offer impressions, claims, paid purchases, redemption rate, partner revenue.
- Support exceptions: payment failures, expired prepaid orders, VM paid-not-dispensed, insufficient balance attempts.

## Product Implications

- Benefits must be evaluated consistently across app preorder, VM Scan & Pay, and gift/payment flows.
- VM payment status and VM dispense status should remain separate states.
- Bonus Balance needs clear user education because it is not equivalent to cash.
- Activity history is a business-critical audit surface, not just a user convenience page.
- Operations configuration should drive most promotional surfaces instead of hard-coded page logic.
- CRM permissions and notification preferences should map to specific operational events: receipts, pickup reminders, offer campaigns, reward expiry, and support exceptions.

