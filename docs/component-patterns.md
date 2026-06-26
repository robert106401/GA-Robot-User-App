# Shared Component Patterns

## Filters

Use `FilterPills` for compact single-select filters.

- Supply typed options with `value`, optional `label`, `icon`, and `count`
- Keep filtering logic in the screen; the component only renders selection
- Do not recreate pill spacing, active colors, or count styling locally

## Activity and history rows

Use `ActivityListRow` for payment, wallet, and simple record history.

- Provide the leading icon, title, optional description and metadata
- Use `badge`, `detail`, and `trailing` slots for business-specific content
- Keep complex fulfillment rows, such as pickup countdown orders, as dedicated components

## Payment methods

Use `PaymentMethodCard` for both payment selection and current-method summaries.

- `action="radio"` renders a selectable payment option
- `action="change"` renders the current method with a change affordance
- App Wallet is emphasized by default
- Override subtitle and detail text in the screen, where balances and points are calculated

Shared components own visual behavior. Screens own business calculations, filtering, navigation, and state.
