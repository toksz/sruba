import { vi } from 'vitest';
import { EventEmitter } from 'events';

// Mock EventEmitter
vi.mock('events', () => {
  return {
    EventEmitter: class MockEventEmitter {
      private listeners: Map<string, Function[]> = new Map();

      on(event: string, listener: Function) {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
      }

      once(event: string, listener: Function) {
        const onceWrapper = (...args: any[]) => {
          this.off(event, onceWrapper);
          listener.apply(this, args);
        };
        this.on(event, onceWrapper);
      }

      emit(event: string, ...args: any[]) {
        const listeners = this.listeners.get(event);
        if (listeners) {
          listeners.forEach(listener => listener.apply(this, args));
        }
      }

      off(event: string, listener: Function) {
        const listeners = this.listeners.get(event);
        if (listeners) {
          const index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      }

      removeAllListeners() {
        this.listeners.clear();
      }
    }
  };
});
