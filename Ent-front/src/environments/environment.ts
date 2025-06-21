export const environment = {
  production: false,
  uploadApiUrl: 'http://192.168.1.90:8000',
  downloadApiUrl: 'http://192.168.1.90:8001',
  calenderApiUrl: 'http://192.168.1.90:8002',
  authApiUrl: 'http://192.168.1.90:8003',  messagingApiUrl: 'http://192.168.1.90:8004',  // Added separate messaging API URL
  wsUrl: 'ws://192.168.1.90:8004/api/ws',  // Updated WebSocket URL to use messaging service port
  chatApiUrl: 'http://192.168.1.90:2001',  // API URL for the chat service
  maxUploadSize: 50 * 1024 * 1024, // 50MB in bytes
  googleApiKey: 'AIzaSyCiRJvlH4Z6WKWoBTUDdRZQPLMjVPVC0dM',
  googleClientId: '375072805117-iqaq4q78kknu3manmqkato6s6umjqj2v.apps.googleusercontent.com',
  publicCalendarId: 'YOUR_PUBLIC_CALENDAR_ID@group.calendar.google.com'
};