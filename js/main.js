// Network Monitoring System - Main JavaScript

class NetworkMonitor {
    constructor() {
        this.hosts = [];
        this.monitoringIntervals = new Map();
        this.emailSettings = null;
        this.isMonitoring = false;
        this.lastAlertTimes = new Map(); // To prevent spam alerts
        this.logs = []; // System logs
        this.maxLogs = 1000; // Maximum number of logs to keep
        this.currentLogFilter = 'all';
        this.emailService = new EmailService(); // Initialize email service
        
        this.init();
    }
    
    async init() {
        try {
            this.addLog('info', '네트워크 모니터 초기화 시작');
            
            // 이벤트 리스너를 먼저 설정
            this.setupEventListeners();
            this.addLog('debug', '이벤트 리스너 설정 완료');
            
            // 데이터 로딩
            await this.loadHosts();
            this.addLog('debug', `호스트 ${this.hosts.length}개 로드 완료`);
            
            await this.loadEmailSettings();
            this.addLog('debug', '이메일 설정 로드 완료');
            
            // 모니터링 시작 및 대시보드 업데이트
            this.startMonitoring();
            this.addLog('info', '모니터링 시작됨');
            
            this.updateDashboard();
            this.addLog('debug', '대시보드 업데이트 완료');
            
            this.addLog('info', '네트워크 모니터 초기화 성공');
            
        } catch (error) {
            this.addLog('error', '시스템 초기화 실패', error.message);
            this.showNotification('시스템 초기화 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.', 'error');
        }
    }
    
