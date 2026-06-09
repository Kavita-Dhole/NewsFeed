## Packages
framer-motion | For smooth page transitions and micro-interactions

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Montserrat'", "sans-serif"],
  body: ["'Open Sans'", "sans-serif"],
}

The app uses CSS Scroll Snap for the TikTok-like feed experience.
Images are handled via Unsplash URLs as placeholders where actual data is missing.
LocalStorage is used to persist user preferences (Topics/Regions) for the "For You" feed.
