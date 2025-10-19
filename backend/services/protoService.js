import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let UserList;

// Arrow Function to Locate, load and compile the protobuf schema
export const loadUserProtoSchema = async () => {
  const protoPath = path.join(__dirname, '..', 'proto', 'user.proto');
  const root = await protobuf.load(protoPath);
  UserList = root.lookupType('admin.UserList');
  if (!UserList) throw new Error('Failed to locate admin.UserList in proto');
}

// Arrow Function to encode user data into protobuf binary format
// Reference: https://protobufjs.github.io/protobuf.js/manual.html#encoding
export const encodeUserList = (users) => {
  if (!UserList) throw new Error('UserList proto not loaded (call loadUserProtoSchema first)');

  const payload = {
    users: users.map(u => {
      const h = u.email_hash;
      let emailHashBuf = Buffer.alloc(0);
      if (h == null) {
        emailHashBuf = Buffer.alloc(0);
      } else if (Buffer.isBuffer(h)) {
        emailHashBuf = h;
      } else if (Array.isArray(h)) {
        emailHashBuf = Buffer.from(h);
      } else if (typeof h === 'string') {
        const s = h.trim();
        const isBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(s) && (s.length % 4 === 0);
        const isHex = /^[0-9a-fA-F]+$/.test(s) && (s.length % 2 === 0);
        if (isHex && s.length >= 2) emailHashBuf = Buffer.from(s, 'hex');
        else if (isBase64) emailHashBuf = Buffer.from(s, 'base64');
        else emailHashBuf = Buffer.from(s, 'utf8');
      } else {
        emailHashBuf = Buffer.alloc(0);
      }

      const sig = u.signature;
      let sigBuf = Buffer.alloc(0);
      if (sig == null) {
        sigBuf = Buffer.alloc(0);
      } else if (Buffer.isBuffer(sig)) {
        sigBuf = sig;
      } else if (Array.isArray(sig)) {
        sigBuf = Buffer.from(sig);
      } else if (typeof sig === 'string') {
        try { sigBuf = Buffer.from(sig, 'base64'); } catch { sigBuf = Buffer.from(sig, 'utf8'); }
      } else {
        sigBuf = Buffer.alloc(0);
      }

      // Used both snake_case and camelCase to ensure protobufjs maps the bytes field correctly
      return {
        id: u.id,
        email: u.email,
        email_hash: emailHashBuf,
        // duplicate in camelCase as some internal representations may reference this
        emailHash: emailHashBuf,
        role: u.role,
        status: u.status,
        created_at: u.created_at,
        // duplicate in camelCase as some internal representations may reference this
        createdAt: u.created_at,
        signature: sigBuf
      };
    })
  };

  const err = UserList.verify(payload);
  if (err) throw new Error(`Invalid user list for protobuf: ${err}`);

  const message = UserList.create(payload);

  const encoded = UserList.encode(message).finish();

  return encoded;
};

