import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"
import { BRANDING } from "./config/branding"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: BRANDING.colors.primary },
        },
        brand: {
          primary: { value: BRANDING.colors.primary },
          secondary: { value: BRANDING.colors.secondary },
          accent: { value: BRANDING.colors.accent },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
