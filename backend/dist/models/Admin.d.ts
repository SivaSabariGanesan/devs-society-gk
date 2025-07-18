import mongoose, { Document } from 'mongoose';
export interface IAdmin extends Document {
    username: string;
    email: string;
    password: string;
    fullName: string;
    role: 'super-admin' | 'admin';
    assignedCollege?: mongoose.Types.ObjectId;
    permissions: string[];
    tenureInfo?: {
        startDate: Date;
        endDate?: Date;
        isActive: boolean;
    };
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}
declare const _default: mongoose.Model<IAdmin, {}, {}, {}, mongoose.Document<unknown, {}, IAdmin> & IAdmin & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Admin.d.ts.map