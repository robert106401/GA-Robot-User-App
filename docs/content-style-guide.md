# G&A Robot Content and Navigation Guide

## Product language

- Brand name: `G&A Robot`
- Primary app language: English
- Use `Home`, never `HOME`
- Use `Top Up` as a noun, verb, title, and activity type; do not use `Top-up` or `Top up`
- Use `Order Ahead` for the feature that lets users buy before arriving.
- Use `Pickup Order` for an order created through Order Ahead.
- Use `Pay at VM` for an app-assisted purchase started at the machine.
- Use `Voucher` for a paid or gifted redemption entitlement, such as a Coffee Voucher.
- Use `Coupon` for a promotional discount with eligibility or usage conditions.
- Use `Offer` for campaign messaging or an entry point that may grant a Coupon.
- Use `App Wallet` for the product and `Available Balance`, `Cash Balance`, and `Bonus Balance` for its values
- Use `EXP` and `Points` consistently
- Use `Vending Machine` in explanatory copy and `VM` in compact labels such as `VM Map`
- Use `Payment History` for payment records and `Order History` for order records

## Page structure

- Every page uses the shared `Screen` component for title, eyebrow, trailing status, scrolling, and spacing
- Secondary pages pass `onBack` and an optional contextual `backLabel` to `Screen`
- Do not implement page-specific Header or back-button styles
- Use a short `Back` label by default; use contextual labels only when the destination matters, such as `Back to Orders`

## Bottom actions

- Purchase-critical actions use `BottomActionBar`
- Cart and Checkout show a summary on the left and the primary action on the right
- Product detail uses paired secondary and primary actions
- Top Up uses App Wallet green for its primary action
- Do not place the final purchase action inside scrollable page content
