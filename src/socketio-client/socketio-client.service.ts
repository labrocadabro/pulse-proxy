import { Injectable } from '@nestjs/common';
import { io } from 'socket.io-client';
// import { ConfigService } from '@nestjs/config';
// import { v4 as uuidv4 } from 'uuid';
import { RpcService } from '@orcacompute/orca-node-client';
// import fs from 'file-system'
// import path from "path"
import path from 'path';
import fs from 'fs';
// import ss from 'socket.io-stream';

// import util from 'util';
// import child_process from 'child_process';
// const exec = util.promisify(child_process.exec);

// import { Client } from '@bnb-chain/greenfield-js-sdk';
// const fsPromises = require('fs').promises;
// import { getCheckSums } from '@bnb-chain/greenfiled-file-handle'

// const certificate = fs.readFileSync('./ssl/RootCA.crt');

// const PendingRpcCalls = {};

const _getAllFilesFromFolder = function (fnName, dirPath) {
  dirPath = path.join('/out', dirPath);

  let results = [];
  fs.readdirSync(dirPath).forEach(function (file) {
    file = dirPath + '/' + file;
    const stat = fs.statSync(file);

    if (stat && stat.isDirectory()) {
      results = results.concat(
        _getAllFilesFromFolder(fnName, { dirPath: file }),
      );
    } else results.push(file);
  });

  return results;
};

// const client = Client.create('https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org', '5600');
// const bucketName = process.env.ORCA_BNB_BUCKET_NAME;
// const accountAddress = process.env.ORCA_BNB_ACCOUNT_ADDRESS;
// const accountKey = process.env.ORCA_BNB_ACCOUNT_KEY

// console.log(bucketName, accountAddress, accountKey)

// async function createBnbObject(fnName) {
//     const dirToWatch = '/in'
//     try {
//         //2. Watch folder
//         const watcher = fsPromises.watch(dirToWatch);
//         // event: {eventType, filename}
//         for await (const event of watcher) {
//             const { eventType, filename } = event;
//             //3. Respond to Creation inside the folder
//             console.log("\nThe file", filename, "was modified!");
//             console.log("The type of change was:", eventType);

//             // 4. Read the changed file into fileBuffer (inMemory)
//             const filePath = path.join(dirToWatch, filename)
//             const fileBytes = await fsPromises.readFile(filePath);
//             // 5. Calculate Checksums of the fileBuffer
//             const hashResult = await getCheckSums(
//                 new Uint8Array(fileBytes),
//             );
//             const { contentLength, expectCheckSums } = hashResult;
//             console.log(contentLength, expectCheckSums)

//             // 6. Create Object in the bucket (NOT UPLOAD)
//             const filenameAndext = filename.split('.')
//             const objectName = filenameAndext[0]
//             const createObjectTx = await client.object.createObject(
//                 {
//                     bucketName: bucketName,
//                     objectName: objectName,
//                     creator: accountAddress,
//                     visibility: 'VISIBILITY_TYPE_PRIVATE',
//                     fileType: 'txt',
//                     redundancyType: 'REDUNDANCY_EC_TYPE',
//                     contentLength,
//                     expectCheckSums: JSON.parse(expectCheckSums),
//                 },
//                 {
//                     type: 'ECDSA',
//                     privateKey: accountKey,
//                 },
//             );

//             const simulateInfo = await createObjectTx.simulate({
//                 denom: 'BNB',
//             });

//             console.log('simulateInfo', simulateInfo);

//             const resObjBrod = await createObjectTx.broadcast({
//                 denom: 'BNB',
//                 gasLimit: Number(simulateInfo?.gasLimit),
//                 gasPrice: simulateInfo?.gasPrice || '5000000000',
//                 payer: accountAddress,
//                 granter: '',
//                 privateKey: accountKey
//             });

//             console.log('resObjBrod', resObjBrod);

//             // 7. Upload object data to the created object before
//             const uploadRes = await client.object.uploadObject(
//                 {
//                     bucketName: bucketName,
//                     objectName: objectName,
//                     body: fileBytes,
//                     txnHash: resObjBrod.transactionHash,
//                 },
//                 {
//                     type: 'ECDSA',
//                     privateKey: accountKey,
//                 },
//             );
//             console.log('uploadRes', uploadRes);
//         }
//     } catch (err) {
//         // TODO: catch and log errors
//         if (err.code === 'EISDIR') {
//             console.error("Do not watch for the recusive folders")
//         } else {
//             console.error(err)
//         }
//     }
// }

// // 1. how do we upload files greater than the RAM size ? Here we are loading each file into memory before uploading
// // 2. We have a backend service which needs to act on the user's behalf, how do we authenticate without private key for that ? or is private key fine there since that means user is asking us to handle their wallet.

