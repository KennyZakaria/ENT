export const environment = {
  production: false,
  uploadApiUrl: 'http://localhost:8000',
  downloadApiUrl: 'http://localhost:8001',
  calenderApiUrl: 'http://localhost:8002',
  authApiUrl: 'http://localhost:8003',  messagingApiUrl: 'http://localhost:8004',  // Added separate messaging API URL
  wsUrl: 'ws://localhost:8004/api/ws',  // Updated WebSocket URL to use messaging service port
  chatApiUrl: 'http://localhost:2001',  // API URL for the chat service
  maxUploadSize: 50 * 1024 * 1024, // 50MB in bytes
  googleApiKey: 'AIzaSyCiRJvlH4Z6WKWoBTUDdRZQPLMjVPVC0dM',
  googleClientId: '375072805117-iqaq4q78kknu3manmqkato6s6umjqj2v.apps.googleusercontent.com',
  publicCalendarId: 'YOUR_PUBLIC_CALENDAR_ID@group.calendar.google.com'
};