    setupEventListeners() {
        // Add Host Modal
        document.getElementById('addHostBtn').addEventListener('click', () => {
            this.showAddHostModal();
        });
        
        document.querySelectorAll('.add-host-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showAddHostModal();
            });
        });
        
        document.getElementById('cancelAddHost').addEventListener('click', () => {
            this.hideAddHostModal();
        });
        
        document.getElementById('addHostForm').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('호스트 추가 폼 submit 이벤트 발생');
            this.addLog('debug', '호스트 추가 폼 제출됨');
            this.addHost();
        });
        
        // Additional click listener for submit button
        document.getElementById('submitAddHost').addEventListener('click', (e) => {
            console.log('호스트 추가 버튼 직접 클릭됨');
            this.addLog('debug', '호스트 추가 버튼 클릭됨');
            
            // If it's not a form submit, prevent default and manually trigger addHost
            if (e.type === 'click' && e.target.type === 'submit') {
                // Let the form handle it naturally
                return;
            }
            
            e.preventDefault();
            this.addHost();
        });
        
        // Settings Modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        document.getElementById('cancelSettings').addEventListener('click', () => {
            this.hideSettingsModal();
        });
        
        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmailSettings();
        });
        
        // Test email settings button
        document.getElementById('testEmailSettings').addEventListener('click', () => {
            this.testEmailSettings();
        });
        
        // Browser notification permission button
        document.getElementById('requestNotificationPermission').addEventListener('click', () => {
            this.requestNotificationPermission();
        });
        
        // Logs Modal
        document.getElementById('logsBtn').addEventListener('click', () => {
            this.showLogsModal();
        });
        
        document.getElementById('closeLogsBtn').addEventListener('click', () => {
            this.hideLogsModal();
        });
        
        document.getElementById('clearLogsBtn').addEventListener('click', () => {
            this.clearLogs();
        });
        
        document.getElementById('exportLogsBtn').addEventListener('click', () => {
            this.exportLogs();
        });
        
        // Log filter buttons
        document.querySelectorAll('.log-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const level = e.target.getAttribute('data-level');
                this.setLogFilter(level);
            });
        });
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshAllHosts();
        });
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterHosts(e.target.value);
        });
        
        // Modal backdrop clicks
        document.getElementById('addHostModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideAddHostModal();
            }
        });
        
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideSettingsModal();
            }
        });
        
        document.getElementById('logsModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideLogsModal();
            }
        });
    }
    
    async loadHosts() {
        try {
            const response = await fetch('tables/hosts');
            const data = await response.json();
            this.hosts = data.data || [];
            this.renderHostsTable();
        } catch (error) {
            console.error('Error loading hosts:', error);
            this.hosts = [];
        }
    }
    
    async loadEmailSettings() {
        try {
            console.log('Loading email settings...');
            const response = await fetch('tables/email_settings');
            
            if (!response.ok) {
                console.warn('Failed to load email settings:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('Email settings response:', data);
            
            if (data.data && data.data.length > 0) {
                this.emailSettings = data.data[0];
                console.log('Email settings loaded:', this.emailSettings);
            } else {
                console.log('No email settings found');
                this.emailSettings = null;
            }
        } catch (error) {
            console.error('Error loading email settings:', error);
            this.emailSettings = null;
        }
    }
    
    showAddHostModal() {
        document.getElementById('addHostModal').classList.remove('hidden');
        document.getElementById('hostName').focus();
        this.addLog('debug', '호스트 추가 모달 열림');
        
        // Debug form state
        this.debugHostForm();
        
        // Add debug event listeners for form fields
        this.setupHostFormDebug();
    }
    
    hideAddHostModal() {
        document.getElementById('addHostModal').classList.add('hidden');
        document.getElementById('addHostForm').reset();
        document.getElementById('hostFormDebug').classList.add('hidden');
        this.addLog('debug', '호스트 추가 모달 닫힘');
    }
    
    setupHostFormDebug() {
        const debugDiv = document.getElementById('hostFormDebug');
        const debugContent = document.getElementById('hostFormDebugContent');
        
        const updateDebug = () => {
            const hostName = document.getElementById('hostName').value.trim();
            const hostIP = document.getElementById('hostIP').value.trim();
            const hostDesc = document.getElementById('hostDescription').value.trim();
            const monitorInterval = document.getElementById('monitorInterval').value;
            const emailAlerts = document.getElementById('emailAlerts').checked;
            
            const debugInfo = `
                호스트명: "${hostName}" (길이: ${hostName.length})
                IP 주소: "${hostIP}" (유효: ${this.isValidIP(hostIP) ? '✅' : '❌'})
                설명: "${hostDesc}"
                모니터링 간격: ${monitorInterval}초
                이메일 알람: ${emailAlerts ? '활성화' : '비활성화'}
                폼 유효성: ${hostName && hostIP && this.isValidIP(hostIP) ? '✅' : '❌'}
            `;
            
            debugContent.textContent = debugInfo;
            
            // Show debug info if there's any input
            if (hostName || hostIP || hostDesc) {
                debugDiv.classList.remove('hidden');
            } else {
                debugDiv.classList.add('hidden');
            }
        };
        
        // Add event listeners to form fields
        ['hostName', 'hostIP', 'hostDescription', 'monitorInterval', 'emailAlerts'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', updateDebug);
                element.addEventListener('change', updateDebug);
            }
        });
        
        // Initial update
        updateDebug();
    }
    
    showSettingsModal() {
        document.getElementById('settingsModal').classList.remove('hidden');
        this.populateSettingsForm();
    }
    
    hideSettingsModal() {
        document.getElementById('settingsModal').classList.add('hidden');
    }
    
    populateSettingsForm() {
        console.log('Populating settings form with:', this.emailSettings);
        
        // 기본값으로 폼 초기화
        document.getElementById('smtpServer').value = '';
        document.getElementById('smtpPort').value = '587';
        document.getElementById('emailUsername').value = '';
        document.getElementById('emailPassword').value = '';
        document.getElementById('fromEmail').value = '';
        document.getElementById('toEmails').value = '';
        document.getElementById('enableEmailAlerts').checked = true;
        
        // 기존 설정이 있으면 폼에 채우기
        if (this.emailSettings) {
            try {
                if (this.emailSettings.smtp_server) {
                    document.getElementById('smtpServer').value = this.emailSettings.smtp_server;
                }
                if (this.emailSettings.smtp_port) {
                    document.getElementById('smtpPort').value = this.emailSettings.smtp_port;
                }
                if (this.emailSettings.username) {
                    document.getElementById('emailUsername').value = this.emailSettings.username;
                }
                if (this.emailSettings.password) {
                    document.getElementById('emailPassword').value = this.emailSettings.password;
                }
                if (this.emailSettings.from_email) {
                    document.getElementById('fromEmail').value = this.emailSettings.from_email;
                }
                if (this.emailSettings.to_emails && Array.isArray(this.emailSettings.to_emails)) {
                    document.getElementById('toEmails').value = this.emailSettings.to_emails.join(', ');
                }
                if (typeof this.emailSettings.is_enabled === 'boolean') {
                    document.getElementById('enableEmailAlerts').checked = this.emailSettings.is_enabled;
                }
                if (typeof this.emailSettings.browser_notifications === 'boolean') {
                    document.getElementById('enableBrowserNotifications').checked = this.emailSettings.browser_notifications;
                }
            } catch (error) {
                console.error('Error populating form:', error);
            }
        }
    }
    
    async addHost() {
        try {
            this.addLog('info', '호스트 추가 시작');
            this.showLoading();
            
            // Verify form elements exist
            const requiredElements = ['hostName', 'hostIP', 'hostDescription', 'monitorInterval', 'emailAlerts'];
            for (const elementId of requiredElements) {
                const element = document.getElementById(elementId);
                if (!element) {
                    this.addLog('error', `폼 요소를 찾을 수 없음: ${elementId}`);
                    throw new Error(`폼 요소를 찾을 수 없습니다: ${elementId}`);
                }
            }
            
            const hostData = {
                name: document.getElementById('hostName').value.trim(),
                ip_address: document.getElementById('hostIP').value.trim(),
                description: document.getElementById('hostDescription').value.trim(),
                monitor_interval: parseInt(document.getElementById('monitorInterval').value),
                is_active: true,
                last_status: 'unknown',
                last_check: null,
                email_alerts: document.getElementById('emailAlerts').checked
            };
            
            this.addLog('debug', '호스트 데이터 수집 완료', hostData);
            
            // Validate required fields
            if (!hostData.name) {
                this.addLog('warning', '호스트 추가 실패: 호스트명 누락');
                throw new Error('호스트명을 입력해주세요.');
            }
            
            if (!hostData.ip_address) {
                this.addLog('warning', '호스트 추가 실패: IP 주소 누락');
                throw new Error('IP 주소를 입력해주세요.');
            }
            
            // Validate IP address
            if (!this.isValidIP(hostData.ip_address)) {
                this.addLog('warning', '호스트 추가 실패: 잘못된 IP 주소 형식', { ip: hostData.ip_address });
                throw new Error('유효하지 않은 IP 주소입니다.');
            }
            
            // Check if IP already exists
            if (this.hosts.some(host => host.ip_address === hostData.ip_address)) {
                throw new Error('이미 등록된 IP 주소입니다.');
            }
            
            const response = await fetch('tables/hosts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(hostData)
            });
            
            if (!response.ok) {
                throw new Error('호스트 추가에 실패했습니다.');
            }
            
            const newHost = await response.json();
            this.hosts.push(newHost);
            
            this.addLog('info', `새 호스트 추가 성공`, { 
                name: newHost.name, 
                ip: newHost.ip_address,
                id: newHost.id 
            });
            
            this.hideAddHostModal();
            this.renderHostsTable();
            this.updateDashboard();
            this.startMonitoringForHost(newHost);
            
            this.showNotification('호스트가 성공적으로 추가되었습니다.', 'success');
            
        } catch (error) {
            this.addLog('error', '호스트 추가 실패', { error: error.message, stack: error.stack });
            this.showNotification(error.message, 'error');
            
            // Additional debug info on failure
            this.debugHostForm();
        } finally {
            this.hideLoading();
        }
    }
    
    async saveEmailSettings() {
        try {
            this.addLog('info', '이메일 설정 저장 시작');
            this.showLoading();
            
            // 폼 데이터 유효성 검사
            const smtpServer = document.getElementById('smtpServer').value.trim();
            const smtpPort = document.getElementById('smtpPort').value.trim();
            const emailUsername = document.getElementById('emailUsername').value.trim();
            const fromEmail = document.getElementById('fromEmail').value.trim();
            const toEmailsText = document.getElementById('toEmails').value.trim();
            
            this.addLog('debug', '이메일 설정 폼 데이터 수집', {
                smtpServer: smtpServer,
                smtpPort: smtpPort,
                emailUsername: emailUsername,
                fromEmail: fromEmail,
                toEmailsCount: toEmailsText ? toEmailsText.split(',').length : 0
            });
            
            // 기본 필드 검증
            if (!smtpServer) {
                this.addLog('warning', '이메일 설정 저장 실패: SMTP 서버 주소 누락');
                throw new Error('SMTP 서버 주소를 입력해주세요.');
            }
            
            if (!smtpPort || isNaN(parseInt(smtpPort))) {
                this.addLog('warning', '이메일 설정 저장 실패: 올바르지 않은 SMTP 포트');
                throw new Error('올바른 SMTP 포트 번호를 입력해주세요.');
            }
            
            if (!emailUsername) {
                this.addLog('warning', '이메일 설정 저장 실패: 사용자명 누락');
                throw new Error('사용자명(이메일)을 입력해주세요.');
            }
            
            if (!fromEmail) {
                this.addLog('warning', '이메일 설정 저장 실패: 발신자 이메일 누락');
                throw new Error('발신자 이메일을 입력해주세요.');
            }
            
            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailUsername)) {
                throw new Error('올바른 사용자 이메일 형식을 입력해주세요.');
            }
            
            if (!emailRegex.test(fromEmail)) {
                throw new Error('올바른 발신자 이메일 형식을 입력해주세요.');
            }
            
            // 수신자 이메일 처리 및 검증
            const toEmails = [];
            if (toEmailsText) {
                const emailList = toEmailsText.split(',').map(email => email.trim()).filter(email => email);
                for (const email of emailList) {
                    if (!emailRegex.test(email)) {
                        throw new Error(`올바르지 않은 수신자 이메일 형식: ${email}`);
                    }
                }
                toEmails.push(...emailList);
            }
            
            if (toEmails.length === 0) {
                throw new Error('최소 하나의 수신자 이메일을 입력해주세요.');
            }
            
            const settingsData = {
                smtp_server: smtpServer,
                smtp_port: parseInt(smtpPort),
                username: emailUsername,
                password: document.getElementById('emailPassword').value, // 빈 값도 허용
                from_email: fromEmail,
                to_emails: toEmails,
                is_enabled: document.getElementById('enableEmailAlerts').checked,
                browser_notifications: document.getElementById('enableBrowserNotifications').checked
            };
            
            this.addLog('debug', '이메일 설정 데이터 준비 완료', settingsData);
            
            let response;
            let url, method;
            
            if (this.emailSettings && this.emailSettings.id) {
                // Update existing settings
                url = `tables/email_settings/${this.emailSettings.id}`;
                method = 'PUT';
                this.addLog('info', `기존 이메일 설정 업데이트 시도 (ID: ${this.emailSettings.id})`);
            } else {
                // Create new settings
                url = 'tables/email_settings';
                method = 'POST';
                this.addLog('info', '새 이메일 설정 생성 시도');
            }
            
            this.addLog('debug', `API 요청`, { method, url, dataSize: JSON.stringify(settingsData).length });
            
            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settingsData)
            });
            
            this.addLog('debug', `API 응답`, { status: response.status, statusText: response.statusText });
            
            if (!response.ok) {
                let errorMessage = '설정 저장에 실패했습니다.';
                let errorDetails = null;
                
                try {
                    const errorData = await response.json();
                    this.addLog('error', 'API 오류 응답 (JSON)', errorData);
                    if (errorData.error) {
                        errorMessage += ` (${errorData.error})`;
                        errorDetails = errorData;
                    }
                } catch (parseError) {
                    const errorText = await response.text();
                    this.addLog('error', 'API 오류 응답 (Text)', { text: errorText, parseError: parseError.message });
                    if (errorText) {
                        errorMessage += ` (${errorText})`;
                        errorDetails = { text: errorText };
                    }
                }
                
                this.addLog('error', '이메일 설정 저장 실패', { 
                    status: response.status, 
                    statusText: response.statusText,
                    errorMessage: errorMessage,
                    errorDetails: errorDetails
                });
                
                throw new Error(errorMessage);
            }
            
            const savedSettings = await response.json();
            this.addLog('info', '이메일 설정 저장 성공', { settingsId: savedSettings.id });
            
            this.emailSettings = savedSettings;
            this.hideSettingsModal();
            this.showNotification('이메일 설정이 성공적으로 저장되었습니다.', 'success');
            
        } catch (error) {
            this.addLog('error', '이메일 설정 저장 중 예외 발생', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // 사용자 친화적 오류 메시지 제공
            let userMessage = error.message;
            if (error.message.includes('fetch')) {
                userMessage = '네트워크 연결을 확인해주세요.';
            } else if (error.message.includes('JSON')) {
                userMessage = '서버 응답 처리 중 오류가 발생했습니다.';
            }
            
            this.showNotification(userMessage, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async testEmailSettings() {
        try {
            this.addLog('info', '이메일 설정 테스트 시작');
            this.showLoading();
            
            // 현재 폼의 값들로 임시 설정 객체 생성
            const smtpServer = document.getElementById('smtpServer').value.trim();
            const smtpPort = document.getElementById('smtpPort').value.trim();
            const emailUsername = document.getElementById('emailUsername').value.trim();
            const fromEmail = document.getElementById('fromEmail').value.trim();
            const toEmailsText = document.getElementById('toEmails').value.trim();
            
            this.addLog('debug', '이메일 테스트용 데이터 수집', {
                smtpServer,
                smtpPort,
                emailUsername,
                fromEmail,
                toEmailsLength: toEmailsText.length
            });
            
            // 기본 검증
            if (!smtpServer || !smtpPort || !emailUsername || !fromEmail || !toEmailsText) {
                throw new Error('모든 필수 필드를 입력해주세요.');
            }
            
            // 이메일 형식 검증
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailUsername) || !emailRegex.test(fromEmail)) {
                throw new Error('올바른 이메일 형식을 입력해주세요.');
            }
            
            const toEmails = toEmailsText.split(',').map(email => email.trim()).filter(email => email);
            if (toEmails.length === 0) {
                throw new Error('수신자 이메일을 입력해주세요.');
            }
            
            for (const email of toEmails) {
                if (!emailRegex.test(email)) {
                    throw new Error(`올바르지 않은 수신자 이메일: ${email}`);
                }
            }
            
            // 테스트 설정 객체
            const testSettings = {
                smtp_server: smtpServer,
                smtp_port: parseInt(smtpPort),
                username: emailUsername,
                password: document.getElementById('emailPassword').value,
                from_email: fromEmail,
                to_emails: toEmails,
                is_enabled: true
            };
            
            this.addLog('debug', '이메일 서비스를 통한 테스트 시작', testSettings);
            
            // Use the email service to test configuration
            const result = await this.emailService.testEmailConfiguration(testSettings);
            
            this.addLog('info', '이메일 설정 테스트 성공', result);
            this.showNotification(result.message, 'success');
            
        } catch (error) {
            this.addLog('error', '이메일 설정 테스트 실패', error.message);
            this.showNotification(`이메일 설정 테스트 실패: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async requestNotificationPermission() {
        try {
            if (!('Notification' in window)) {
                this.showNotification('이 브라우저는 알림을 지원하지 않습니다.', 'error');
                return;
            }
            
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.showNotification('브라우저 알림 권한이 승인되었습니다.', 'success');
                this.addLog('info', '브라우저 알림 권한 승인됨');
                
                // Show test notification
                const testNotification = new Notification('네트워크 모니터링 시스템', {
                    body: '브라우저 알림이 정상적으로 설정되었습니다.',
                    icon: '/favicon.ico'
                });
                
                setTimeout(() => testNotification.close(), 3000);
                
            } else if (permission === 'denied') {
                this.showNotification('브라우저 알림 권한이 거부되었습니다. 브라우저 설정에서 수동으로 허용해주세요.', 'warning');
                this.addLog('warning', '브라우저 알림 권한 거부됨');
            } else {
                this.showNotification('브라우저 알림 권한 요청이 취소되었습니다.', 'info');
                this.addLog('info', '브라우저 알림 권한 요청 취소됨');
            }
            
        } catch (error) {
            this.addLog('error', '브라우저 알림 권한 요청 실패', error.message);
            this.showNotification('브라우저 알림 권한 요청 중 오류가 발생했습니다.', 'error');
        }
    }
    
    async deleteHost(hostId) {
        if (!confirm('이 호스트를 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await fetch(`tables/hosts/${hostId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('호스트 삭제에 실패했습니다.');
            }
            
            // Stop monitoring for this host
            if (this.monitoringIntervals.has(hostId)) {
                clearInterval(this.monitoringIntervals.get(hostId));
                this.monitoringIntervals.delete(hostId);
            }
            
            // Remove from local array
            this.hosts = this.hosts.filter(host => host.id !== hostId);
            
            this.renderHostsTable();
            this.updateDashboard();
            this.showNotification('호스트가 삭제되었습니다.', 'success');
            
        } catch (error) {
            console.error('Error deleting host:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async toggleHostMonitoring(hostId) {
        try {
            const host = this.hosts.find(h => h.id === hostId);
            if (!host) return;
            
            const newActiveState = !host.is_active;
            
            const response = await fetch(`tables/hosts/${hostId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    is_active: newActiveState
                })
            });
            
            if (!response.ok) {
                throw new Error('호스트 상태 변경에 실패했습니다.');
            }
            
            const updatedHost = await response.json();
            const hostIndex = this.hosts.findIndex(h => h.id === hostId);
            this.hosts[hostIndex] = updatedHost;
            
            if (newActiveState) {
                this.startMonitoringForHost(updatedHost);
            } else {
                if (this.monitoringIntervals.has(hostId)) {
                    clearInterval(this.monitoringIntervals.get(hostId));
                    this.monitoringIntervals.delete(hostId);
                }
            }
            
            this.renderHostsTable();
            this.updateDashboard();
            
            const status = newActiveState ? '활성화' : '비활성화';
            this.showNotification(`${host.name} 모니터링이 ${status}되었습니다.`, 'info');
            
        } catch (error) {
            console.error('Error toggling host monitoring:', error);
            this.showNotification(error.message, 'error');
        }
    }
    
    renderHostsTable() {
        const tbody = document.getElementById('hostsTableBody');
        const emptyState = document.getElementById('emptyState');
        
        if (this.hosts.length === 0) {
            tbody.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        tbody.innerHTML = this.hosts.map(host => `
            <tr class="table-row-hover" data-host-id="${host.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    ${this.getStatusBadge(host.last_status)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${this.escapeHtml(host.name)}</div>
                    <div class="text-sm text-gray-500">${this.escapeHtml(host.description || '')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${host.ip_address}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${this.getResponseTimeDisplay(host)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${host.last_check ? this.formatDateTime(host.last_check) : '없음'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button class="btn-action btn-toggle ${host.is_active ? 'active' : ''}" 
                            onclick="networkMonitor.toggleHostMonitoring('${host.id}')" 
                            title="${host.is_active ? '모니터링 중지' : '모니터링 시작'}">
                        <i class="fas ${host.is_active ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-action btn-edit" onclick="networkMonitor.editHost('${host.id}')" title="편집">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="networkMonitor.deleteHost('${host.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    getStatusBadge(status) {
        const badges = {
            'online': '<span class="status-online"><i class="fas fa-check-circle mr-1"></i>온라인</span>',
            'offline': '<span class="status-offline"><i class="fas fa-times-circle mr-1"></i>오프라인</span>',
            'unknown': '<span class="status-unknown"><i class="fas fa-question-circle mr-1"></i>알 수 없음</span>',
            'checking': '<span class="status-checking status-pulse"><i class="fas fa-sync-alt mr-1"></i>확인 중</span>'
        };
        return badges[status] || badges['unknown'];
    }
    
    getResponseTimeDisplay(host) {
        if (!host.response_time || host.last_status !== 'online') {
            return '-';
        }
        
        const time = host.response_time;
        let className = 'response-excellent';
        
        if (time > 1000) className = 'response-poor';
        else if (time > 500) className = 'response-fair';
        else if (time > 100) className = 'response-good';
        
        return `<span class="${className}">${time}ms</span>`;
    }
    
    updateDashboard() {
        const onlineCount = this.hosts.filter(h => h.last_status === 'online').length;
        const offlineCount = this.hosts.filter(h => h.last_status === 'offline').length;
        const unknownCount = this.hosts.filter(h => h.last_status === 'unknown' || h.last_status === 'checking').length;
        
        document.getElementById('onlineCount').textContent = onlineCount;
        document.getElementById('offlineCount').textContent = offlineCount;
        document.getElementById('unknownCount').textContent = unknownCount;
        document.getElementById('totalHosts').textContent = this.hosts.length;
    }
    
    startMonitoring() {
        this.hosts.forEach(host => {
            if (host.is_active) {
                this.startMonitoringForHost(host);
            }
        });
        this.isMonitoring = true;
    }
    
    startMonitoringForHost(host) {
        // Clear existing interval if any
        if (this.monitoringIntervals.has(host.id)) {
            clearInterval(this.monitoringIntervals.get(host.id));
        }
        
        // Start new monitoring interval
        const interval = setInterval(() => {
            this.checkHostStatus(host.id);
        }, host.monitor_interval * 1000);
        
        this.monitoringIntervals.set(host.id, interval);
        
        // Immediate check
        this.checkHostStatus(host.id);
    }
    
    async checkHostStatus(hostId) {
        const host = this.hosts.find(h => h.id === hostId);
        if (!host || !host.is_active) return;
        
        try {
            // Update UI to show checking status
            host.last_status = 'checking';
            this.renderHostsTable();
            
            const startTime = Date.now();
            
            // Since we can't actually ping from browser, we'll simulate with HTTP request
            // In a real implementation, you'd need a backend service for actual ping
            const result = await this.simulatePing(host.ip_address);
            
            const responseTime = Date.now() - startTime;
            
            // Update host status
            const newStatus = result.success ? 'online' : 'offline';
            const updateData = {
                last_status: newStatus,
                last_check: Date.now(),
                response_time: result.success ? responseTime : null
            };
            
            // Update in database
            const response = await fetch(`tables/hosts/${hostId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                const updatedHost = await response.json();
                const hostIndex = this.hosts.findIndex(h => h.id === hostId);
                this.hosts[hostIndex] = updatedHost;
                
                // Log the monitoring result
                await this.logMonitoringResult(hostId, newStatus, responseTime, result.error);
                
                // Check for alerts
                if (newStatus === 'offline' && host.email_alerts) {
                    await this.sendAlert(host, 'Host is offline');
                }
                
                this.renderHostsTable();
                this.updateDashboard();
            }
            
        } catch (error) {
            console.error('Error checking host status:', error);
            
            // Update status to offline on error
            const updateData = {
                last_status: 'offline',
                last_check: Date.now(),
                response_time: null
            };
            
            try {
                const response = await fetch(`tables/hosts/${hostId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                
                if (response.ok) {
                    const updatedHost = await response.json();
                    const hostIndex = this.hosts.findIndex(h => h.id === hostId);
                    this.hosts[hostIndex] = updatedHost;
                    
                    await this.logMonitoringResult(hostId, 'offline', null, error.message);
                    
                    if (host.email_alerts) {
                        await this.sendAlert(host, `Host check failed: ${error.message}`);
                    }
                    
                    this.renderHostsTable();
                    this.updateDashboard();
                }
            } catch (updateError) {
                console.error('Error updating host after failed check:', updateError);
            }
        }
    }
    
    async simulatePing(ipAddress) {
        // Since browsers can't perform actual ping, we simulate it with various methods
        // In a real implementation, you'd need a backend service
        
        try {
            // Try to make a request to determine if host is reachable
            // This is a simulation - replace with actual ping service
            
            // Method 1: Try HTTP request (if it's a web server)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
                const response = await fetch(`http://${ipAddress}`, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                return { success: true, error: null };
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                // If CORS error, host might be up but not allowing cross-origin requests
                if (fetchError.name === 'AbortError') {
                    return { success: false, error: 'Timeout' };
                }
                
                // For demo purposes, randomly succeed/fail based on IP
                const lastOctet = parseInt(ipAddress.split('.').pop());
                const success = lastOctet % 3 !== 0; // Simulate some hosts being down
                
                return {
                    success: success,
                    error: success ? null : 'Host unreachable'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async logMonitoringResult(hostId, status, responseTime, errorMessage) {
        try {
            const logData = {
                host_id: hostId,
                status: status,
                response_time: responseTime,
                timestamp: Date.now(),
                error_message: errorMessage || null
            };
            
            await fetch('tables/monitoring_logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });
        } catch (error) {
            console.error('Error logging monitoring result:', error);
        }
    }
    
    async sendAlert(host, message) {
        if (!this.emailSettings || !this.emailSettings.is_enabled) {
            this.addLog('debug', '이메일 알림 비활성화됨', { host: host.name, message });
            return;
        }
        
        // Prevent spam alerts - only send if last alert was more than 15 minutes ago
        const lastAlertTime = this.lastAlertTimes.get(host.id);
        const now = Date.now();
        if (lastAlertTime && (now - lastAlertTime) < 15 * 60 * 1000) {
            this.addLog('debug', '알림 스팸 방지: 15분 이내 중복 알림 차단', { host: host.name });
            return;
        }
        
        try {
            this.addLog('info', '이메일 알림 발송 시작', { 
                host: host.name, 
                ip: host.ip_address, 
                message 
            });
            
            // Use the enhanced email service
            const result = await this.emailService.sendAlert(this.emailSettings, host, message);
            
            if (result.success) {
                this.addLog('info', '이메일 알림 발송 성공', result);
                this.showNotification(`${host.name}에 대한 알림이 발송되었습니다.`, 'info');
                this.lastAlertTimes.set(host.id, now);
            } else {
                this.addLog('warning', '이메일 알림 발송 실패', result);
            }
            
        } catch (error) {
            this.addLog('error', '이메일 알림 발송 중 오류', { 
                host: host.name, 
                error: error.message 
            });
            console.error('Error sending alert:', error);
        }
    }
    
    async refreshAllHosts() {
        try {
            this.showLoading();
            
            for (const host of this.hosts) {
                if (host.is_active) {
                    await this.checkHostStatus(host.id);
                }
            }
            
            this.showNotification('모든 호스트 상태가 새로고침되었습니다.', 'success');
            
        } catch (error) {
            console.error('Error refreshing hosts:', error);
            this.showNotification('호스트 새로고침 중 오류가 발생했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    filterHosts(searchTerm) {
        const rows = document.querySelectorAll('#hostsTableBody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // Utility functions
    isValidIP(ip) {
        const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return regex.test(ip);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString('ko-KR');
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }
    
    // Debug function to check form state
    debugHostForm() {
        const form = document.getElementById('addHostForm');
        const hostName = document.getElementById('hostName');
        const hostIP = document.getElementById('hostIP');
        const submitBtn = document.getElementById('submitAddHost');
        
        const formState = {
            formExists: !!form,
            hostNameExists: !!hostName,
            hostNameValue: hostName ? hostName.value : 'N/A',
            hostIPExists: !!hostIP,
            hostIPValue: hostIP ? hostIP.value : 'N/A',
            submitBtnExists: !!submitBtn,
            formValid: form ? form.checkValidity() : false
        };
        
        this.addLog('debug', '호스트 폼 상태 확인', formState);
        return formState;
    }
    
    // Placeholder for edit functionality
    editHost(hostId) {
        this.showNotification('편집 기능은 개발 예정입니다.', 'info');
    }
    
    // ===============================
    // LOG SYSTEM FUNCTIONS
    // ===============================
    
    // Add log entry
    addLog(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp: timestamp,
            level: level,
            message: message,
            details: details,
            id: Date.now() + Math.random()
        };
        
        this.logs.unshift(logEntry); // Add to beginning
        
        // Keep only max number of logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }
        
        // Console output for debugging
        const consoleMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        switch (level) {
            case 'error':
                console.error(consoleMessage, details);
                break;
            case 'warning':
                console.warn(consoleMessage, details);
                break;
            case 'info':
                console.info(consoleMessage, details);
                break;
            case 'debug':
                console.log(consoleMessage, details);
                break;
            default:
                console.log(consoleMessage, details);
        }
        
        // Update logs modal if open
        if (!document.getElementById('logsModal').classList.contains('hidden')) {
            this.renderLogs();
        }
    }
    
    // Show logs modal
    showLogsModal() {
        document.getElementById('logsModal').classList.remove('hidden');
        this.renderLogs();
    }
    
    // Hide logs modal
    hideLogsModal() {
        document.getElementById('logsModal').classList.add('hidden');
    }
    
    // Set log filter
    setLogFilter(level) {
        this.currentLogFilter = level;
        
        // Update button states
        document.querySelectorAll('.log-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-level="${level}"]`).classList.add('active');
        
        this.renderLogs();
    }
    
    // Render logs in modal
    renderLogs() {
        const logContent = document.getElementById('logContent');
        const logCount = document.getElementById('logCount');
        const lastUpdate = document.getElementById('lastLogUpdate');
        
        // Filter logs
        let filteredLogs = this.logs;
        if (this.currentLogFilter !== 'all') {
            filteredLogs = this.logs.filter(log => log.level === this.currentLogFilter);
        }
        
        // Generate HTML
        const logHtml = filteredLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleString('ko-KR');
            const detailsHtml = log.details ? `\n상세: ${JSON.stringify(log.details, null, 2)}` : '';
            
            return `<div class="log-entry ${log.level}">
                <span class="log-timestamp">[${time}]</span> 
                <strong>[${log.level.toUpperCase()}]</strong> 
                ${this.escapeHtml(log.message)}${detailsHtml}
            </div>`;
        }).join('');
        
        logContent.innerHTML = logHtml || '<div class="text-gray-500">로그가 없습니다.</div>';
        
        // Update stats
        logCount.textContent = filteredLogs.length;
        lastUpdate.textContent = this.logs.length > 0 ? 
            new Date(this.logs[0].timestamp).toLocaleString('ko-KR') : '-';
        
        // Auto scroll to bottom
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    // Clear all logs
    clearLogs() {
        if (confirm('모든 로그를 삭제하시겠습니까?')) {
            this.logs = [];
            this.renderLogs();
            this.addLog('info', '로그가 수동으로 삭제되었습니다.');
        }
    }
    
    // Export logs to file
    exportLogs() {
        try {
            const logText = this.logs.map(log => {
                const time = new Date(log.timestamp).toLocaleString('ko-KR');
                const details = log.details ? `\n상세: ${JSON.stringify(log.details, null, 2)}` : '';
                return `[${time}] [${log.level.toUpperCase()}] ${log.message}${details}`;
            }).join('\n\n');
            
            const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `network-monitor-logs-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.addLog('info', '로그를 파일로 내보냈습니다.');
        } catch (error) {
            this.addLog('error', '로그 내보내기 실패', error.message);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.networkMonitor = new NetworkMonitor();
});

// Handle page visibility change to pause/resume monitoring
document.addEventListener('visibilitychange', () => {
    if (window.networkMonitor) {
        if (document.hidden) {
            // Page is hidden, could pause monitoring
            console.log('Page hidden - monitoring continues');
        } else {
            // Page is visible, ensure monitoring is active
            console.log('Page visible - monitoring active');
        }
    }
});