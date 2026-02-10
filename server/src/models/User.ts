import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  authProvider?: "email" | "google" | "facebook";
  firebaseId?: string;
  company?: string;
  companyCNPJ?: string;
  avatar?: string;
  cpf?: string;
  birthDate?: Date;
  phone?: string;
  fcmToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  roles?: mongoose.Types.ObjectId[];
  notificationPreferences?: {
    enabled: boolean;
    channels: {
      inApp: boolean;
      push: boolean;
      email: boolean;
    };
    types: {
      marketing: boolean;
      sales: boolean;
      support: boolean;
      social: boolean;
      processes: boolean;
      academy: boolean;
      system: boolean;
    };
    quietHours?: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
  };
  createdAt: Date;
  updatedAt: Date;
  isBlocked?: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      // Opcional para usuários que fazem login apenas com Google
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "facebook"],
      default: "email",
    },
    firebaseId: {
      type: String,
      trim: true,
      sparse: true,
    },
    company: {
      type: String,
      trim: true,
    },
    companyCNPJ: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    cpf: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // Permite múltiplos valores null/undefined, mas valores únicos quando preenchidos
    },
    birthDate: {
      type: Date,
    },
    phone: {
      type: String,
      trim: true,
    },
    fcmToken: {
      type: String,
      trim: true,
    },
    resetPasswordToken: {
      type: String,
      trim: true,
    },
    resetPasswordExpires: {
      type: Date,
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    notificationPreferences: {
      enabled: {
        type: Boolean,
        default: true,
      },
      channels: {
        inApp: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: false,
        },
      },
      types: {
        marketing: {
          type: Boolean,
          default: true,
        },
        sales: {
          type: Boolean,
          default: true,
        },
        support: {
          type: Boolean,
          default: true,
        },
        social: {
          type: Boolean,
          default: true,
        },
        processes: {
          type: Boolean,
          default: true,
        },
        academy: {
          type: Boolean,
          default: true,
        },
        system: {
          type: Boolean,
          default: true,
        },
      },
      quietHours: {
        enabled: {
          type: Boolean,
          default: false,
        },
        start: {
          type: String,
          default: "22:00",
        },
        end: {
          type: String,
          default: "08:00",
        },
      },
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);

