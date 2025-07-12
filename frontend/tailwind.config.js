/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Enhanced color palette to match main site
        cyan: {
          400: "#0dcaf0",
          500: "#0dcaf0",
          600: "#0aa5c7",
        },
        fuchsia: {
          400: "#ff00ff",
          500: "#ff00ff", 
          600: "#cc00cc",
        },
        green: {
          400: "#00ff99",
          500: "#00ff99",
          600: "#00cc7a",
        },
        purple: {
          400: "#a855f7",
          500: "#a855f7",
          600: "#9333ea",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        glitch: {
          "0%": {
            textShadow: "0.05em 0 0 rgba(255, 0, 255, 0.75), -0.05em -0.025em 0 rgba(0, 255, 153, 0.75), -0.025em 0.05em 0 rgba(13, 202, 240, 0.75)"
          },
          "14%": {
            textShadow: "0.05em 0 0 rgba(255, 0, 255, 0.75), -0.05em -0.025em 0 rgba(0, 255, 153, 0.75), -0.025em 0.05em 0 rgba(13, 202, 240, 0.75)"
          },
          "15%": {
            textShadow: "-0.05em -0.025em 0 rgba(255, 0, 255, 0.75), 0.025em 0.025em 0 rgba(0, 255, 153, 0.75), -0.05em -0.05em 0 rgba(13, 202, 240, 0.75)"
          },
          "49%": {
            textShadow: "-0.05em -0.025em 0 rgba(255, 0, 255, 0.75), 0.025em 0.025em 0 rgba(0, 255, 153, 0.75), -0.05em -0.05em 0 rgba(13, 202, 240, 0.75)"
          },
          "50%": {
            textShadow: "0.025em 0.05em 0 rgba(255, 0, 255, 0.75), 0.05em 0 0 rgba(0, 255, 153, 0.75), 0 -0.05em 0 rgba(13, 202, 240, 0.75)"
          },
          "99%": {
            textShadow: "0.025em 0.05em 0 rgba(255, 0, 255, 0.75), 0.05em 0 0 rgba(0, 255, 153, 0.75), 0 -0.05em 0 rgba(13, 202, 240, 0.75)"
          },
          "100%": {
            textShadow: "-0.025em 0 0 rgba(255, 0, 255, 0.75), -0.025em -0.025em 0 rgba(0, 255, 153, 0.75), -0.025em -0.05em 0 rgba(13, 202, 240, 0.75)"
          }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(13, 202, 240, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(13, 202, 240, 0.8), 0 0 30px rgba(255, 0, 255, 0.4)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        glitch: "glitch 5s infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s infinite",
      },
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'orbitron': ['Orbitron', 'sans-serif'],
        'techie': ['Orbitron', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-cyber': 'linear-gradient(45deg, #0dcaf0, #ff00ff, #00ff99)',
        'gradient-card': 'linear-gradient(135deg, rgba(13, 202, 240, 0.1) 0%, rgba(255, 0, 255, 0.1) 50%, rgba(0, 255, 153, 0.1) 100%)',
      },
      backdropBlur: {
        'glass': '16px',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} 