import mongoose, { Schema, Document } from "mongoose";

export interface IPermission extends Document {
  name: string;
  module: string; // marketing, sales, support, social, processes, security, academy
  action: string; // create, read, update, delete, manage
  description?: string;
}

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: mongoose.Types.ObjectId[];
  isSystem: boolean; // Roles do sistema não podem ser deletadas
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      enum: ["marketing", "sales", "support", "social", "processes", "security", "academy", "dashboard", "users"],
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "read", "update", "delete", "manage"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: false,
    collection: "permissions",
  }
);

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "roles",
  }
);

export const Permission = mongoose.model<IPermission>("Permission", PermissionSchema);
export const Role = mongoose.model<IRole>("Role", RoleSchema);





