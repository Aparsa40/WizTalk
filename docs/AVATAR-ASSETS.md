# WizTalk avatar assets

Place these user-provided image files in the following exact paths before testing the new avatar UI:

- `public/avatars/harry-2d-avatar.svg` — the runtime animated vector 2D Harry avatar.
- `public/avatars/harry-2d.jpg` — the full-body 2D Harry preview/reference image.
- `public/avatars/hermione.jpg` — the Hermione character-selection image.
- `public/avatars/ron.jpg` — the Ron character-selection image.
- `public/avatars/harry-vrm-preview.jpg` — the 3D Harry preview image shown in Harry Character Settings. This is a preview only; the actual 3D model remains `public/avatars/Test-02.vrm`.

The application uses the first three files in the Character Selector and the first/last files in Harry's avatar selector.

The 2D Harry renderer uses the full-body image with a renderer-neutral lip-sync overlay and automatic blinking. The image itself remains the visual base so the character keeps the proportions of the supplied reference.

Do not put API keys or private credentials in this directory.
