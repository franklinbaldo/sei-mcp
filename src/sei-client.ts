import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as iconv from 'iconv-lite';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

export interface SeiConfig {
    baseUrl: string;
    cookieString: string;
}

export class SeiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(config: SeiConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Cookie': config.cookieString,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            responseType: 'arraybuffer', // Important for manual decoding
            maxRedirects: 5,
            validateStatus: (status) => status >= 200 && status < 400
        });
    }

    /**
     * Makes a request to SEI and returns the decoded HTML string.
     */
    async request(params: any, method: 'GET' | 'POST' = 'GET', data?: any): Promise<string> {
        try {
            const config: AxiosRequestConfig = {
                method,
                params,
                data
            };

            // If POSTing form data, ensure it's properly stringified if it's a URLSearchParams object or string
            // Axios handles objects automatically but for x-www-form-urlencoded usually URLSearchParams is best.
            if (method === 'POST' && data && typeof data === 'object' && !(data instanceof URLSearchParams)) {
                 const formData = new URLSearchParams();
                 for (const key in data) {
                     formData.append(key, data[key]);
                 }
                 config.data = formData;
            }

            const response = await this.client('controlador.php', config);
            
            // SEI typically uses ISO-8859-1. Decode accordingly.
            const decoded = iconv.decode(Buffer.from(response.data), 'iso-8859-1');
            return decoded;
        } catch (error) {
            console.error('Request failed:', error);
            throw new Error('Failed to communicate with SEI');
        }
    }
    
    /**
     * Raw request for binary data
     */
    async requestRaw(params: any): Promise<{ data: Buffer, headers: any }> {
         const response = await this.client('controlador.php', {
             method: 'GET',
             params,
             responseType: 'arraybuffer'
         });
         return {
             data: Buffer.from(response.data),
             headers: response.headers
         };
    }
}
