import { pgTable, serial, text, date, varchar } from 'drizzle-orm/pg-core';

// Define the main 'reports' table
export const reports = pgTable('reports', {
    id: serial('id').primaryKey(), // id - int
    reportText: text('report_text'), // report_text - string
    department: varchar('department', { length: 255 }), // department - string
    sender: varchar('sender', { length: 255 }), // sender - string
    receiver: varchar('receiver', { length: 255 }), // receiver - string
    receiverAnswer: text('receiver_answer'), // receiver_answer - string
    photoUrls: text('photo_urls').array(), // photo_urls - string[]
    videoUrl: varchar('video_url', { length: 255 }), // video_url - string
    dateReport: date('date_report'), // date_report - date
    dateResponse: date('date_response'), // date_response - date
    status: varchar('status', { length: 255 }), // status - string
});

// Define the 'исполнители' (executors) table
export const executors = pgTable('executors', {
    id: serial('id').primaryKey(), // id - int
    surnameName: varchar('surname_name', { length: 255 }), // surname_name - string
    telegramAcc: varchar('telegram_acc', { length: 255 }), // telegram_acc - string
});

// TypeScript types for the 'reports' table
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert

// TypeScript types for the 'executors' table
export type Executor = typeof executors.$inferSelect
export type NewExecutor = typeof executors.$inferInsert
