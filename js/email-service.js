// Email Service for Network Monitoring System
// Note: This is a client-side implementation with limitations.
// For production use, implement server-side email service.

class EmailService {
    constructor() {
        this.emailJSInitialized = false;
        this.loadEmailJS();
    }
    
    // Load EmailJS library for client-side email sending
    loadEmailJS() {
        if (window.emailjs) {
            this.emailJSInitialized = true;
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
            this.emailJSInitialized = true;
            console.log('EmailJS loaded successfully');
        };
        script.onerror = () => {
            console.error('Failed to load EmailJS');
        };
        document.head.appendChild(script);
    }
    
    // Initialize EmailJS with user credentials
    initializeEmailJS(publicKey) {
        if (window.emailjs && publicKey) {
            window.emailjs.init(publicKey);
            return true;
        }
        return false;
    }
    
    // Send email using backend API
    async sendAlertEmail(emailSettings, hostInfo, alertMessage) {
        try {
            const response = await fetch('/api/send-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hostInfo: hostInfo,
                    alertMessage: alertMessage,
                    emailSettings: emailSettings
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '이메일 발송에 실패했습니다.');
            }
            
            const result = await response.json();
            console.log('Email sent successfully:', result);
            return { success: true, result };
            
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }
    
    // Alternative method using Fetch API to backend service
    async sendEmailViaBackend(emailSettings, hostInfo, alertMessage) {
        try {
            const emailData = {
                smtp_server: emailSettings.smtp_server,
                smtp_port: emailSettings.smtp_port,
                username: emailSettings.username,
                password: emailSettings.password,
                from_email: emailSettings.from_email,
                to_emails: emailSettings.to_emails,
                subject: `[ALERT] ${hostInfo.name} (${hostInfo.ip_address}) - Network Issue`,
                body: this.generateEmailBody(hostInfo, alertMessage)
            };
            
            // This would require a backend email service
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });
            
            if (!response.ok) {
                throw new Error(`Email service returned ${response.status}`);
            }
            
            const result = await response.json();
            return { success: true, result };
            
        } catch (error) {
            console.error('Backend email service failed:', error);
            throw error;
        }
    }
    
    // Generate email body content
    generateEmailBody(hostInfo, alertMessage) {
        return `
네트워크 모니터링 알림

호스트 정보:
- 이름: ${hostInfo.name}
- IP 주소: ${hostInfo.ip_address}
- 설명: ${hostInfo.description || '없음'}

알림 내용:
${alertMessage}

발생 시간: ${new Date().toLocaleString('ko-KR')}

이 알림은 네트워크 모니터링 시스템에서 자동으로 발송되었습니다.
호스트 상태를 확인하고 필요한 조치를 취해주세요.

---
Network Monitoring System
        `;
    }
    
    // Validate email configuration
    validateEmailConfig(emailSettings) {
        const required = ['smtp_server', 'smtp_port', 'username', 'password', 'from_email'];
        const missing = required.filter(field => !emailSettings[field]);
        
        if (missing.length > 0) {
            return {
                valid: false,
                errors: missing.map(field => `${field} is required`)
            };
        }
        
        if (!emailSettings.to_emails || emailSettings.to_emails.length === 0) {
            return {
                valid: false,
                errors: ['At least one recipient email is required']
            };
        }
        
        // Validate email addresses
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emailSettings.to_emails.filter(email => !emailRegex.test(email));
        
        if (invalidEmails.length > 0) {
            return {
                valid: false,
                errors: [`Invalid email addresses: ${invalidEmails.join(', ')}`]
            };
        }
        
        return { valid: true, errors: [] };
    }
    
    // Test email configuration using backend API
    async testEmailConfiguration(emailSettings) {
        const validation = this.validateEmailConfig(emailSettings);
        if (!validation.valid) {
            throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
        }
        
        try {
            const response = await fetch('/api/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailSettings)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '이메일 테스트에 실패했습니다.');
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            throw new Error(`Email test failed: ${error.message}`);
        }
    }
    
    // Generate SMTP configuration help text
    getSMTPHelp() {
        return {
            gmail: {
                smtp_server: 'smtp.gmail.com',
                smtp_port: 587,
                note: 'Gmail requires "App Passwords" instead of regular password. Enable 2FA and generate an app password.'
            },
            outlook: {
                smtp_server: 'smtp-mail.outlook.com',
                smtp_port: 587,
                note: 'Use your regular Outlook/Hotmail credentials.'
            },
            yahoo: {
                smtp_server: 'smtp.mail.yahoo.com',
                smtp_port: 587,
                note: 'Yahoo requires "App Passwords". Generate one in Yahoo Mail settings.'
            },
            custom: {
                note: 'Contact your email provider for SMTP settings. Common ports: 25, 587, 465 (SSL)'
            }
        };
    }
}

// Webhook-based email service (alternative approach)
class WebhookEmailService {
    constructor() {
        this.webhookUrl = null;
    }
    
    // Set webhook URL for email service (like Zapier, IFTTT, etc.)
    setWebhookUrl(url) {
        this.webhookUrl = url;
    }
    
    // Send email via webhook
    async sendEmailViaWebhook(hostInfo, alertMessage) {
        if (!this.webhookUrl) {
            throw new Error('Webhook URL not configured');
        }
        
        try {
            const webhookData = {
                event: 'network_alert',
                host_name: hostInfo.name,
                host_ip: hostInfo.ip_address,
                host_description: hostInfo.description,
                alert_message: alertMessage,
                timestamp: new Date().toISOString(),
                severity: this.determineAlertSeverity(alertMessage)
            };
            
            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(webhookData)
            });
            
            if (!response.ok) {
                throw new Error(`Webhook returned ${response.status}`);
            }
            
            return { success: true, webhookResponse: await response.text() };
            
        } catch (error) {
            console.error('Webhook email failed:', error);
            throw error;
        }
    }
    
    // Determine alert severity based on message
    determineAlertSeverity(message) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('critical') || lowerMessage.includes('down')) {
            return 'critical';
        } else if (lowerMessage.includes('warning') || lowerMessage.includes('slow')) {
            return 'warning';
        } else if (lowerMessage.includes('offline')) {
            return 'major';
        }
        
        return 'minor';
    }
}

// Browser notification service (as fallback)
class BrowserNotificationService {
    constructor() {
        this.requestPermission();
    }
    
    // Request notification permission
    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
            return permission === 'granted';
        }
        return false;
    }
    
    // Show browser notification
    showNotification(hostInfo, alertMessage) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`Network Alert: ${hostInfo.name}`, {
                body: `${hostInfo.ip_address} - ${alertMessage}`,
                icon: '/favicon.ico', // Add your icon path
                tag: `host-${hostInfo.id}`, // Prevent duplicate notifications
                requireInteraction: true
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto close after 10 seconds
            setTimeout(() => notification.close(), 10000);
            
            return true;
        }
        return false;
    }
}

// Export services for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EmailService,
        WebhookEmailService,
        BrowserNotificationService
    };
}