function readFileStream(fnName, filePath = null) {
  if (filePath === null) {
    throw 'No filePath path';
  }

  // filePath = path.join(process.cwd(),'/out', filePath)
  filePath = path.join('/out', filePath);
  // console.log("logging file path",filePath)
  let fileExists = fs.existsSync(filePath);
  // String(filePath)
  // console.log("fileExists value", fileExists)
  let fileStream: any;
  if (fileExists) {
    fileStream = fs.createReadStream(filePath);
    //    let fileSize = fs.statSync(filePath)
  } else {
    throw 'File not found in /out';
  }
  return { stream: fileStream, status: 200 };
}

function writeFileStream(fnName, stream, fnArgs) {
  console.log('writeFilestreamData', fnArgs);

  let filePath = path.join('/in', fnArgs.fileName);

  stream.pipe(fs.createWriteStream(filePath));
  // stream.pipe(fs.createWriteStream(fnArgs.fileName));

  return { status: 200 };
}

async function httpCall(name: string, reqArgs: any = {}) {
  try {
    // Ensure reqArgs has the required properties
    const requestOptions = {
      method: reqArgs.method || 'GET',
      headers: {
        ...(reqArgs.headers || {}),
        // Add default headers if needed
        ...(reqArgs.body ? { 'Content-Type': 'application/json' } : {}),
      },
      // Only include body for non-GET requests
      ...(reqArgs.method !== 'GET' && reqArgs.body
        ? { body: reqArgs.body }
        : {}),
    };

    console.log(`http method: ${requestOptions.method}`);
    console.log(`http body: ${requestOptions.body || 'none'}`);
    console.log(`http request name: ${name}`);
    console.log(`http request args: ${JSON.stringify(requestOptions)}`);

    const response: any = await fetch(
      `http://127.0.0.1:8080/${name}`,
      requestOptions,
    );

    const contentType = response.headers.get('content-type');
    console.log('httpCall response:', response);
    console.log('podcall contentType is:', contentType);

    // Extract response based on content-type
    let result;
    if (!contentType) {
      result = await response.json();
    } else if (contentType.includes('application/json')) {
      result = await response.json();
    } else if (contentType.includes('application/text')) {
      result = await response.text();
    } else {
      result = await response.text();
    }

    if (!response.ok) {
      // Return error response consistently
      return {
        status: response.status,
        data: { error: result.error || result },
      };
    }

    // Return success response consistently
    return {
      status: response.status,
      data: result,
    };
  } catch (error) {
    console.log('ERROR:', error);
    return {
      status: 500,
      data: { error: error.message || 'Internal server error' },
    };
  }
}

// function healthCheck(){

//     return {status:200}
// }
@Injectable()
export class SocketioClientService {
  private socket: any;
  public rpcService: RpcService;

  constructor() {
    const orcaUrl = process.env.ORCA_URL;
    const orcaApiKey = process.env.ORCA_API_KEY;
    const podId = process.env.ORCA_POD_ID;

    this.socket = io(orcaUrl, {
      auth: {
        orcaApiKey: orcaApiKey,
        orcaUrl: orcaUrl,
        connectionType: 'pulse_proxy',
      },
      ca: process.env.ORCA_SSL_ROOT_CA,
    });

    this.rpcService = new RpcService(this.socket);

    this.socket.on('connect', () => {
      try {
        this.socket.emit('pulse_proxy:init_success', { podId });
      } catch (error) {
        console.log('calling pulse-proxy error');
        console.log('Error before pulse-proxy init');
        this.socket.emit('pulseproxy:init_error', { error, podId });
      }
    });

    this.rpcService.bindFn('readFileStream', readFileStream);
    this.rpcService.bindFn('writeFileStream', writeFileStream);
    this.rpcService.bindFn('getFileList', _getAllFilesFromFolder);
    // this.rpcService.bindFn('createBnbObject', createBnbObject)
    this.rpcService.bindFn('*', httpCall);

    // this.rpcService.bindFn("healthz",healthCheck)
    // this.rpcService.bindFn("writeFileStream")

    this.rpcService.bindFn('auditDistribution', (name, { taskId }) => {
      console.log('calling auditDistribution for taskId: ' + taskId);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({
            auditSuccess: true,
            auditors: [1, 2, 3],
          });
        }, 10000);
      });
    });

    setTimeout(() => {
      this.rpcService
        .callFn('getRoundNumber', { taskId: podId })
        .then((rpcResponse) => console.log(rpcResponse));
    }, 4000);

    setTimeout(() => {
      this.rpcService
        .callFn('getSubmissions', { taskId: podId })
        .then((rpcResponse) => console.log(rpcResponse));
    }, 8000);
  }

  public emit(room: string, msg: string): void {
    this.socket.emit(room, msg);
  }
}
