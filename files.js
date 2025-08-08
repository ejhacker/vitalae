const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { uploadSingle, uploadMultiple, generateChecksum, cleanupFile } = require('../middleware/upload');
const auth = require('../middleware/auth');

// Upload single file
router.post('/upload', auth, uploadSingle, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate checksum
        const checksum = await generateChecksum(req.file.path);

        // Create file record
        const file = new File({
            userId: req.user.id,
            originalName: req.file.originalname,
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimeType: req.file.mimetype,
            category: req.body.category || 'other',
            description: req.body.description,
            tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
            checksum: checksum
        });

        await file.save();

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                id: file._id,
                originalName: file.originalName,
                filename: file.filename,
                size: file.size,
                mimeType: file.mimeType,
                category: file.category,
                description: file.description,
                tags: file.tags,
                uploadedAt: file.createdAt
            }
        });

    } catch (error) {
        console.error('File upload error:', error);
        
        // Clean up uploaded file if database save fails
        if (req.file) {
            await cleanupFile(req.file.path);
        }
        
        res.status(500).json({ message: 'Error uploading file' });
    }
});

// Upload multiple files
router.post('/upload-multiple', auth, uploadMultiple, async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadedFiles = [];

        for (const file of req.files) {
            // Generate checksum
            const checksum = await generateChecksum(file.path);

            // Create file record
            const fileRecord = new File({
                userId: req.user.id,
                originalName: file.originalname,
                filename: file.filename,
                path: file.path,
                size: file.size,
                mimeType: file.mimetype,
                category: req.body.category || 'other',
                description: req.body.description,
                tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
                checksum: checksum
            });

            await fileRecord.save();
            uploadedFiles.push({
                id: fileRecord._id,
                originalName: fileRecord.originalName,
                filename: fileRecord.filename,
                size: fileRecord.size,
                mimeType: fileRecord.mimeType,
                category: fileRecord.category,
                description: fileRecord.description,
                tags: fileRecord.tags,
                uploadedAt: fileRecord.createdAt
            });
        }

        res.status(201).json({
            message: `${uploadedFiles.length} files uploaded successfully`,
            files: uploadedFiles
        });

    } catch (error) {
        console.error('Multiple file upload error:', error);
        
        // Clean up uploaded files if database save fails
        if (req.files) {
            for (const file of req.files) {
                await cleanupFile(file.path);
            }
        }
        
        res.status(500).json({ message: 'Error uploading files' });
    }
});

// Get user's files
router.get('/', auth, async (req, res) => {
    try {
        const { category, page = 1, limit = 10, search } = req.query;
        
        const query = { userId: req.user.id };
        
        if (category) {
            query.category = category;
        }
        
        if (search) {
            query.$or = [
                { originalName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const files = await File.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-path -checksum');

        const total = await File.countDocuments(query);

        res.json({
            files,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalFiles: total
        });

    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: 'Error retrieving files' });
    }
});

// Get file by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json({
            id: file._id,
            originalName: file.originalName,
            filename: file.filename,
            size: file.size,
            mimeType: file.mimeType,
            category: file.category,
            description: file.description,
            tags: file.tags,
            uploadedAt: file.createdAt,
            updatedAt: file.updatedAt
        });

    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({ message: 'Error retrieving file' });
    }
});

// Download file
router.get('/:id/download', auth, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        if (!fs.existsSync(file.path)) {
            return res.status(404).json({ message: 'File not found on disk' });
        }

        res.download(file.path, file.originalName);

    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ message: 'Error downloading file' });
    }
});

// Update file metadata
router.put('/:id', auth, async (req, res) => {
    try {
        const { description, tags, category, isPublic } = req.body;
        
        const file = await File.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            {
                description,
                tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
                category,
                isPublic
            },
            { new: true, runValidators: true }
        );

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json({
            message: 'File updated successfully',
            file: {
                id: file._id,
                originalName: file.originalName,
                filename: file.filename,
                size: file.size,
                mimeType: file.mimeType,
                category: file.category,
                description: file.description,
                tags: file.tags,
                isPublic: file.isPublic,
                updatedAt: file.updatedAt
            }
        });

    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ message: 'Error updating file' });
    }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
    try {
        const file = await File.findOne({ _id: req.params.id, userId: req.user.id });
        
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete file from disk
        await cleanupFile(file.path);

        // Delete from database
        await File.findByIdAndDelete(req.params.id);

        res.json({ message: 'File deleted successfully' });

    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: 'Error deleting file' });
    }
});

// Get file categories
router.get('/categories/list', auth, async (req, res) => {
    try {
        const categories = await File.distinct('category', { userId: req.user.id });
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Error retrieving categories' });
    }
});

module.exports = router;
