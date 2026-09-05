# AnomaSense - Atmospheric Weather Intelligence

[![Live Demo - GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github)](https://gokulavi.github.io/weather-prediction/)
[![Live Demo - Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://weather-app-teal-gamma-38.vercel.app/)

> **🌐 Live Application Deployments:**
> - **GitHub Pages:** [https://gokulavi.github.io/weather-prediction/](https://gokulavi.github.io/weather-prediction/)
> - **Vercel Production:** [https://weather-app-teal-gamma-38.vercel.app/](https://weather-app-teal-gamma-38.vercel.app/)

A state-of-the-art, liquid-forest glassmorphism weather application built with React, TypeScript, and Tailwind CSS. Features 30-day extended ensemble forecasts, live Doppler radar map with scrubbing, and predictive debounced search.

## Installation and Local Setup

Follow these steps to run the project locally:

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/gokulavi/weather-prediction.git
   cd weather-prediction
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173/` by default.

4. **Build for production** (optional):
   ```bash
   npm run build
   ```

## Assumptions and Known Limitations

### Assumptions
* **Browser Support:** The application assumes a modern browser that fully supports CSS custom properties, backdrop filters (for glassmorphism), and flexbox/grid layouts.
* **API Availability:** The app assumes the open weather API (e.g., Open-Meteo) is available and responsive. It operates without an API key, relying on the free tier limits.
* **Environment:** No specific `.env` configuration is required to start the app out of the box.

### Known Limitations
* **Rate Limiting:** Because it relies on a free, unauthenticated API tier, excessive requests from the same IP address may be temporarily blocked by the provider.
* **Localization:** Currently, weather conditions and text are hardcoded in English and mapped manually from WMO weather codes.
* **Responsiveness:** The UI is heavily optimized for mobile and compact widget views. On very large desktop screens, the layout might appear wider than necessary unless constrained by a parent container.

## AI Usage Disclosure

Transparency regarding the use of AI tools in the development of this project:

* **AI Tools Used:** Google Gemini (Antigravity IDE integration).
* **Tasks Assisted With:** 
  * Bootstrapping the initial Vite + React + Tailwind v4 configuration.
  * Generating the complex UI layout and glassmorphism styling (`liquid-glass` classes).
  * Creating the boilerplate WMO weather code mapping logic (`getConditionText`).
  * Drafting this README documentation.
* **What I Wrote Myself:** 
  * The orchestration of components (`CurrentWeather`, `SearchBar`, `ForecastList`).
  * The state management architecture and data fetching integration.
  * Adjusting and refining the AI-generated design tokens to fit the specific aesthetic vision of the project.
* **Independent Technical Decision:** 
  * **Client-side Weather Code Mapping:** I made the decision to manually map standard WMO weather codes on the client side rather than relying on a heavier third-party weather SDK or an API that returns pre-formatted text. This approach ensures the application remains highly lightweight, reduces external dependency bloat, and provides the flexibility to easily implement custom localization in the future.
