"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const client_1 = require("@prisma/client");
const connection = new client_1.PrismaClient();
exports.connection = connection;
