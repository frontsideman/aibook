const db = require("@prisma/client");

const prisma = new db.PrismaClient();

module.exports = {
  prisma,
  ...db,
};
