import { Product, User } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const STORAGE_KEY = 'stockflow_local_data_v1';

export interface AppData {
  products: Product[];
  seaFreightDays: number;
  lastUpdated: string;
}

export const api = {
  // 获取数据 (直接从 LocalStorage)
  fetchData: async (): Promise<AppData> => {
    return new Promise((resolve) => {
      // 模拟微小的加载延迟，让界面过渡更自然
      setTimeout(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            resolve({
              products: parsed.products || INITIAL_PRODUCTS,
              seaFreightDays: parsed.seaFreightDays || 30,
              lastUpdated: parsed.lastUpdated || new Date().toISOString()
            });
          } else {
            // 首次访问，初始化默认数据
            resolve({
              products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
              seaFreightDays: 30,
              lastUpdated: new Date().toISOString()
            });
          }
        } catch (e) {
          console.error("Failed to load data", e);
          // 出错时回退到初始数据
          resolve({
            products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
            seaFreightDays: 30,
            lastUpdated: new Date().toISOString()
          });
        }
      }, 400);
    });
  },

  // 保存数据
  saveData: async (data: AppData): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          resolve(true);
        } catch (e) {
          console.error("Failed to save data", e);
          resolve(false);
        }
      }, 600); // 模拟保存状态的延迟
    });
  },

  // Mock Authentication Methods
  login: async (username: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!username || !password) {
           reject(new Error("请输入用户名和密码"));
           return;
        }
        
        // Demo account
        if (username === 'demo' && password === 'password') {
           resolve({ username: 'Demo User', email: 'demo@stockflow.app' });
           return;
        }

        // Accept any other non-empty credentials for demo purposes
        resolve({ username: username, email: `${username}@example.com` });
      }, 800);
    });
  },

  register: async (username: string, password: string, email: string, code: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!username || !password || !email || !code) {
           reject(new Error("请填写所有字段"));
           return;
        }
        if (code !== '123456') { // Mock code
           reject(new Error("验证码错误"));
           return;
        }
        resolve({ username, email });
      }, 1000);
    });
  },

  sendVerificationCode: async (email: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Verification code sent to ${email}: 123456`);
        resolve(true);
      }, 800);
    });
  },

  resetPassword: async (email: string, code: string, password: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
         if (code !== '123456') {
             reject(new Error("验证码错误"));
             return;
         }
         resolve(true);
      }, 1000);
    });
  }
};