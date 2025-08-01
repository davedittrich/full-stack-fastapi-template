/**
 * Branding configuration for the application
 * Centralized location for all branding assets including logos, icons, and images
 */

// Define different branding profiles
const TANZANITE_BRANDING = {
  appName: "Tanzanite",
  appDescription: "Educational Platform for Cybersecurity Training",
  logo: {
    main: "/assets/images/tanzanite-logo.png",
    alt: "/assets/images/tanzanite-logo.png",
    fallback: "/assets/images/fastapi-logo.svg",
  },
  colors: {
    primary: "#009688", // Teal
    secondary: "#607D8B", // Blue Grey
    accent: "#FF5722", // Deep Orange
  },
  links: {
    website: "https://github.com/davedittrich/tanzanite",
    documentation: "https://github.com/davedittrich/tanzanite/wiki",
    support: "https://github.com/davedittrich/tanzanite/issues",
  },
} as const

const FASTAPI_BRANDING = {
  appName: "Full Stack FastAPI Project",
  appDescription: "FastAPI Full Stack Application",
  logo: {
    main: "/assets/images/fastapi-logo.svg",
    alt: "/assets/images/fastapi-logo.svg",
    fallback: "/assets/images/fastapi-logo.svg",
  },
  colors: {
    primary: "#009688", // Keep same teal for consistency
    secondary: "#607D8B",
    accent: "#FF5722",
  },
  links: {
    website: "https://github.com/fastapi-users/full-stack-fastapi-template",
    documentation: "https://github.com/fastapi-users/full-stack-fastapi-template",
    support: "https://github.com/fastapi-users/full-stack-fastapi-template/issues",
  },
} as const

// Environment-based branding selection
// You can change this to 'FASTAPI' to switch back to original branding
const BRANDING_PROFILE: 'TANZANITE' | 'FASTAPI' = 'TANZANITE'

export const BRANDING = {
  // Application branding
  ...(BRANDING_PROFILE === 'TANZANITE' ? TANZANITE_BRANDING : FASTAPI_BRANDING),
  
  // Common configurations
  favicons: {
    ico: "/favicon.ico",
    png16: "/favicon-16x16.png", 
    png32: "/favicon-32x32.png",
  },
  
  backgrounds: {
    login: null, // No background image by default
    dashboard: null,
  },
} as const

// Type-safe getter functions
export const getLogo = (type: keyof typeof BRANDING.logo = 'main') => BRANDING.logo[type]
export const getFavicon = (type: keyof typeof BRANDING.favicons = 'ico') => BRANDING.favicons[type]
export const getBackground = (type: keyof typeof BRANDING.backgrounds) => BRANDING.backgrounds[type]
export const getBrandColor = (type: keyof typeof BRANDING.colors) => BRANDING.colors[type]