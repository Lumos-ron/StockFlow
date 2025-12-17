import { Product, User } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
// @ts-ignore
import emailjs from '@emailjs/browser';

// ============================================================
// CONFIGURATION: 请替换为你自己的 EmailJS 凭证
// ============================================================
const EMAILJS_SERVICE_ID = 'service_39ge3qw';
const EMAILJS_TEMPLATE_ID = 'template_esn0byn';
const EMAILJS_PUBLIC_KEY: string = 'rnzFeuTFCLR9mD9ho';
// ============================================================

// 模拟网络延迟 (ms)
const NETWORK_DELAY = 600;

// 本地存储键名配置 (在真实应用中，这些数据存储在服务器数据库)
const DB_USERS_KEY = 'stockflow_cloud_users';
const DB_DATA_PREFIX = 'stockflow_cloud_data_';

// 内存中临时存储验证码 (Email -> Code)
// 注意：在纯前端项目中，验证码逻辑暴露在客户端是不安全的。
// 生产环境应由后端生成并发送验证码。
const verificationCodes = new Map<string, string>();

// 模拟数据库接口
export interface CloudData {
  products: Product[];
  seaFreightDays: number;
  lastUpdated: string;
}

// 模拟后端数据库操作辅助函数
const db = {
  getUsers: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem(DB_USERS_KEY) || '[]');
    } catch { return []; }
  },
  saveUser: (user: any) => {
    const users = db.getUsers();
    // 如果用户已存在（比如重置密码场景），更新它
    const existingIndex = users.findIndex((u: any) => u.username === user.username);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.push(user);
    }
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));
  },
  getUserData: (username: string): CloudData | null => {
    try {
      const data = localStorage.getItem(DB_DATA_PREFIX + username);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },
  saveUserData: (username: string, data: CloudData) => {
    localStorage.setItem(DB_DATA_PREFIX + username, JSON.stringify(data));
  }
};

export const api = {
  // 发送验证码 (使用 EmailJS)
  sendVerificationCode: async (email: string): Promise<boolean> => {
    // 初始化 EmailJS
    if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.error("请在 services/api.ts 中配置 EmailJS 凭证");
        // 如果未配置，回退到 Console 模式以便测试
        return new Promise((resolve) => {
             const code = Math.floor(100000 + Math.random() * 900000).toString();
             verificationCodes.set(email, code);
             console.group('📧 [未配置EmailJS - 模拟模式]');
             console.log(`请在代码中配置真实 Key 以发送邮件。`);
             console.log(`验证码: ${code}`);
             console.groupEnd();
             setTimeout(() => resolve(true), 1000);
        });
    }

    try {
        emailjs.init(EMAILJS_PUBLIC_KEY);
        
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        verificationCodes.set(email, code); // 存储到内存以供后续验证

        // 这里的参数必须与你在 EmailJS 模板中设置的变量名一致
        // to_email: 对应模板设置中的 To Email
        // code: 对应模板正文中的 {{code}}
        const templateParams = {
            to_email: email,
            code: code,
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );

        if (response.status === 200) {
            console.log('Email sent successfully!');
            return true;
        } else {
            throw new Error('Email service returned status ' + response.status);
        }
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error('验证码发送失败，请检查邮箱或稍后重试');
    }
  },

  // 登录 (支持用户名或邮箱)
  login: async (identifier: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = db.getUsers();
        const user = users.find((u: any) => 
          (u.username === identifier || u.email === identifier) && u.password === password
        );
        if (user) {
          resolve({ username: user.username, email: user.email });
        } else {
          reject(new Error('账号或密码错误'));
        }
      }, NETWORK_DELAY);
    });
  },

  // 注册 (包含邮箱验证)
  register: async (username: string, password: string, email: string, code: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 1. 验证验证码
        const storedCode = verificationCodes.get(email);
        if (!storedCode || storedCode !== code) {
          reject(new Error('验证码错误或已过期'));
          return;
        }

        const users = db.getUsers();
        // 2. 检查用户名是否存在
        if (users.find((u: any) => u.username === username)) {
          reject(new Error('该用户名已被注册'));
          return;
        }
        // 3. 检查邮箱是否已被使用
        if (users.find((u: any) => u.email === email)) {
          reject(new Error('该邮箱已被注册'));
          return;
        }

        // 4. 创建用户
        db.saveUser({ username, password, email });
        
        // 5. 初始化新用户数据
        const initialData: CloudData = {
          products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
          seaFreightDays: 30, // 默认值
          lastUpdated: new Date().toISOString()
        };
        db.saveUserData(username, initialData);
        
        // 6. 清除验证码
        verificationCodes.delete(email);

        resolve({ username, email });
      }, NETWORK_DELAY);
    });
  },

  // 重置密码
  resetPassword: async (email: string, code: string, newPassword: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 1. 验证验证码
        const storedCode = verificationCodes.get(email);
        if (!storedCode || storedCode !== code) {
          reject(new Error('验证码错误或已过期'));
          return;
        }

        const users = db.getUsers();
        const userIndex = users.findIndex((u: any) => u.email === email);
        
        if (userIndex === -1) {
          reject(new Error('未找到该邮箱对应的账号'));
          return;
        }

        // 2. 更新密码
        users[userIndex].password = newPassword;
        localStorage.setItem(DB_USERS_KEY, JSON.stringify(users));

        // 3. 清除验证码
        verificationCodes.delete(email);

        resolve(true);
      }, NETWORK_DELAY);
    });
  },

  // 获取用户数据
  fetchData: async (username: string): Promise<CloudData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = db.getUserData(username);
        if (data) {
          resolve(data);
        } else {
          // 如果没有数据，返回默认初始化数据
          resolve({
            products: JSON.parse(JSON.stringify(INITIAL_PRODUCTS)),
            seaFreightDays: 30,
            lastUpdated: new Date().toISOString()
          });
        }
      }, NETWORK_DELAY);
    });
  },

  // 保存用户数据 (自动同步)
  saveData: async (username: string, data: CloudData): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        db.saveUserData(username, data);
        resolve(true);
      }, 400); // 保存通常比读取快一点
    });
  }
};