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
}

// Arrow Function to encode user data into protobuf binary format
export const encodeUserList = (users) => {
    const userList = {
        users: users.map(user => ({
            id: user.id,
            email: user.email,
            email_hash: user.email_hash,
            role: user.role,
            status: user.status,
            created_at: user.created_at,
            signature: user.signature
        }))
    };
    const failedToVerifyMsg = UserList.verify(userList);
    if (failedToVerifyMsg) {
        throw new Error(`Protobuf failed to verify: ${failedToVerifyMsg}`);
    }

    const message = UserList.create(userList);
    return UserList.encode(message).finish();
}

// Arrow Function to decode protobuf binary data back into user objects
export const decodeUserList = (buffer) => {
    try {
        const message = UserList.decode(buffer);
        return UserList.toObject(message, {
            bytes: Buffer,
            longs: Number,
            defaults: true,
            arrays: true,
            objects: true
        });

    } catch (error) {
        console.error(`Failed to return user objects: ${error.message}`);
        return null;
    }
}
