# AI-Powered Traffic Surveillance & HSRP Compliance Monitoring System

A full-stack, production-grade web platform designed for Traffic Police, RTO, and Smart City Authorities to automatically detect Indian vehicles from traffic CCTV feeds, verify HSRP number plates and RTO compliance, and manage violations in real time.

## 🚀 Features

### Core Functionality
- **Real-time Traffic Monitoring**: Live camera feed monitoring with multi-camera grid view
- **AI-Powered Detection**: Simulated YOLOv8 vehicle detection, OCR plate recognition, and HSRP verification
- **Violation Management**: Comprehensive violation tracking with search, filter, and export capabilities
- **Vehicle Database**: RTO-integrated vehicle information with compliance status tracking
- **Payment Tracking**: Fine payment management and transaction monitoring
- **WhatsApp Integration**: Automated notification system (UI ready for Twilio integration)

### User Roles & Access Control
- **Administrator**: Full system access, user management, and configuration
- **Officer**: Violation management, vehicle database access, camera monitoring
- **Viewer**: Read-only access to violations and vehicle information

### Dashboard & Analytics
- Real-time statistics and KPIs
- Violation trends and analytics
- Camera activity monitoring
- Payment collection tracking
- Interactive charts and visualizations

## 🎨 Design

- **Dark Mode Police-Grade Theme**: Professional surveillance system aesthetic
- **Responsive Design**: Desktop-first with full mobile support
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Real-time Updates**: Live data refresh and status indicators

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Recharts** for data visualization
- **React Router** for navigation

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** for data storage
- **Row Level Security (RLS)** for data protection
- **Supabase Storage** for image uploads

### AI/ML (Simulated)
- YOLOv8 vehicle detection
- EasyOCR/PaddleOCR plate recognition
- CNN HSRP classification model

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment variables are already configured in `.env`

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔐 Authentication

### First User Setup
1. Navigate to the login page
2. Click "Sign Up" tab
3. Create your account (first user automatically becomes admin)
4. Login with your credentials

### User Management
- Admins can manage user roles from the Admin Panel
- Three role levels: Admin, Officer, Viewer
- Role-based route protection and feature access

## 📊 Database Schema

### Core Tables
- **profiles**: User accounts and roles
- **cameras**: Surveillance camera registry
- **vehicles**: RTO vehicle database
- **violations**: Traffic violation records
- **payments**: Fine payment transactions
- **activity_logs**: System audit trail

### Key Features
- Automatic user profile sync on registration
- Comprehensive RLS policies for data security
- Foreign key relationships for data integrity
- Indexed columns for query performance

## 🎯 Usage Guide

### Dashboard
- View system overview and statistics
- Monitor recent violations and camera activity
- Access quick action shortcuts

### Live Feeds
- Monitor multiple camera feeds simultaneously
- View real-time detection status
- Track AI system status (YOLOv8, OCR, CNN)

### Violations
- Search and filter violations
- Update violation status
- Export violation reports to CSV
- View detailed violation information

### Vehicles
- Search RTO vehicle database
- Check HSRP compliance status
- View document expiry dates (RC, Insurance, PUC)
- Filter by vehicle type and compliance

### Cameras
- View all registered cameras
- Monitor camera status (online/offline)
- Track camera activity and violations
- View geographic distribution

### Payments
- Track fine payments
- Monitor payment status
- View transaction history
- Check collection statistics

### Admin Panel
- Manage user roles and permissions
- View system activity logs
- Monitor user accounts
- System configuration

## 🔧 Configuration

### Camera Setup
Cameras are pre-configured with demo data. In production:
1. Add camera details in the Cameras page
2. Configure RTSP stream URLs
3. Set geographic coordinates for mapping

### Violation Rules
Current fine structure:
- No HSRP: ₹5,000
- Insurance Expired: ₹2,000
- PUC Expired: ₹1,000
- RC Expired: ₹3,000

### WhatsApp Integration
The system is ready for Twilio/WhatsApp Business API integration:
1. Configure Twilio credentials
2. Set up WhatsApp message templates
3. Enable automated notifications

## 🚦 System Architecture

```
Frontend (React + TypeScript)
    ↓
Supabase Client
    ↓
PostgreSQL Database + RLS
    ↓
Supabase Auth + Storage
```

### AI Pipeline (For Production)
```
IP CCTV (RTSP)
    ↓
AI Video Processor (YOLOv8)
    ↓
Number Plate Recognition (OCR)
    ↓
HSRP Verification Model
    ↓
RTO & Insurance API
    ↓
Violation Engine
    ↓
WhatsApp Gateway
    ↓
Admin Dashboard
```

## 📱 Responsive Design

- **Desktop**: Full-featured dashboard with sidebar navigation
- **Tablet**: Optimized layout with collapsible sidebar
- **Mobile**: Hamburger menu with touch-optimized interface

## 🔒 Security Features

- JWT-based authentication
- Row Level Security (RLS) policies
- Role-based access control (RBAC)
- Secure password hashing
- Activity logging and audit trail
- Protected API endpoints

## 🎨 Color Scheme

### Dark Mode (Primary)
- Background: Deep navy blue (#0A0E27)
- Primary: Bright blue (#4A9EFF)
- Success: Green (#22C55E)
- Warning: Yellow (#FACC15)
- Danger: Red (#EF4444)

### Status Colors
- Online: Green
- Offline: Gray
- Maintenance: Yellow

## 📈 Performance

- Optimized database queries with indexes
- Efficient data pagination
- Lazy loading for large datasets
- Responsive image loading
- Minimal re-renders with React optimization

## 🧪 Testing

Run linting:
```bash
npm run lint
```

## 🚀 Deployment

The application is ready for deployment to:
- Vercel
- Netlify
- AWS Amplify
- Any static hosting service

Build for production:
```bash
npm run build
```

## 📝 Notes

### AI/ML Implementation
The current implementation simulates AI features with mock data. For production deployment:
1. Set up Python backend (Django/FastAPI)
2. Integrate YOLOv8 for vehicle detection
3. Configure EasyOCR/PaddleOCR for plate recognition
4. Train CNN model for HSRP classification
5. Connect RTSP camera streams

### WhatsApp Integration
To enable automated notifications:
1. Set up Twilio account
2. Configure WhatsApp Business API
3. Create message templates
4. Implement backend webhook handlers

### RTO Database
Current implementation uses mock data. For production:
1. Integrate with official RTO API
2. Set up data synchronization
3. Implement real-time verification

## 🤝 Support

For issues or questions:
1. Check the documentation
2. Review the code comments
3. Contact system administrator

## 📄 License

© 2026 Traffic Surveillance System. All rights reserved.

---

**Built with ❤️ for Traffic Police, RTO, and Smart City Authorities**
