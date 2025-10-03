# Overview

This is a full-stack e-commerce application built with modern web technologies. The system provides a complete online shopping platform with user authentication, product catalog management, shopping cart functionality, and order processing. It features a responsive React frontend with Tailwind CSS styling and shadcn/ui components, backed by an Express.js server using PostgreSQL with Drizzle ORM for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for client-side navigation (lightweight React router alternative)
- **State Management**: Zustand for client-side state (auth, cart) with persistence middleware
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Data Fetching**: TanStack Query (React Query) for server state management with optimistic updates
- **Form Handling**: React Hook Form with Zod validation for type-safe form schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: Express sessions with role-based access control (admin/user)
- **API Design**: RESTful API with consistent error handling middleware
- **Request Logging**: Custom middleware for API request/response logging

## Database & Schema Design
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Relational design with proper foreign key relationships
  - Users table with role-based access (admin/user)
  - Categories for product organization
  - Products with inventory tracking and ratings
  - Orders with order items for normalized order data
- **Migrations**: Drizzle Kit for database schema management
- **Database Provider**: Neon serverless PostgreSQL for scalable hosting

## Development & Build System
- **Bundling**: Vite for fast development and optimized production builds
- **Development**: Hot module replacement with Vite dev server
- **Build Process**: Separate client (Vite) and server (esbuild) build pipelines
- **Code Quality**: TypeScript strict mode with path aliases for clean imports
- **Asset Handling**: Vite asset optimization with proper public/static file serving

## Security & Authentication
- **Password Security**: bcrypt for secure password hashing
- **JWT Tokens**: Stateless authentication with configurable JWT secrets
- **Role-Based Access**: Admin/user role separation for protected routes
- **Input Validation**: Zod schemas for request validation and type safety
- **CORS**: Proper cross-origin resource sharing configuration

# External Dependencies

## Core Frontend Libraries
- **React Ecosystem**: React, React DOM, React Hook Form for component architecture
- **UI Framework**: Radix UI primitives with shadcn/ui components for accessible design system
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **State & Data**: Zustand for client state, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Icons**: Lucide React for consistent iconography

## Backend Dependencies  
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM with PostgreSQL dialect and Neon serverless driver
- **Authentication**: bcryptjs for password hashing, jsonwebtoken for JWT handling
- **Session Storage**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for runtime type validation and schema definition

## Development Tools
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **TypeScript**: Full TypeScript support with strict configuration
- **Development**: tsx for TypeScript execution, various Vite plugins for enhanced DX
- **Database Tools**: Drizzle Kit for schema migrations and database management

## External Services
- **Database Hosting**: Neon serverless PostgreSQL for scalable database infrastructure
- **Development Environment**: Replit-specific plugins and tooling for cloud development
- **Font Loading**: Google Fonts integration for typography (DM Sans, Architects Daughter, Fira Code, Geist Mono)