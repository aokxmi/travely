# Trip Planner

Tell it where you're going, for how many days, how much you can spend, and what you enjoy. It generates a day-by-day plan with estimated costs for activities, accommodation, and local transport, wrapped in an authentic claymorphic interface with client-side budget verification.

## Features

- **Day-by-Day Itinerary Generation**: Plans morning, afternoon, and evening activities, plus daily stay and transport.
- **Independent Budget Tracking**: The client independently calculates the sum of all itemized costs, verifies against the total budget, and identifies discrepancies or over-budget scenarios.
- **Visual Budget Progress**: Dynamic progress bar indicating percentage of budget utilized and overage warnings.
- **Claymorphic UI**: Distinctive tactile soft-depth design with responsive mobile support and system dark-mode adaptability.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend API**: Express server running on Node.js
- **Model**: Gemini API (`@google/genai`) with fallback itinerary engine
- **Styling**: Claymorphism with custom CSS variables and dark mode support

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Development

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## License

MIT. See the `LICENSE` file.
