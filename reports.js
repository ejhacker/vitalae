const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const HealthData = require('../models/HealthData');
const HealthProfile = require('../models/HealthProfile');
const auth = require('../middleware/auth');

// Create a new report
router.post('/', auth, async (req, res) => {
    try {
        const {
            title,
            type,
            description,
            timeRange,
            tags,
            isPublic
        } = req.body;

        // Validate time range
        if (!timeRange || !timeRange.start || !timeRange.end) {
            return res.status(400).json({ message: 'Time range is required' });
        }

        // Get health data for the time range
        const healthData = await HealthData.find({
            userId: req.user.id,
            timestamp: {
                $gte: new Date(timeRange.start),
                $lte: new Date(timeRange.end)
            }
        }).sort({ timestamp: 1 });

        if (healthData.length === 0) {
            return res.status(400).json({ message: 'No health data found for the specified time range' });
        }

        // Calculate metrics
        const metrics = calculateMetrics(healthData);

        // Create report data based on type
        const reportData = generateReportData(type, healthData, metrics);

        const report = new Report({
            userId: req.user.id,
            title,
            type,
            description,
            data: reportData,
            metrics,
            timeRange: {
                start: new Date(timeRange.start),
                end: new Date(timeRange.end)
            },
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            isPublic: isPublic || false,
            generatedBy: req.user.id
        });

        await report.save();

        res.status(201).json({
            message: 'Report generated successfully',
            report: {
                id: report._id,
                title: report.title,
                type: report.type,
                description: report.description,
                metrics: report.metrics,
                timeRange: report.timeRange,
                status: report.status,
                createdAt: report.createdAt
            }
        });

    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ message: 'Error creating report' });
    }
});

// Get user's reports
router.get('/', auth, async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10, search } = req.query;
        
        const query = { userId: req.user.id };
        
        if (type) {
            query.type = type;
        }
        
        if (status) {
            query.status = status;
        }
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-data');

        const total = await Report.countDocuments(query);

        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalReports: total
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ message: 'Error retrieving reports' });
    }
});

// Get report by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json(report);

    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ message: 'Error retrieving report' });
    }
});

// Update report
router.put('/:id', auth, async (req, res) => {
    try {
        const { title, description, tags, isPublic, status } = req.body;
        
        const report = await Report.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            {
                title,
                description,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
                isPublic,
                status
            },
            { new: true, runValidators: true }
        );

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({
            message: 'Report updated successfully',
            report: {
                id: report._id,
                title: report.title,
                type: report.type,
                description: report.description,
                metrics: report.metrics,
                timeRange: report.timeRange,
                status: report.status,
                updatedAt: report.updatedAt
            }
        });

    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ message: 'Error updating report' });
    }
});

// Delete report
router.delete('/:id', auth, async (req, res) => {
    try {
        const report = await Report.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({ message: 'Report deleted successfully' });

    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ message: 'Error deleting report' });
    }
});

