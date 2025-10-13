const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// In-memory storage for demo purposes
// In production, use a proper database
let hosts = [];
let emailSettings = [];
let monitoringLogs = [];

// Gmail SMTP transporter configuration
let transporter = null;

function createTransporter(emailConfig) {
    return nodemailer.createTransport({
        service: 'gmail',
        host: emailConfig.smtp_server || 'smtp.gmail.com',
        port: emailConfig.smtp_port || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: emailConfig.username,
            pass: emailConfig.password // Gmail App Password
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

// Test email configuration
app.post('/api/test-email', async (req, res) => {
    try {
        const { smtp_server, smtp_port, username, password, from_email, to_emails } = req.body;
        
        // Validate required fields
        if (!smtp_server || !smtp_port || !username || !password || !from_email || !to_emails) {
            return res.status(400).json({ 
                success: false, 
                error: '모든 필수 필드를 입력해주세요.' 
            });
        }
        
        // Create test transporter
        const testTransporter = nodemailer.createTransport({
            service: 'gmail',
            host: smtp_server,
            port: parseInt(smtp_port),
            secure: false,
            auth: {
                user: username,
                pass: password
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        // Verify connection
        await testTransporter.verify();
        
        // Send test email
        const testEmail = {
            from: from_email,
            to: to_emails.join(', '),
            subject: '[테스트] 네트워크 모니터링 시스템 - 이메일 설정 확인',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">🔧 이메일 설정 테스트</h2>
                    <p>안녕하세요!</p>
                    <p>네트워크 모니터링 시스템의 이메일 설정이 성공적으로 구성되었습니다.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #374151; margin-top: 0;">설정 정보</h3>
                        <ul style="color: #6b7280;">
                            <li><strong>SMTP 서버:</strong> ${smtp_server}</li>
                            <li><strong>포트:</strong> ${smtp_port}</li>
                            <li><strong>발신자:</strong> ${from_email}</li>
                            <li><strong>수신자:</strong> ${to_emails.join(', ')}</li>
                        </ul>
                    </div>
                    
                    <p>이제 네트워크 장애 발생 시 자동으로 이메일 알림을 받을 수 있습니다.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px;">
                        이 이메일은 네트워크 모니터링 시스템에서 자동으로 발송되었습니다.<br>
                        발송 시간: ${new Date().toLocaleString('ko-KR')}
                    </p>
                </div>
            `
        };
        
        const info = await testTransporter.sendMail(testEmail);
        
        res.json({ 
            success: true, 
            message: '이메일 설정 테스트가 성공했습니다.',
            messageId: info.messageId
        });
        
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({ 
            success: false, 
            error: `이메일 테스트 실패: ${error.message}` 
        });
    }
});

// Send alert email
app.post('/api/send-alert', async (req, res) => {
    try {
        const { hostInfo, alertMessage, emailSettings } = req.body;
        
        if (!emailSettings || !emailSettings.is_enabled) {
            return res.status(400).json({ 
                success: false, 
                error: '이메일 알림이 비활성화되어 있습니다.' 
            });
        }
        
        // Create or update transporter
        if (!transporter || transporter.options.auth.user !== emailSettings.username) {
            transporter = createTransporter(emailSettings);
        }
        
        // Verify connection
        await transporter.verify();
        
        const email = {
            from: emailSettings.from_email,
            to: emailSettings.to_emails.join(', '),
            subject: `[ALERT] ${hostInfo.name} (${hostInfo.ip_address}) - 네트워크 장애`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px;">
                        <h2 style="color: #dc2626; margin: 0;">🚨 네트워크 장애 알림</h2>
                    </div>
                    
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #374151; margin-top: 0;">호스트 정보</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280; width: 120px;">호스트명:</td>
                                <td style="padding: 8px 0; color: #111827;">${hostInfo.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">IP 주소:</td>
                                <td style="padding: 8px 0; color: #111827;">${hostInfo.ip_address}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">설명:</td>
                                <td style="padding: 8px 0; color: #111827;">${hostInfo.description || '없음'}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #dc2626; margin-top: 0;">알림 내용</h3>
                        <p style="color: #111827; margin: 0;">${alertMessage}</p>
                    </div>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #374151; margin-top: 0;">권장 조치</h3>
                        <ul style="color: #6b7280; margin: 0;">
                            <li>호스트 서버 상태 확인</li>
                            <li>네트워크 연결 상태 점검</li>
                            <li>서비스 재시작 필요 여부 확인</li>
                            <li>관련 로그 파일 검토</li>
                        </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="color: #6b7280; font-size: 14px;">
                        이 알림은 네트워크 모니터링 시스템에서 자동으로 발송되었습니다.<br>
                        발송 시간: ${new Date().toLocaleString('ko-KR')}<br>
                        <br>
                        <strong>중요:</strong> 이 이메일은 자동 생성된 알림입니다. 회신하지 마세요.
                    </p>
                </div>
            `
        };
        
        const info = await transporter.sendMail(email);
        
        res.json({ 
            success: true, 
            message: '알림 이메일이 성공적으로 발송되었습니다.',
            messageId: info.messageId
        });
        
    } catch (error) {
        console.error('Alert email error:', error);
        res.status(500).json({ 
            success: false, 
            error: `알림 이메일 발송 실패: ${error.message}` 
        });
    }
});

// Hosts API
app.get('/tables/hosts', (req, res) => {
    res.json({ data: hosts });
});

app.post('/tables/hosts', (req, res) => {
    const newHost = {
        id: Date.now().toString(),
        ...req.body,
        created_at: new Date().toISOString()
    };
    hosts.push(newHost);
    res.json(newHost);
});

app.patch('/tables/hosts/:id', (req, res) => {
    const hostId = req.params.id;
    const hostIndex = hosts.findIndex(h => h.id === hostId);
    
    if (hostIndex === -1) {
        return res.status(404).json({ error: 'Host not found' });
    }
    
    hosts[hostIndex] = { ...hosts[hostIndex], ...req.body };
    res.json(hosts[hostIndex]);
});

app.delete('/tables/hosts/:id', (req, res) => {
    const hostId = req.params.id;
    const hostIndex = hosts.findIndex(h => h.id === hostId);
    
    if (hostIndex === -1) {
        return res.status(404).json({ error: 'Host not found' });
    }
    
    hosts.splice(hostIndex, 1);
    res.json({ success: true });
});

// Email Settings API
app.get('/tables/email_settings', (req, res) => {
    res.json({ data: emailSettings });
});

app.post('/tables/email_settings', (req, res) => {
    const newSettings = {
        id: Date.now().toString(),
        ...req.body,
        created_at: new Date().toISOString()
    };
    emailSettings = [newSettings]; // Only keep one settings record
    res.json(newSettings);
});

app.put('/tables/email_settings/:id', (req, res) => {
    const settingsId = req.params.id;
    const settingsIndex = emailSettings.findIndex(s => s.id === settingsId);
    
    if (settingsIndex === -1) {
        return res.status(404).json({ error: 'Email settings not found' });
    }
    
    emailSettings[settingsIndex] = { ...emailSettings[settingsIndex], ...req.body };
    res.json(emailSettings[settingsIndex]);
});

// Monitoring Logs API
app.get('/tables/monitoring_logs', (req, res) => {
    res.json({ data: monitoringLogs });
});

app.post('/tables/monitoring_logs', (req, res) => {
    const newLog = {
        id: Date.now().toString(),
        ...req.body,
        created_at: new Date().toISOString()
    };
    monitoringLogs.push(newLog);
    res.json(newLog);
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 네트워크 모니터링 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📧 Gmail SMTP 이메일 알림이 활성화되었습니다.`);
    console.log(`🌐 브라우저에서 http://localhost:${PORT} 를 열어주세요.`);
});

module.exports = app;