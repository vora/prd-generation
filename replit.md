# ConversationPRD - AI-Powered Product Requirements Document Generator

## Overview

ConversationPRD is a full-stack web application that uses AI to automatically generate Product Requirements Documents (PRDs) from uploaded conversation files. The application allows users to upload text files, PDFs, or DOCX files containing conversations or discussions, and leverages OpenAI's GPT-4 to extract key insights and generate comprehensive PRDs.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite for development and production builds
- **File Handling**: React Dropzone for drag-and-drop file uploads

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API with JSON responses
- **File Processing**: Multer for multipart file uploads
- **AI Integration**: OpenAI GPT-4 for PRD generation
- **Development**: tsx for TypeScript execution in development

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Neon Database serverless PostgreSQL
- **Storage Strategy**: In-memory fallback with MemStorage class for development

## Key Components

### Database Schema
- **PRDs Table**: Stores generated PRDs with JSON content structure
  - Fields: id, title, content (JSON), status, originalFileName, processingTime, createdAt
  - Content includes: overview, goals, features, technicalRequirements, userPersonas, acceptanceCriteria

### File Processing Pipeline
1. **Upload Validation**: File type and size validation (10MB max)
2. **File Parsing**: Support for TXT, PDF, and DOCX formats
3. **AI Processing**: OpenAI GPT-4 analysis of conversation content
4. **PRD Generation**: Structured extraction of product requirements
5. **Storage**: Persistence of generated PRDs with metadata

### UI Components
- **File Upload**: Drag-and-drop interface with progress indicators
- **PRD Preview**: Real-time display of generated PRDs
- **Recent PRDs**: List view of previously generated documents
- **Status Management**: Draft, in-review, and complete states

## Data Flow

1. **File Upload**: User drags/drops or selects conversation files
2. **Validation**: Client-side file type and size validation
3. **Processing**: Server receives file, parses content, and validates format
4. **AI Analysis**: OpenAI API processes conversation text with configurable options
5. **PRD Generation**: Structured PRD content is generated and validated
6. **Storage**: PRD is saved to database with metadata
7. **Response**: Generated PRD is returned to client and displayed
8. **List Update**: Recent PRDs list is refreshed via query invalidation

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4 model for conversation analysis and PRD generation
- **API Key Management**: Environment variable configuration

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: URL-based connection via DATABASE_URL environment variable

### Development Tools
- **Replit Integration**: Cartographer plugin for development environment
- **Error Handling**: Runtime error overlay for development debugging

### UI Libraries
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form validation and management
- **Zod**: Runtime type validation and schema definition

## Deployment Strategy

### Build Process
- **Client Build**: Vite builds React app to `dist/public`
- **Server Build**: esbuild bundles server code to `dist/index.js`
- **Static Assets**: Served from built public directory

### Environment Configuration
- **Development**: tsx server with Vite middleware for HMR
- **Production**: Node.js serves pre-built static files and API routes
- **Database**: Automatic provisioning through Replit PostgreSQL module

### Scaling Considerations
- **Autoscale Deployment**: Configured for automatic scaling on Replit
- **Session Management**: Ready for PostgreSQL-based session storage
- **File Storage**: Local upload directory with cleanup capabilities

### Security Measures
- **File Validation**: Strict file type and size limitations
- **API Key Security**: Environment variable-based OpenAI API key management
- **Input Sanitization**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error boundaries and logging

The application is designed to be deployed on Replit with automatic PostgreSQL database provisioning, but can be adapted for other cloud platforms with minimal configuration changes.