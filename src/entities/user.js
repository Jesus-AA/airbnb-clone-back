/* eslint-disable object-curly-spacing */
import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
	name: String,
	email: { type: String, unique: true },
	password: String,
});

export const UserModel = model('User', UserSchema, 'users');
