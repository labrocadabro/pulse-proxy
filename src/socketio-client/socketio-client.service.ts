import { Injectable } from '@nestjs/common';
import { io } from 'socket.io-client';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as child_process from 'child_process';
import { RpcService } from 'orca-pulse';

const exec = util.promisify(child_process.exec);

// Read the SSL certificate
// const certificate = fs.readFileSync('./ssl/RootCA.crt');

// Utility function to get all files from a folder
const _getAllFilesFromFolder = function (
  root: string,
  dirPath: string,
): string[] {
  dirPath = path.join(root, dirPath);
  let files: string[] = [];
  fs.readdirSync(dirPath).forEach((file) => {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      files = files.concat(_getAllFilesFromFolder(root, fullPath));
    } else {
      files.push(fullPath);
    }
  });
  return files;
};

// Stream file reading function
function readFileStream(filePath: string) {
  const fullPath = path.join('/out', filePath);
  if (!fs.existsSync(fullPath)) throw 'File not found in /out';
  return {
    stream: fs.createReadStream(fullPath),
    status: 200,
  };
}

// Stream file writing function
function writeFileStream(
  data: any,
  fileStream: NodeJS.ReadableStream,
  fileName: string,
) {
  const fullPath = path.join('/in', fileName);
  fileStream.pipe(fs.createWriteStream(fullPath));
  return { status: 200 };
}

// HTTP request function
async function httpCall(urlPath: string, options: any) {
  console.log('HTTP request method:', options.method);
  console.log('HTTP body:', options.body);
  try {
    const response = await fetch(`http://127.0.0.1:8080/${urlPath}`, options);
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    if (!response.ok) throw { status: response.status, error: data };
    return data;
  } catch (error) {
    console.log('HTTP request error:', error);
    throw { error };
  }
}

// Pulse Proxy network function
function joinPulseProxyNetwork(settings: any) {
  const configPath = path.join(__dirname, '/pulseNetworkClient.toml');
  const configContent = fs
    .readFileSync(configPath, 'utf8')
    .replace('{serverAddr}', settings.serverAddr)
    .replace('{serverPort}', settings.serverPort)
    .replace('{domain}', settings.customDomain)
    .replace('{proxyName}', settings.ORCA_POD_ID);
  fs.writeFileSync(
    path.join(__dirname, '/pulseNetworkClientToRun.toml'),
    configContent,
  );
  exec(`${configPath} -c ${configPath}`);
}

// Socket.io Client Service class
@Injectable()
export class SocketioClientService {
  private socket;
  private rpcService;

  constructor() {
    const orcaUrl = process.env.ORCA_URL;
    const orcaApiKey = process.env.ORCA_API_KEY;
    const orcaPodId = process.env.ORCA_POD_ID;

    this.socket = io(orcaUrl, {
      auth: {
        orcaApiKey,
        orcaUrl,
        connectionType: 'pulse_proxy',
      },
      // ca: certificate,
    });

    this.rpcService = new RpcService(this.socket);
    this.socket.on('connect', () => {
      try {
        console.log('Connected to socket successfully');
        this.socket.emit('pulse_proxy:init_success', { podId: orcaPodId });
      } catch (error) {
        console.log('Pulse proxy initialization error:', error);
        this.socket.emit('pulse_proxy:init_error', { error, podId: orcaPodId });
      }
    });
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    this.socket.on('error', (error) => {
      console.log('Socket error:', error);
    });
    this.socket.on('connect_error', (error) => {
      console.log('Connection error:', error);
    });

    // Register RPC methods
    this.rpcService.bindFn('getFileList', _getAllFilesFromFolder);
    this.rpcService.bindFn('readFileStream', readFileStream);
    this.rpcService.bindFn('writeFileStream', writeFileStream);
    this.rpcService.bindFn('httpCall', httpCall);
    this.rpcService.bindFn('joinPulseProxyNetwork', joinPulseProxyNetwork);
    this.rpcService.bindFn('auditDistribution', this.auditDistribution);
  }

  // Sample RPC method to audit distribution
  async auditDistribution(taskId: string) {
    console.log('calling auditDistribution for taskId:', taskId);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ auditSuccess: true, auditors: [1, 2, 3] });
      }, 5000);
    });
  }

  // Socket emit function
  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}
