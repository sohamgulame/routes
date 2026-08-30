import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.convoyCallbacks = [];
    this.alertCallbacks = [];
  }

  connect() {
    if (this.client && this.isConnected) return;

    const wsUrl = import.meta.env.VITE_WS_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8080/ws-telemetry' : '/ws-telemetry');
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true;
        console.log('Connected to AURA-NER WebSocket STOMP Broker');

        // Subscribe to live convoy GPS telemetry
        this.client.subscribe('/topic/convoys/live', (message) => {
          try {
            const data = JSON.parse(message.body);
            this.convoyCallbacks.forEach((cb) => cb(data));
          } catch (e) {
            console.error('Error parsing convoy telemetry:', e);
          }
        });

        // Subscribe to real-time disaster & hazard alerts
        this.client.subscribe('/topic/alerts/disruptions', (message) => {
          try {
            const data = JSON.parse(message.body);
            this.alertCallbacks.forEach((cb) => cb(data));
          } catch (e) {
            console.error('Error parsing disruption alert:', e);
          }
        });
      },
      onDisconnect: () => {
        this.isConnected = false;
        console.log('Disconnected from AURA-NER WebSocket');
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  onConvoyUpdate(callback) {
    this.convoyCallbacks.push(callback);
    return () => {
      this.convoyCallbacks = this.convoyCallbacks.filter((cb) => cb !== callback);
    };
  }

  onDisruptionAlert(callback) {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter((cb) => cb !== callback);
    };
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