// Generate health summary report
router.post('/generate-summary', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Get health data
        const healthData = await HealthData.find({
            userId: req.user.id,
            timestamp: { $gte: start, $lte: end }
        }).sort({ timestamp: 1 });

        // Get health profile
        const healthProfile = await HealthProfile.findOne({ userId: req.user.id });

        if (healthData.length === 0) {
            return res.status(400).json({ message: 'No health data found for the specified period' });
        }

        // Calculate comprehensive metrics
        const metrics = calculateMetrics(healthData);
        
        // Generate summary data
        const summaryData = {
            period: { start, end },
            totalReadings: healthData.length,
            healthProfile: healthProfile,
            metrics: metrics,
            trends: analyzeTrends(healthData),
            recommendations: generateRecommendations(metrics, healthProfile)
        };

        const report = new Report({
            userId: req.user.id,
            title: `Health Summary Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            type: 'health_summary',
            description: 'Comprehensive health summary report',
            data: summaryData,
            metrics: metrics,
            timeRange: { start, end },
            status: 'generated',
            generatedBy: req.user.id
        });

        await report.save();

        res.status(201).json({
            message: 'Health summary report generated successfully',
            report: {
                id: report._id,
                title: report.title,
                metrics: report.metrics,
                timeRange: report.timeRange,
                status: report.status
            }
        });

    } catch (error) {
        console.error('Generate summary error:', error);
        res.status(500).json({ message: 'Error generating health summary' });
    }
});

// Helper function to calculate metrics
function calculateMetrics(healthData) {
    const heartRates = healthData.filter(d => d.heartRate).map(d => d.heartRate);
    const ecgData = healthData.filter(d => d.ecg).map(d => d.ecg);
    const lactateData = healthData.filter(d => d.lactate).map(d => d.lactate);
    const spo2Data = healthData.filter(d => d.spo2).map(d => d.spo2);

    return {
        heartRate: {
            average: heartRates.length > 0 ? (heartRates.reduce((a, b) => a + b, 0) / heartRates.length).toFixed(1) : null,
            min: heartRates.length > 0 ? Math.min(...heartRates) : null,
            max: heartRates.length > 0 ? Math.max(...heartRates) : null,
            trend: analyzeTrend(heartRates)
        },
        ecg: {
            abnormalities: detectECGAbnormalities(ecgData),
            rhythm: analyzeECGRhythm(ecgData),
            quality: assessECGQuality(ecgData)
        },
        lactate: {
            average: lactateData.length > 0 ? (lactateData.reduce((a, b) => a + b, 0) / lactateData.length).toFixed(2) : null,
            threshold: lactateData.length > 0 ? Math.max(...lactateData) : null,
            trend: analyzeTrend(lactateData)
        },
        spo2: {
            average: spo2Data.length > 0 ? (spo2Data.reduce((a, b) => a + b, 0) / spo2Data.length).toFixed(1) : null,
            min: spo2Data.length > 0 ? Math.min(...spo2Data) : null,
            max: spo2Data.length > 0 ? Math.max(...spo2Data) : null,
            trend: analyzeTrend(spo2Data)
        }
    };
}

// Helper function to analyze trends
function analyzeTrend(data) {
    if (data.length < 2) return 'stable';
    
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'decreasing';
    return 'stable';
}

// Helper function to detect ECG abnormalities
function detectECGAbnormalities(ecgData) {
    const abnormalities = [];
    
    if (ecgData.length === 0) return abnormalities;
    
    const maxAmplitude = Math.max(...ecgData.map(Math.abs));
    const minAmplitude = Math.min(...ecgData.map(Math.abs));
    
    if (maxAmplitude > 2.5) abnormalities.push('High amplitude');
    if (minAmplitude < 0.1) abnormalities.push('Low signal');
    
    return abnormalities;
}

// Helper function to analyze ECG rhythm
function analyzeECGRhythm(ecgData) {
    if (ecgData.length === 0) return 'No data';
    
    // Simple rhythm analysis
    const variations = ecgData.slice(1).map((val, i) => Math.abs(val - ecgData[i]));
    const avgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
    
    if (avgVariation < 0.1) return 'Regular';
    if (avgVariation < 0.3) return 'Slightly irregular';
    return 'Irregular';
}

// Helper function to assess ECG quality
function assessECGQuality(ecgData) {
    if (ecgData.length === 0) return 'No data';
    
    const noiseLevel = ecgData.reduce((sum, val) => sum + Math.abs(val), 0) / ecgData.length;
    
    if (noiseLevel < 0.5) return 'Excellent';
    if (noiseLevel < 1.0) return 'Good';
    if (noiseLevel < 1.5) return 'Fair';
    return 'Poor';
}

// Helper function to analyze trends over time
function analyzeTrends(healthData) {
    const trends = {
        heartRate: [],
        spo2: [],
        lactate: []
    };
    
    // Group data by hour for trend analysis
    const hourlyData = {};
    
    healthData.forEach(data => {
        const hour = new Date(data.timestamp).getHours();
        if (!hourlyData[hour]) {
            hourlyData[hour] = { heartRate: [], spo2: [], lactate: [] };
        }
        
        if (data.heartRate) hourlyData[hour].heartRate.push(data.heartRate);
        if (data.spo2) hourlyData[hour].spo2.push(data.spo2);
        if (data.lactate) hourlyData[hour].lactate.push(data.lactate);
    });
    
    // Calculate hourly averages
    Object.keys(hourlyData).forEach(hour => {
        const data = hourlyData[hour];
        if (data.heartRate.length > 0) {
            trends.heartRate.push({
                hour: parseInt(hour),
                average: data.heartRate.reduce((a, b) => a + b, 0) / data.heartRate.length
            });
        }
        if (data.spo2.length > 0) {
            trends.spo2.push({
                hour: parseInt(hour),
                average: data.spo2.reduce((a, b) => a + b, 0) / data.spo2.length
            });
        }
        if (data.lactate.length > 0) {
            trends.lactate.push({
                hour: parseInt(hour),
                average: data.lactate.reduce((a, b) => a + b, 0) / data.lactate.length
            });
        }
    });
    
    return trends;
}

// Helper function to generate recommendations
function generateRecommendations(metrics, healthProfile) {
    const recommendations = [];
    
    if (metrics.heartRate) {
        const hr = metrics.heartRate;
        if (hr.average > 100) {
            recommendations.push('Consider reducing physical activity and stress levels');
        } else if (hr.average < 60) {
            recommendations.push('Monitor heart rate closely and consult healthcare provider if symptoms persist');
        }
    }
    
    if (metrics.spo2) {
        const spo2 = metrics.spo2;
        if (spo2.average < 95) {
            recommendations.push('Oxygen levels are below normal. Consider breathing exercises and consult healthcare provider');
        }
    }
    
    if (metrics.lactate) {
        const lactate = metrics.lactate;
        if (lactate.average > 4) {
            recommendations.push('Lactate levels are elevated. Consider adjusting exercise intensity');
        }
    }
    
    if (healthProfile) {
        if (healthProfile.bpPatient === 'yes') {
            recommendations.push('Continue monitoring blood pressure regularly');
        }
        if (healthProfile.sugarPatient === 'yes') {
            recommendations.push('Monitor blood glucose levels as recommended by healthcare provider');
        }
    }
    
    return recommendations;
}

// Helper function to generate report data
function generateReportData(type, healthData, metrics) {
    switch (type) {
        case 'health_summary':
            return {
                totalReadings: healthData.length,
                timeRange: {
                    start: healthData[0]?.timestamp,
                    end: healthData[healthData.length - 1]?.timestamp
                },
                metrics: metrics,
                dataPoints: healthData.map(d => ({
                    timestamp: d.timestamp,
                    heartRate: d.heartRate,
                    spo2: d.spo2,
                    lactate: d.lactate,
                    ecg: d.ecg
                }))
            };
        
        case 'ecg_analysis':
            return {
                ecgData: healthData.filter(d => d.ecg).map(d => ({
                    timestamp: d.timestamp,
                    value: d.ecg
                })),
                analysis: metrics.ecg
            };
        
        case 'trend_analysis':
            return {
                trends: analyzeTrends(healthData),
                metrics: metrics
            };
        
        default:
            return {
                data: healthData,
                metrics: metrics
            };
    }
}

module.exports = router;
