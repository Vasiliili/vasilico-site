# Full-screen seller note

Shared seller-sheet.js + seller-sheet.css power «Показать продавцу» in both source/surface and borehole pump selectors. Defer-load the shared script before the route component and stylesheet after site/route styles. Route code mounts SellerSheet with its existing trigger and content panel; no calculator state is cloned or reconstructed.

Opening moves the original content into a native dialog (full-viewport fallback when showModal is unavailable), locks and remembers page scroll, makes the background inert and focuses the close button. Cross + text «Закрыть», bottom return button, Escape and native cancel return the existing panel and focus to the trigger, restore the previous hidden/details state, styles, scroll and inert flags. Native modal focus containment is supplemented with a boundary Tab handler. No URL or form values change on open/close.

Warm aged-paper colour/texture is made with static CSS gradients, with legible dark text, safe-area padding and a sticky close bar. Palette change is confined to the seller sheet. Copy/share/print retain the calculator's original event handlers. Print hides the rest of the site and toolbar, and removes decorative backgrounds. The rest of each page's print flow is preserved when the sheet is closed.

Validated with native JSDOM DOM interactions in both real calculator components: open/close, main inert and body scroll lock, focus restore, preserved values/text/parent position, copy and print handlers, Escape and bottom return. Syntax and existing price calculator regression checks pass. Real mobile browser visual QA was not available; no screenshot/native-browser claim. CSS uses full viewport, dynamic viewport height and >=48px buttons.
