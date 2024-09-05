import { pgTable, serial, text, date, varchar, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: serial('id').primaryKey().unique(), 
    firstName: varchar('first_name', { length: 255 }),
    lastName: varchar('last_name', { length: 255 }),
    telegramId: text('telegram_id'), 
    language: varchar('language', { length: 255 }),
    phoneNumber: varchar('phone_number', { length: 255 }),
    email: varchar('email', { length: 255 }),
});

export const reports = pgTable('reports', {
    id: serial('id').primaryKey(),
    reportText: text('report_text'),
    department: varchar('department', { length: 255 }),
    userId: integer('user_id').references(() => users.id),
    receiver: varchar('receiver', { length: 255 }),
    receiverAnswer: text('receiver_answer'),
    photoUrls: text('photo_urls').array(),
    videoUrl: varchar('video_url', { length: 255 }),
    dateReport: date('date_report'),
    dateResponse: date('date_response'),
    status: varchar('status', { length: 255 }),
});

export const executors = pgTable('executors', {
    id: serial('id').primaryKey(),
    surnameName: varchar('surname_name', { length: 255 }),
    telegramAcc: varchar('telegram_acc', { length: 255 }),
});

// TypeScript types remain the same
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type Executor = typeof executors.$inferSelect
export type NewExecutor = typeof executors.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert