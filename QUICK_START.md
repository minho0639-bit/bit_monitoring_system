# 🚀 빠른 시작 가이드

네트워크 모니터링 시스템을 Gmail SMTP와 함께 실행하는 방법을 안내합니다.

## 📋 사전 준비

1. **Gmail 계정 준비**
   - Gmail 계정이 필요합니다
   - 2단계 인증이 활성화되어 있어야 합니다

2. **Gmail 앱 비밀번호 생성**
   - [Google 계정 설정](https://myaccount.google.com/) → 보안 → 앱 비밀번호
   - "메일" 앱 선택 후 16자리 비밀번호 생성

## ⚡ 빠른 실행

### 1단계: 의존성 설치
```bash
npm install
```

### 2단계: 환경 변수 설정
`.env` 파일을 열고 Gmail 정보를 입력하세요:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
PORT=8080
NODE_ENV=development
```

### 3단계: 서버 실행
```bash
npm start
```

### 4단계: 브라우저에서 접속
```
http://localhost:8080
```

## 🔧 이메일 설정

1. **설정 버튼 클릭**
2. **다음 정보 입력:**
   - SMTP 서버: `smtp.gmail.com`
   - SMTP 포트: `587`
   - 사용자명: `your-email@gmail.com`
   - 비밀번호: `앱 비밀번호` (16자리)
   - 발신자 이메일: `your-email@gmail.com`
   - 수신자 이메일: `admin@company.com, ops@company.com`

3. **연결 테스트 클릭**
4. **설정 저장**

## ✅ 테스트

1. **호스트 추가**
   - "호스트 추가" 버튼 클릭
   - IP 주소 입력 (예: 8.8.8.8)
   - 이메일 알람 활성화

2. **모니터링 확인**
   - 호스트 상태가 자동으로 체크됩니다
   - 오프라인 상태가 되면 이메일 알림이 발송됩니다

## 🆘 문제 해결

### 서버가 시작되지 않는 경우
```bash
# 포트 충돌 시 다른 포트 사용
PORT=8081 npm start
```

### 이메일 발송이 안 되는 경우
1. Gmail 2단계 인증이 활성화되어 있는지 확인
2. 앱 비밀번호를 올바르게 입력했는지 확인
3. 시스템 로그에서 오류 메시지 확인

### 브라우저에서 접속이 안 되는 경우
1. 서버가 정상적으로 실행되고 있는지 확인
2. 방화벽이 포트를 차단하지 않는지 확인
3. `http://localhost:8080` 대신 `http://127.0.0.1:8080` 시도

## 📚 추가 정보

- **상세 설정 가이드**: `GMAIL_SETUP_GUIDE.md` 참조
- **프로젝트 문서**: `README.md` 참조
- **로그 확인**: 웹 인터페이스의 "로그" 버튼 클릭

---

**🎉 축하합니다!** 이제 Gmail SMTP를 사용한 네트워크 모니터링 시스템이 준비되었습니다.