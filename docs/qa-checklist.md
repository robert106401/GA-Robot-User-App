# QA Checklist

## Core purchase flow

- Open Home, enter a SKU detail page, change quantity and customization.
- Tap Add to Cart and verify the temporary success message appears.
- Open Cart, deselect and reselect items, remove one item, and verify totals update.
- Checkout with App Wallet when balance is sufficient.
- Verify a Ready to collect order is created and appears in Home pickup cards and Account → Activity → Orders.
- Open Order Detail and verify pickup code, countdown, paid amount, item quantity, payment method, and points.

## Top Up flow

- Open Top Up from Home or Account.
- Switch amount cards and payment method.
- Tap Top Up and verify the loading state prevents duplicate taps.
- Verify Cash Balance, Bonus Balance, payment history, and wallet history update.
- Restart the app and verify wallet state persists.

## Payment history

- Complete a wallet checkout and verify payment history records App Wallet.
- Complete a card/Apple Pay/Google Pay checkout and verify the matching method is recorded.
- Complete a Top Up and verify paid amount and bonus amount are shown in payment history.

## Exception states

- Checkout with wallet balance below payable amount and verify payment is blocked with a Top Up hint.
- Turn on QA payment failure simulation in Checkout and verify no order is created and no balance changes.
- Select an out-of-stock SKU and verify Add to Cart / Buy Now are disabled in detail view.
- Open a VM that is not Online and verify Pickup and Pay at VM are marked unavailable.
- Open an expired pickup order and verify the pickup code is hidden behind an expired state.

## Persistence

- Add items to cart, favorite a SKU, complete a Top Up, and create an order.
- Restart the app.
- Verify cart, favorites, wallet balances, payment history, wallet history, and orders remain available.

## Accessibility and small screens

- Verify all primary action buttons have at least 44px touch targets.
- Increase system text size and verify totals, SKU names, payment subtitles, and pickup codes remain readable.
- Check long SKU names and order titles do not overlap trailing amounts or icons.
- Check warning/error text contrast on amber and red backgrounds.
