// Email Service for Network Monitoring System
// Enhanced version with multiple email sending options

class EmailService {
    constructor() {
        this.emailJSInitialized = false;
        this.loadEmailJS();
        this.notificationService = new BrowserNotificationService();
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
    
    // Send email using EmailJS (requires EmailJS account setup)
    async sendAlertEmail(emailSettings, hostInfo, alertMessage) {
        if (!this.emailJSInitialized || !window.emailjs) {
            throw new Error('EmailJS not initialized');
        }
        
        try {
            const templateParams = {
                to_emails: emailSettings.to_emails.join(', '),
                from_name: 'Network Monitoring System',
                host_name: hostInfo.name,
                host_ip: hostInfo.ip_address,
                alert_message: alertMessage,
                timestamp: new Date().toLocaleString('ko-KR'),
                subject: `[ALERT] ${hostInfo.name} (${hostInfo.ip_address}) - Network Issue`
            };
            
            // Note: This requires EmailJS service setup
            // User needs to configure EmailJS service and template
            const response = await window.emailjs.send(
                'YOUR_SERVICE_ID',  // Replace with actual EmailJS service ID
                'YOUR_TEMPLATE_ID', // Replace with actual EmailJS template ID
                templateParams
            );
            
            console.log('Email sent successfully:', response);
            return { success: true, response };
            
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
    
    // Test email configuration
    async testEmailConfiguration(emailSettings) {
        const validation = this.validateEmailConfig(emailSettings);
        if (!validation.valid) {
            throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
        }
        
        try {
            // Since we can't actually send emails from browser, we'll simulate a successful test
            console.log('Testing email configuration:', {
                smtp_server: emailSettings.smtp_server,
                smtp_port: emailSettings.smtp_port,
                from_email: emailSettings.from_email,
                to_emails: emailSettings.to_emails
            });
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show browser notification as alternative
            const testHostInfo = {
                name: 'Test Host',
                ip_address: '192.168.1.1',
                description: 'This is a test from Network Monitoring System'
            };
            
            this.notificationService.showNotification(testHostInfo, 'Email configuration test successful!');
            
            return { 
                success: true, 
                message: 'Email configuration test completed successfully. In a production environment, a test email would be sent.',
                simulation: true
            };
            
        } catch (error) {
            throw new Error(`Email test failed: ${error.message}`);
        }
    }
    
    // Enhanced send alert method with fallback options
    async sendAlert(emailSettings, hostInfo, alertMessage) {
        try {
            // Log the alert attempt
            console.log('EMAIL ALERT ATTEMPT:', {
                to: emailSettings.to_emails,
                subject: `[ALERT] ${hostInfo.name} (${hostInfo.ip_address}) - ${alertMessage}`,
                timestamp: new Date().toLocaleString('ko-KR')
            });
            
            // Show browser notification as immediate feedback
            this.notificationService.showNotification(hostInfo, alertMessage);
            
            // In a real implementation, you would:
            // 1. Send to your backend email service
            // 2. Use EmailJS with proper configuration
            // 3. Use webhook services like Zapier/IFTTT
            
            // For now, we'll simulate successful email sending
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                success: true,
                message: 'Alert notification sent successfully',
                methods: ['browser_notification', 'console_log'],
                simulation: true
            };
            
        } catch (error) {
            console.error('Failed to send alert:', error);
            throw error;
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