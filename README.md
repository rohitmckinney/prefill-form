# Convenience Store Application

A modern, professional insurance application form built with Next.js 14, TailwindCSS, and React Hook Form for Mckinney & Co. Insurance.

## Features

- 🎨 Clean, minimal black and white design
- 📱 Fully responsive layout
- ✅ Form validation with React Hook Form
- 📄 PDF generation with filled form data
- 🎭 Smooth animations and transitions
- 🏢 Professional insurance branding

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
convenience-store-app/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── FormSection.tsx
├── lib/
│   └── pdf.ts
├── types/
│   └── form.ts
└── public/
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Forms**: React Hook Form
- **PDF Generation**: jsPDF
- **Animations**: Framer Motion
- **TypeScript**: Full type safety

## Form Fields

The application includes all standard convenience store insurance fields:

- Company Information (name, contact, dates, etc.)
- Applicant Type (Individual, Partnership, Corporation, etc.)
- Security Systems (Burglar/Fire alarms)
- Operations Description
- Ownership Type
- Comprehensive Property Details

## Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

## License

Private - Mckinney & Co. Insurance