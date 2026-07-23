# Quick Start Guide - Traffic Surveillance System

## Getting Started

### 1. First Login
1. Open the application in your browser
2. You'll be redirected to the login page
3. Click on the **"Sign Up"** tab
4. Create your account:
   - Username: Choose a username (letters, numbers, underscore only)
   - Password: Minimum 6 characters
5. Click **"Sign Up"**
6. You'll be automatically logged in

**Important**: The first user to register becomes the system administrator automatically.

### 2. Understanding User Roles

#### Administrator
- Full system access
- Can manage user roles
- Access to Admin Panel
- Can modify all data

#### Officer
- Can manage violations
- Can update vehicle information
- Can manage cameras
- Cannot access Admin Panel

#### Viewer
- Read-only access
- Can view violations and vehicles
- Cannot modify any data
- Cannot access Admin Panel or Cameras

### 3. Navigation

#### Desktop
- Use the sidebar on the left to navigate between pages
- Click on your profile icon (top right) to view your role and logout

#### Mobile
- Tap the hamburger menu icon (☰) to open navigation
- All features are accessible through the mobile menu

## Main Features

### Dashboard
**What you'll see:**
- Total violations count
- Pending actions requiring attention
- Total and collected fines
- Active cameras status
- Violation trends (last 7 days)
- Recent violations list
- Top performing cameras

**Quick Actions:**
- View Live Feeds
- Check Violations
- Search Vehicles
- Payment Status

### Live Feeds
**Features:**
- Multi-camera grid view
- Real-time camera status (online/offline)
- Recent detections feed
- AI system status indicators

**Camera Status:**
- 🟢 Green dot = Online
- 🔴 Red dot = Offline
- 🟡 Yellow dot = Maintenance

### Violations
**Search & Filter:**
- Search by plate number
- Filter by status (Pending, Notified, Paid, Dismissed)
- Filter by violation type
- Export to CSV

**Violation Types:**
- No HSRP: ₹5,000 fine
- Insurance Expired: ₹2,000 fine
- PUC Expired: ₹1,000 fine
- RC Expired: ₹3,000 fine

**Actions (Admin/Officer only):**
- View detailed violation information
- Update violation status
- Mark as notified/paid/dismissed

### Vehicles
**Search & Filter:**
- Search by plate number
- Filter by HSRP compliance
- Filter by vehicle type
- Filter by expired documents

**Information Available:**
- Owner details
- Vehicle type
- HSRP compliance status
- RC expiry date
- Insurance expiry date
- PUC expiry date

**Status Indicators:**
- ✅ Valid: Document is valid
- ⚠️ Expiring Soon: Less than 30 days
- ❌ Expired: Document has expired

### Cameras
**Features:**
- View all registered cameras
- Monitor online/offline status
- View camera locations
- Track violation counts per camera

**Camera Information:**
- Camera name and location
- GPS coordinates
- RTSP stream URL
- Last active timestamp

### Payments
**Track:**
- All payment transactions
- Payment status
- Collection statistics
- Pending payments

**Statistics:**
- Total payments
- Total amount
- Collected amount
- Pending amount

### Admin Panel (Admins Only)
**User Management:**
- View all registered users
- Change user roles
- View user details
- Monitor user activity

**Activity Logs:**
- System activity tracking
- User actions audit trail
- Security monitoring

**System Information:**
- Application version
- Database status
- Authentication status
- Storage status

## Common Tasks

### How to Search for a Vehicle
1. Go to **Vehicles** page
2. Enter plate number in search box
3. Press Enter or click search icon
4. Click the eye icon to view full details

### How to Update a Violation Status
1. Go to **Violations** page
2. Find the violation (use search/filter)
3. Click the eye icon to view details
4. Scroll down to "Update Status" section
5. Click the appropriate button:
   - Mark Notified
   - Mark Paid
   - Dismiss

### How to Change a User's Role (Admin Only)
1. Go to **Admin Panel**
2. Find the user in the table
3. Use the dropdown to select new role
4. Role is updated automatically

### How to Export Violation Data
1. Go to **Violations** page
2. Apply any filters you want
3. Click **"Export CSV"** button
4. File will download automatically

## Tips & Best Practices

### For Administrators
- Regularly review activity logs
- Assign appropriate roles to users
- Monitor system statistics on dashboard
- Check camera status regularly

### For Officers
- Update violation status promptly
- Verify vehicle information before issuing fines
- Use filters to find specific violations quickly
- Export reports for record-keeping

### For Viewers
- Use dashboard for quick overview
- Search vehicles for compliance checks
- Monitor live feeds for real-time activity
- Check violation trends

## Keyboard Shortcuts

- **Enter** in search boxes: Execute search
- **Escape** in dialogs: Close dialog

## Mobile Usage

### Best Practices
- Use landscape mode for better table viewing
- Tap and hold on table rows for more options
- Swipe to scroll through wide tables
- Use the mobile menu for navigation

## Troubleshooting

### Can't Login
- Check username and password
- Username is case-sensitive
- Password must be at least 6 characters
- Try signing up if you don't have an account

### Don't See Admin Panel
- Only administrators can access Admin Panel
- Check your role badge in the header
- Contact an administrator to change your role

### Camera Shows Offline
- This is normal for demo data
- In production, check camera connection
- Verify RTSP URL configuration
- Check network connectivity

### No Data Showing
- Refresh the page
- Check your internet connection
- Verify you're logged in
- Contact administrator if issue persists

## Data Information

### Demo Data Included
- 6 cameras (various locations in Pune)
- 10 vehicles with different compliance statuses
- 5+ violations with various statuses
- Sample payment records

### Real Data (Production)
- Connect to actual RTO database
- Integrate live camera feeds
- Set up WhatsApp notifications
- Configure payment gateway

## Security Notes

- Never share your login credentials
- Logout when finished
- Report suspicious activity to administrators
- Change password regularly (contact admin)

## Support

For technical issues or questions:
1. Check this guide first
2. Contact your system administrator
3. Review the detailed SYSTEM_README.md

---

**System Version**: 1.0.0  
**Last Updated**: January 2026  
**For**: Traffic Police, RTO, and Smart City Authorities
