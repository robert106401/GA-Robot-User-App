# G&A Robot Design Tokens

All reusable UI styling lives in `src/theme.ts`. Product artwork, campaign art, SKU colors, and membership-tier palettes may remain local because they communicate content rather than interface state.

## Color layers

- `palette`: raw named color values. Add a value here only when the existing palette cannot express the design.
- `colors`: semantic app colors such as canvas, surface, ink, muted text, borders, brand accents, and dark-surface text.
- `statusColors`: complete state families for success, warning, danger, information, and neutral states. Each family includes text, background, subtle background, and border values.

Do not add a new green, red, amber, or blue directly inside a component for a generic status. Use `statusColors`.

## Typography

- `fontSizes`: the approved type scale.
- `fontWeights`: named weights from regular through black.
- `typography`: reusable roles including page title, section title, body, label, button, value, and caption.

Prefer spreading a typography role into a style. Use an individual size or weight token only when a role needs a deliberate variation.

## Layout

- `spacing`: shared spacing scale plus page-specific values such as `screenX`, `section`, and bottom padding.
- `radii`: shared corner-radius scale.
- `controlSizes`: standard interactive heights for navigation, icon buttons, primary buttons, and bottom action bars.

## Usage rule

Shared components and transaction-critical pages must use tokens. A local literal is acceptable only when it represents illustration geometry, a data visualization, a product-specific color, or a one-off transparent overlay.
