# Theme access

Guests use the original `default` site theme. The HTML startup script always starts with this theme, even when local storage contains a cultural theme. `ThemeProvider` applies the stored choice only after `/api/v1/auth/me` confirms an authenticated session. Registration alone does not create a session or unlock the picker.

The theme picker and theme radio choices are hidden for guests. The provider also ignores guest attempts to change the active site theme; storage synchronization can update the remembered preference but cannot activate it for a guest. The existing light/dark control remains available for the default theme.

Successful login unlocks theme selection. Logout immediately returns the active site theme to default without erasing the last preference. Authentication changes propagate to other tabs on the same origin. A failed initial session check keeps the default theme; focus and visibility changes recheck the server session. Unauthorized protected API responses also clear the authenticated state. Theme selection is a presentation preference, not authorization for protected backend data.

## Seasonal appearance

An administrator can enable or disable Winter from **Admin → Cài đặt → Giao diện theo mùa**. The shared setting is stored in the database and changes appear in the admin audit log. Apply `alembic upgrade head` before serving the updated backend. The migration initializes Winter as disabled.

Authenticated users load the shared setting when they enter the site and refresh it when they return to the tab. During an active season, their first visit uses Winter even if the browser already has a personal theme. Choosing a personal theme in the picker also opts out of the current season for that account on the current browser. Choosing **Theo mùa · Mùa đông** clears that override. Starting a new season resets seasonal overrides. Disabling Winter restores the normal browser preference.
