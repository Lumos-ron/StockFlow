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
    // 检查库是否加载
    if (!emailjs) {
        console.error("EmailJS SDK failed to load.");
        throw new Error('系统组件加载失败，请刷新页面重试');
    }

    if (!email || !email.includes('@')) {
       throw new Error('邮箱地址无效');
    }

    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 这里的参数必须与你在 EmailJS 模板中设置的变量名一致
        // 为防止配置不同，我们同时发送常用的变量名，确保能匹配到模板中的 To Email 设置
        const templateParams = {
            to_email: email,    // 常用：目标邮箱变量
            user_email: email,  // 备用：有时候用户命名为 user_email
            email: email,       // 备用：有时候直接用 email
            reply_to: email,    // 常用：回复地址
            code: code,
            message: `您的验证码是: ${code}`, // 以防模板使用 {{message}}
        };

        console.log('Sending email via EmailJS...', {
            serviceId: EMAILJS_SERVICE_ID,
            templateId: EMAILJS_TEMPLATE_ID,
            publicKey: '***' + EMAILJS_PUBLIC_KEY.slice(-4),
            params: templateParams
        });

        // 显式传递 Public Key 作为第四个参数
        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('EmailJS Response:', response);

        if (response.status === 200) {
            verificationCodes.set(email, code); // 仅在发送成功后存储
            console.log('Email sent successfully!');
            return true;
        } else {
            throw new Error(`Email service returned status ${response.status}: ${response.text}`);
        }
    } catch (error: any) {
        console.error('Failed to send email:', error);
        
        // 健壮的错误解析逻辑
        let msg = '未知错误';
        
        if (error?.text) {
             // EmailJS 返回的错误对象通常包含 text 字段
             msg = `${error.text} (Status: ${error.status || 'Unknown'})`;
        } else if (error instanceof Error) {
             // 标准 JS Error
             msg = error.message;
        } else if (typeof error === 'string') {
             // 字符串错误
             msg = error;
        } else {
             // 尝试 JSON 序列化其他类型的对象
             try {
                 msg = JSON.stringify(error);
             } catch (e) {
                 msg = '无法解析的错误对象';
             }
        }
        
        throw new Error(`验证码发送失败: ${msg}`);
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