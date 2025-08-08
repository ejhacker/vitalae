# VITALAÉ - Advanced Healthcare Monitoring Platform

A comprehensive healthcare monitoring platform with real-time data visualization, file management, and report generation capabilities.

## 🚀 Features

### Core Features
- **Real-time Health Monitoring**: Live tracking of Heart Rate, ECG, SpO2, and Lactate levels
- **Professional UI/UX**: Modern, responsive design with smooth animations
- **User Authentication**: Secure login/signup with JWT tokens
- **Health Profile Management**: Comprehensive user health information collection

### Database & File Management
- **MongoDB Integration**: Persistent data storage with Mongoose ODM
- **File Upload System**: Support for medical reports, images, and documents
- **Report Generation**: Automated health summary and analysis reports
- **Data Analytics**: Advanced metrics calculation and trend analysis

### Security & Compliance
- **HIPAA Compliant**: Secure data handling and storage
- **Password Hashing**: Bcrypt encryption for user passwords
- **JWT Authentication**: Secure token-based authentication
- **File Validation**: Upload security with file type and size validation

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vitalae
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Install MongoDB on your system
   - Start MongoDB service
   - Create a database named `vitalae`

4. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/vitalae

   # JWT Configuration
   JWT_SECRET=your_super_secret_key_here

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # Security Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📊 Database Schema

### Models

#### User
- Basic user information (name, email, password)
- Role-based access (patient, doctor, admin)
- Account status and last login tracking

#### HealthProfile
- Comprehensive health information
- BMI calculation
- Medical history tracking

#### HealthData
- Real-time health metrics
- Timestamped data points
- Session and device tracking

#### Report
- Generated health reports
- Multiple report types (summary, ECG analysis, trends)
- Status tracking and review workflow

#### File
- Uploaded medical documents
- File categorization and tagging
- Security features (checksums, encryption)

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Health Profile
- `POST /api/health/profile` - Save health profile
- `GET /api/health/profile` - Retrieve health profile

### Health Data
- `POST /api/health/data` - Save health data
- `GET /api/health/data` - Retrieve health data

### File Management
- `POST /api/files/upload` - Upload single file
- `POST /api/files/upload-multiple` - Upload multiple files
- `GET /api/files` - List user files
- `GET /api/files/:id` - Get file details
- `GET /api/files/:id/download` - Download file
- `PUT /api/files/:id` - Update file metadata
- `DELETE /api/files/:id` - Delete file

### Reports
- `POST /api/reports` - Create new report
- `GET /api/reports` - List user reports
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/generate-summary` - Generate health summary

## 📁 Project Structure

```
vitalae/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── upload.js           # File upload middleware
├── models/
│   ├── User.js             # User model
│   ├── HealthProfile.js    # Health profile model
│   ├── HealthData.js       # Health data model
│   ├── Report.js           # Report model
│   └── File.js             # File model
├── routes/
│   ├── files.js            # File management routes
│   └── reports.js          # Report management routes
├── uploads/                # File upload directory
├── public/
│   ├── css/
│   │   └── style.css       # Application styles
│   ├── js/
│   │   └── app.js          # Frontend JavaScript
│   └── index.html          # Main application page
├── server.js               # Main server file
├── package.json            # Project dependencies
└── README.md              # Project documentation
```

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Tokens**: Secure authentication with JSON Web Tokens
- **File Validation**: Upload security with type and size validation
- **CORS Protection**: Cross-origin resource sharing protection
- **Input Validation**: Comprehensive input sanitization
- **Error Handling**: Secure error responses without sensitive data exposure

## 📈 Analytics & Reporting

### Health Metrics
- **Heart Rate Analysis**: Average, min/max, trend analysis
- **ECG Monitoring**: Rhythm analysis, abnormality detection
- **SpO2 Tracking**: Oxygen saturation monitoring
- **Lactate Analysis**: Metabolic performance tracking

### Report Types
- **Health Summary**: Comprehensive health overview
- **ECG Analysis**: Detailed cardiac rhythm analysis
- **Trend Analysis**: Long-term health pattern analysis
- **Custom Reports**: User-defined report generation

## 🎨 UI/UX Features

- **Responsive Design**: Works on all device sizes
- **Professional Styling**: Modern healthcare-grade interface
- **Smooth Animations**: Enhanced user experience
- **Real-time Updates**: Live data visualization
- **Intuitive Navigation**: Easy-to-use interface

## 🚀 Development

### Running in Development Mode
```bash
npm run dev
```

### Database Operations
The application uses MongoDB with Mongoose for data persistence. All data is stored securely with proper indexing for optimal performance.

### File Upload System
- Supports multiple file types (images, PDFs, documents)
- Automatic file categorization
- Secure file storage with checksums
- File metadata management

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the VITALAÉ development team.

---

**VITALAÉ - Empowering Lives, Predicting Health** 🏥
