export default {
  earlyAccess: true,
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://dummy@localhost:5432/dummy'
  }
}
