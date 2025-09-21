# Great-Malaysia-AI-Hackathon

## **AI-Powered Intelligent Medical Document Query Tool**

### Executive Summary

Healthcare professionals in Malaysia struggle to efficiently access critical information from vast, unstructured medical PDFs. Manual searches are time-consuming, error-prone, and limit clinical insights, impacting patient care. Our proposed Al query tool enables natural language smart search across all medical PDF documents via an intuitive chat-like interface.

### Problem Background

1. Current Challenges in Malaysian Healthcare
   Doctors and administrative staff waste excessive time manually searching digital and physical archives for specific patient records or clinical guidelines stored as PDFs. Critical patient data and medical knowledge are often buried within unstructured PDF documents, hindering quick cross-referencing. Relying on keyword searches often leads to overlooked details, impacting accuracy. Without intelligent search, identifying trends or gaining deeper insights from collective document knowledge is challenging.

2. The Complexity of Medical Document Querying
   Medical documents come in diverse formats (scanned, legacy, digital) with complex terminology, abbreviations, and varying layouts. Traditional search methods struggle with unstructured text, especially when information is embedded within tables or graphics, making accurate retrieval difficult given the immense document volume.

### Problem Definition

Create an Al-powered query tool that can intelligently search, extract, and synthesize information from all medical PDF documents within a healthcare institution. The solution should provide a "Gemini-like" chat interface, allowing healthcare professionals to ask natural language questions and receive precise, contextually relevant answers, effectively transforming unstructured documents into an accessible knowledge base.

### Hackathon Rules

1. All submissions must incorporate AWS AI services and be deployed on AWS Cloud.

2. Participants must prioritize Malaysia region (ap-southeast-5) for their deployments. Alternative regions may only be utilized if required services are unavailable in Malaysia region.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/TeeHaoBin/MedPal-Great-Malaysia-AI-Hackathon.git
   cd MedPal-Great-Malaysia-AI-Hackathon/medpal
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   - Copy `.env.local.example` to `.env.local`
   - Configure your AWS credentials and API keys

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser
   - Visit `/landing` for the landing page with Google Gemini effect
   - Visit `/about` for detailed project information
   - Main chat interface is available at the root path `/`

### Project Structure

- `src/app/` - Next.js app router pages
- `src/components/` - React components including chat interface and UI elements
- `src/lib/` - Utility functions and AWS service configurations
- `public/` - Static assets and images
