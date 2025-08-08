const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// Database connection
const { connectDB } = require('./config/database');

// Import models
const User = require('./models/User');
const HealthProfile = require('./models/HealthProfile');
const HealthData = require('./models/HealthData');

// Import routes
const filesRouter = require('./routes/files');
const reportsRouter = require('./routes/reports');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/files', filesRouter);
app.use('/api/reports', reportsRouter);

// In-memory storage (for backward compatibility)
let users = [];
let healthProfiles = [];

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        console.log('Registration attempt:', { email, name, hasPassword: !!password });
        console.log('Current users:', users.map(u => ({ email: u.email, name: u.name })));

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();
        console.log('User registered successfully:', { email: user.email, name: user.name });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Login attempt:', { email, hasPassword: !!password });
        
        // Find user
        const user = await User.findOne({ email });
        console.log('Available users:', await User.find().select('email name'));
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        console.log('User found:', { email: user.email, name: user.name });

        // Check password
        const isValidPassword = await user.comparePassword(password);
        console.log('Password validation:', isValidPassword);
        
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful:', { email: user.email, name: user.name });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

// Health profile routes
app.post('/api/health/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const {
            age, gender, weight, height, lifestyle,
            drinking, smoking, bpPatient, sugarPatient
        } = req.body;

        // Create or update health profile
        let healthProfile = await HealthProfile.findOne({ userId: user._id });
        
        if (healthProfile) {
            // Update existing profile
            Object.assign(healthProfile, {
                age, gender, weight, height, lifestyle,
                drinking, smoking, bpPatient, sugarPatient
            });
        } else {
            // Create new profile
            healthProfile = new HealthProfile({
                userId: user._id,
                age, gender, weight, height, lifestyle,
                drinking, smoking, bpPatient, sugarPatient
            });
        }

        await healthProfile.save();

        res.json({
            message: 'Health profile saved successfully',
            profile: healthProfile
        });

    } catch (error) {
        console.error('Health profile error:', error);
        res.status(500).json({ message: 'Error saving health profile' });
    }
});

app.get('/api/health/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const healthProfile = await HealthProfile.findOne({ userId: user._id });
        
        if (!healthProfile) {
            return res.status(404).json({ message: 'Health profile not found' });
        }

        res.json(healthProfile);

    } catch (error) {
        console.error('Get health profile error:', error);
        res.status(500).json({ message: 'Error retrieving health profile' });
    }
});

// Health data routes
app.post('/api/health/data', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const healthData = new HealthData({
            userId: user._id,
            ...req.body
        });

        await healthData.save();

        res.status(201).json({
            message: 'Health data saved successfully',
            data: healthData
        });

    } catch (error) {
        console.error('Save health data error:', error);
        res.status(500).json({ message: 'Error saving health data' });
    }
});

app.get('/api/health/data', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }

        const { startDate, endDate, limit = 100 } = req.query;
        
        const query = { userId: user._id };
        
        if (startDate && endDate) {
            query.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const healthData = await HealthData.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json(healthData);

    } catch (error) {
        console.error('Get health data error:', error);
        res.status(500).json({ message: 'Error retrieving health data' });
    }
});

// Debug endpoint
app.get('/api/debug/users', (req, res) => {
    res.json({ users: users.map(u => ({ email: u.email, name: u.name })) });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join monitoring room
    socket.join('monitoring');
    console.log('User', Date.now(), 'joined monitoring');

    // Simulate health data
    const interval = setInterval(() => {
        const healthData = {
            heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
            ecg: (Math.random() - 0.5) * 2, // -1 to 1 mV
            lactate: Math.random() * 8 + 1, // 1-9 mmol/L
            spo2: Math.floor(Math.random() * 10) + 90, // 90-100%
            temperature: Math.random() * 3 + 36, // 36-39°C
            timestamp: new Date()
        };

        socket.emit('healthData', healthData);
    }, 2000);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        clearInterval(interval);
    });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`VITALAÉ Healthcare Server running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});
