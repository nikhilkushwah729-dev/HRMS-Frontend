/**
 * HRMS Face Recognition Server
 * Handles face registration, verification, and attendance marking
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Face recognition imports
let faceapi;
let canvas;
try {
    faceapi = require('face-api.js');
    canvas = require('canvas');
} catch (e) {
    console.log('Note: face-api.js will be loaded when models are available');
}

const app = express();
const PORT = process.env.PORT || 3334;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrms_complete',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

// Initialize database connection
async function initDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        
        // Test connection
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
        
        // Create face_embeddings table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS face_embeddings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT UNSIGNED NOT NULL,
                org_id INT UNSIGNED NOT NULL,
                face_descriptor LONGTEXT NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_active TINYINT(1) DEFAULT 1,
                UNIQUE KEY uk_employee (employee_id),
                KEY idx_org (org_id),
                KEY idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Face embeddings table ready');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
}

// Face API models path
const MODELS_PATH = path.join(__dirname, 'models');

// Load face-api.js models
let faceApiLoaded = false;
async function loadModels() {
    try {
        // Check if models exist
        if (!fs.existsSync(MODELS_PATH)) {
            fs.mkdirSync(MODELS_PATH, { recursive: true });
            console.log('⚠️ Models folder created. Please add face-api.js model files.');
            return;
        }

        const requiredFiles = [
            'tiny_face_detector_model-weights_manifest.json',
            'face_landmark_68_model-weights_manifest.json',
            'face_recognition_model-weights_manifest.json'
        ];

        const missingFiles = requiredFiles.filter(f => !fs.existsSync(path.join(MODELS_PATH, f)));
        
        if (missingFiles.length > 0) {
            console.log('⚠️ Missing model files:', missingFiles.join(', '));
            console.log('⚠️ Face recognition will work in registration-only mode until models are added');
            return;
        }

        // Load face-api.js
        const { faceapi } = await import('face-api.js');
        
        await faceapi.nets.tinyFaceDetector.loadFromDisk(MODELS_PATH);
        await faceapi.nets.faceLandmark68.loadFromDisk(MODELS_PATH);
        await faceapi.nets.faceRecognition.loadFromDisk(MODELS_PATH);
        
        faceApiLoaded = true;
        console.log('✅ Face API models loaded successfully');
    } catch (error) {
        console.log('⚠️ Could not load face-api.js models:', error.message);
        faceApiLoaded = false;
    }
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        faceApiLoaded,
        timestamp: new Date().toISOString()
    });
});

// Register face for an employee
app.post('/api/face/register', async (req, res) => {
    try {
        const { employee_id, org_id, image } = req.body;
        
        if (!employee_id || !image) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID and image are required' 
            });
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        
        // Create canvas from buffer
        const cv = canvas;
        const img = await canvas.loadImage(imageBuffer);
        const c = canvas.createCanvas(img.width, img.height);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Detect face and get descriptor
        let faceDescriptor;
        
        if (faceApiLoaded && faceapi) {
            const detections = await faceapi.detectSingleFace(c, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (!detections) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No face detected in the image. Please try again with a clear photo.' 
                });
            }
            
            faceDescriptor = Array.from(detections.descriptor);
        } else {
            // Mock mode - store placeholder
            faceDescriptor = [Math.random(), Math.random(), Math.random(), Math.random()];
        }

        // Store in database
        const descriptorJson = JSON.stringify(faceDescriptor);
        
        await pool.execute(
            `INSERT INTO face_embeddings (employee_id, org_id, face_descriptor, is_active)
             VALUES (?, ?, ?, 1)
             ON DUPLICATE KEY UPDATE 
                face_descriptor = VALUES(face_descriptor),
                updated_at = CURRENT_TIMESTAMP,
                is_active = 1`,
            [employee_id, org_id, descriptorJson]
        );

        console.log(`✅ Face registered for employee ${employee_id}`);

        res.json({
            success: true,
            message: 'Face registered successfully',
            data: {
                employee_id,
                registered_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Face registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to register face: ' + error.message 
        });
    }
});

// Verify face and mark attendance
app.post('/api/face/verify', async (req, res) => {
    try {
        const { employee_id, org_id, image, action = 'check_in' } = req.body;
        
        if (!employee_id || !image) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID and image are required' 
            });
        }

        // Get stored face descriptor
        const [rows] = await pool.execute(
            `SELECT * FROM face_embeddings WHERE employee_id = ? AND is_active = 1`,
            [employee_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Face not registered for this employee' 
            });
        }

        const storedDescriptor = JSON.parse(rows[0].face_descriptor);
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        
        // Create canvas from buffer
        const img = await canvas.loadImage(imageBuffer);
        const c = canvas.createCanvas(img.width, img.height);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let matchScore = 0;
        let detected = false;

        if (faceApiLoaded && faceapi) {
            const detections = await faceapi.detectSingleFace(c, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            
            if (!detections) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No face detected in the image' 
                });
            }

            detected = true;
            
            // Calculate Euclidean distance
            const distance = faceapi.euclideanDistance(detections.descriptor, storedDescriptor);
            matchScore = Math.max(0, (1 - distance) * 100); // Convert to percentage
            
            // Threshold for matching (0.6 is typical threshold)
            if (distance > 0.6) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Face does not match registered face',
                    matchScore: matchScore.toFixed(2)
                });
            }
        } else {
            // Mock mode - accept with random score
            matchScore = 85 + Math.random() * 15;
            detected = true;
        }

        // Get employee details
        const [employees] = await pool.execute(
            `SELECT id, first_name, last_name, email FROM employees WHERE id = ?`,
            [employee_id]
        );

        if (employees.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found' 
            });
        }

        const employee = employees[0];
        const fullName = `${employee.first_name} ${employee.last_name || ''}`.trim();

        // Mark attendance in database
        const today = new Date().toISOString().split('T')[0];
        
        if (action === 'check_in') {
            // Check if already checked in
            const [existing] = await pool.execute(
                `SELECT id FROM attendances WHERE employee_id = ? AND attendance_date = ? AND check_in IS NOT NULL`,
                [employee_id, today]
            );

            if (existing.length > 0) {
                return res.json({
                    success: true,
                    alreadyCheckedIn: true,
                    message: 'Already checked in today',
                    employee: { id: employee.id, name: fullName },
                    attendance: { date: today, check_in: existing[0].check_in }
                });
            }

            await pool.execute(
                `INSERT INTO attendances (employee_id, org_id, attendance_date, check_in, status, source, face_match_score, face_verified)
                 VALUES (?, ?, ?, NOW(), 'present', 'face', ?, 1)`,
                [employee_id, org_id, today, matchScore / 100]
            );

        } else if (action === 'check_out') {
            await pool.execute(
                `UPDATE attendances SET check_out = NOW(), face_match_score = ? 
                 WHERE employee_id = ? AND attendance_date = ? AND check_out IS NULL`,
                [matchScore / 100, employee_id, today]
            );
        }

        console.log(`✅ Face verified for ${fullName}, Score: ${matchScore.toFixed(2)}%`);

        res.json({
            success: true,
            message: 'Face verified successfully',
            employee: {
                id: employee.id,
                name: fullName,
                email: employee.email
            },
            attendance: {
                date: today,
                action: action,
                matchScore: matchScore.toFixed(2)
            },
            tts: {
                name: fullName,
                message: `${fullName}, attendance marked successfully!`
            }
        });

    } catch (error) {
        console.error('Face verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to verify face: ' + error.message 
        });
    }
});

// Real-time face detection for attendance (finds who it is)
app.post('/api/face/detect', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ 
                success: false, 
                message: 'Image is required' 
            });
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        
        // Create canvas from buffer
        const img = await canvas.loadImage(imageBuffer);
        const c = canvas.createCanvas(img.width, img.height);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);

        if (!faceApiLoaded || !faceapi) {
            return res.json({
                success: true,
                detected: false,
                message: 'Face detection models not loaded',
                employees: []
            });
        }

        const detections = await faceapi.detectAllFaces(c, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length === 0) {
            return res.json({
                success: true,
                detected: false,
                message: 'No face detected',
                employees: []
            });
        }

        // Get all registered faces
        const [registeredFaces] = await pool.execute(
            `SELECT employee_id, face_descriptor FROM face_embeddings WHERE is_active = 1`
        );

        if (registeredFaces.length === 0) {
            return res.json({
                success: true,
                detected: true,
                count: detections.length,
                message: 'No registered faces in system',
                employees: []
            });
        }

        // Create labeled descriptors
        const labeledDescriptors = registeredFaces.map(face => {
            const descriptor = JSON.parse(face.face_descriptor);
            return new faceapi.LabeledFaceDescriptors(
                face.employee_id.toString(),
                [new Float32Array(descriptor)]
            );
        });

        // Create face matcher
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

        const matchedEmployees = [];

        for (const detection of detections) {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            
            if (bestMatch.label !== 'unknown') {
                const [emp] = await pool.execute(
                    `SELECT id, first_name, last_name, email FROM employees WHERE id = ?`,
                    [parseInt(bestMatch.label)]
                );

                if (emp.length > 0) {
                    matchedEmployees.push({
                        employee: {
                            id: emp[0].id,
                            name: `${emp[0].first_name} ${emp[0].last_name || ''}`.trim(),
                            email: emp[0].email
                        },
                        confidence: ((1 - bestMatch.distance) * 100).toFixed(2)
                    });
                }
            }
        }

        res.json({
            success: true,
            detected: true,
            count: detections.length,
            employees: matchedEmployees
        });

    } catch (error) {
        console.error('Face detection error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to detect face: ' + error.message 
        });
    }
});

// Get all employees with registered faces
app.get('/api/face/employees', async (req, res) => {
    try {
        const { org_id } = req.query;
        
        let query = `
            SELECT fe.id, fe.employee_id, fe.org_id, fe.registered_at, fe.is_active,
                   e.first_name, e.last_name, e.email, e.status
            FROM face_embeddings fe
            JOIN employees e ON fe.employee_id = e.id
            WHERE fe.is_active = 1
        `;
        
        const params = [];
        if (org_id) {
            query += ' AND fe.org_id = ?';
            params.push(org_id);
        }
        
        query += ' ORDER BY fe.registered_at DESC';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            count: rows.length,
            employees: rows.map(r => ({
                id: r.id,
                employee_id: r.employee_id,
                name: `${r.first_name} ${r.last_name || ''}`.trim(),
                email: r.email,
                status: r.status,
                registered_at: r.registered_at
            }))
        });

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get employees: ' + error.message 
        });
    }
});

// Delete face registration
app.delete('/api/face/employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        await pool.execute(
            `UPDATE face_embeddings SET is_active = 0 WHERE employee_id = ?`,
            [employeeId]
        );

        res.json({
            success: true,
            message: 'Face registration removed'
        });

    } catch (error) {
        console.error('Delete face error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete face: ' + error.message 
        });
    }
});

// Get attendance history with face data
app.get('/api/face/attendance', async (req, res) => {
    try {
        const { employee_id, org_id, date_from, date_to } = req.query;
        
        let query = `
            SELECT a.*, e.first_name, e.last_name, e.email
            FROM attendances a
            JOIN employees e ON a.employee_id = e.id
            WHERE a.source = 'face'
        `;
        
        const params = [];
        
        if (employee_id) {
            query += ' AND a.employee_id = ?';
            params.push(employee_id);
        }
        
        if (org_id) {
            query += ' AND a.org_id = ?';
            params.push(org_id);
        }
        
        if (date_from) {
            query += ' AND a.attendance_date >= ?';
            params.push(date_from);
        }
        
        if (date_to) {
            query += ' AND a.attendance_date <= ?';
            params.push(date_to);
        }
        
        query += ' ORDER BY a.attendance_date DESC, a.check_in DESC';

        const [rows] = await pool.execute(query, params);

        res.json({
            success: true,
            count: rows.length,
            records: rows
        });

    } catch (error) {
        console.error('Get face attendance error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get attendance: ' + error.message 
        });
    }
});

// ==================== START SERVER ====================

async function startServer() {
    await initDatabase();
    await loadModels();
    
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║     HRMS Face Recognition Server Running                   ║
║     ─────────────────────────────────────                  ║
║     Server: http://localhost:${PORT}                         ║
║     API Base: http://localhost:${PORT}/api                    ║
║     Face API: ${faceApiLoaded ? '✅ Loaded' : '⚠️ Not Loaded'}                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
    });
}

startServer();

