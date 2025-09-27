import dotenv from 'dotenv'
import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import Adapter, { Database, Resource } from '@adminjs/sql'
import mysql from 'mysql2/promise'
import bcrypt from 'bcrypt'
import session from 'express-session'
import MySQLStoreFactory from 'express-mysql-session'
import { ValidationError } from 'adminjs'

dotenv.config()

AdminJS.registerAdapter({ Database, Resource })

const db = await new Adapter('mysql2', {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}).init()

const safeProps = {
    id: { isDisabled: true, isVisible: { list: true, edit: false, filter: true, show: true } },
    created_at: { isDisabled: true },
    updated_at: { isDisabled: true },
}

const readField = (req, key) =>
    req?.payload?.[key] ?? req?.payload?.record?.[key]

const writeField = (req, key, value) => {
    if (req?.payload) req.payload[key] = value
    if (req?.payload?.record) req.payload.record[key] = value
}

const deleteField = (req, key) => {
    if (req?.payload && key in req.payload) delete req.payload[key]
    if (req?.payload?.record && key in req.payload.record) delete req.payload.record[key]
}

function buildResourceOptions(resource) {
    const name = resource.tableName?.toLowerCase?.()
    if (name === 'users') {
        return {
            resource,
            options: {
                properties: {
                    ...safeProps,
                    password_hash: { isVisible: { list: false, edit: false, filter: false, show: false } },
                    newPassword: {
                        type: 'password',
                        isVisible: { list: false, edit: true, filter: false, show: false },
                        props: { placeholder: 'Enter the password (min. 6 symbols)' },
                    },
                    full_name: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    profile_picture: { isVisible: { list: false, edit: true, filter: false, show: true } },
                    email_verified: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    rating: { isDisabled: true },
                    role: {
                        availableValues: [
                            { value: 'user', label: 'user' },
                            { value: 'admin', label: 'admin' },
                        ],
                    },
                },
                actions: {
                    new: {
                        before: async (req) => {
                            const pwd = readField(req, 'newPassword')?.trim()
                            if (!pwd || pwd.length < 6) {
                                throw new ValidationError(
                                    { newPassword: { message: 'Password is required and must be at least 6 characters long.' } },
                                    { message: 'Incorrect data' }
                                )
                            }
                            writeField(req, 'password_hash', await bcrypt.hash(pwd, 10))
                            deleteField(req, 'newPassword')
                            return req
                        },
                    },
                    edit: {
                        before: async (req) => {
                            const pwd = readField(req, 'newPassword')?.trim()
                            if (pwd) {
                                if (pwd.length < 6) {
                                    throw new ValidationError(
                                        { newPassword: { message: 'Minimum 6 characters' } },
                                        { message: 'Incorrect data' }
                                    )
                                }
                                writeField(req, 'password_hash', await bcrypt.hash(pwd, 10))
                            }
                            deleteField(req, 'newPassword')
                            return req
                        },
                    },
                },
            },
        }
    }

    if (name === 'posts') {
        return {
            resource,
            options: {
                properties: {
                    ...safeProps,
                    publish_date: { isDisabled: true },
                    content: {
                        isVisible: { list: false, filter: false, show: true, edit: true },
                        type: 'string',
                        props: { rows: 10 },
                    },
                    status: {
                        availableValues: [
                            { value: 'active', label: 'active' },
                            { value: 'inactive', label: 'inactive' },
                        ]
                    },
                    locked_by_author: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    author_id: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    title: { isVisible: { list: true, edit: true, filter: true, show: true } },
                },
                editProperties: ['title', 'author_id', 'content', 'status', 'locked_by_author'],
                listProperties: ['id', 'title', 'author_id', 'status', 'locked_by_author', 'publish_date'],
                showProperties: ['id', 'title', 'author_id', 'content', 'status', 'locked_by_author', 'publish_date', 'updated_at'],
                filterProperties: ['title', 'author_id', 'status', 'locked_by_author', 'publish_date'],
                actions: {
                    edit: {
                        isAccessible: true,
                        before: async (req) => {
                            deleteField(req, 'content')
                            return req
                        },
                    },
                },
            },
        }
    }

    if (name === 'comments') {
        return {
            resource,
            options: {
                properties: {
                    ...safeProps,
                    publish_date: { isDisabled: true },
                    content: {
                        isVisible: { list: false, filter: false, show: true, edit: true },
                        type: 'string',
                        props: { rows: 8 },
                    },
                    status: {
                        availableValues: [
                            { value: 'active', label: 'active' },
                            { value: 'inactive', label: 'inactive' },
                        ]
                    },
                    locked: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    author_id: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    post_id: { isVisible: { list: true, edit: true, filter: true, show: true } },
                },
                editProperties: ['post_id', 'author_id', 'content', 'status', 'locked'],
                listProperties: ['id', 'post_id', 'author_id', 'status', 'locked', 'publish_date'],
                showProperties: ['id', 'post_id', 'author_id', 'content', 'status', 'locked', 'publish_date', 'updated_at'],
                filterProperties: ['post_id', 'author_id', 'status', 'locked', 'publish_date'],
                actions: {
                    edit: {
                        isAccessible: true,
                        before: async (req) => {
                            deleteField(req, 'content');
                            return req
                        },
                    },
                },
            },
        }
    }

    if (name === 'likes') {
        return {
            resource,
            options: {
                properties: {
                    id: { isDisabled: true },
                    publish_date: { isDisabled: true },
                    author_id: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    entity_id: { isVisible: { list: true, edit: true, filter: true, show: true } },
                    entity_type: {
                        availableValues: [
                            { value: 'post', label: 'post' },
                            { value: 'comment', label: 'comment' },
                        ]
                    },
                    type: {
                        availableValues: [
                            { value: 'like', label: 'like' },
                            { value: 'dislike', label: 'dislike' },
                        ]
                    },
                },
            },
        }
    }

    if (name === 'categories') {
        return {
            resource,
            options: {
                properties: {
                    ...safeProps,
                    title: { isTitle: true },
                    description: {},
                },
            },
        }
    }

    if (name === 'favorites' || name === 'post_categories' || name === 'user_tokens') {
        return { resource, options: { properties: { ...safeProps } } }
    }

    return { resource, options: { properties: { ...safeProps } } }
}

const resources = [
    db.table('users'),
    db.table('posts'),
    db.table('comments'),
    db.table('categories'),
    db.table('likes'),
    db.table('favorites'),
    db.table('post_categories'),
    db.table('user_tokens'),
].map(buildResourceOptions)

export const admin = new AdminJS({
    rootPath: '/admin',
    resources,
    branding: { companyName: 'USOF Admin', withMadeWithLove: false },
})

async function authenticate(emailOrLogin, password) {
    console.log('[ADMIN] authenticate called with:', emailOrLogin)
    let conn
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || 3306),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        })

        const [rows] = await conn.execute(
            `SELECT id, login, email, password_hash AS password, role
       FROM users
       WHERE email = ? OR login = ?
       LIMIT 1`,
            [emailOrLogin, emailOrLogin]
        )

        if (!rows.length) { console.log('[ADMIN] user not found'); return null }
        const user = rows[0]
        if (user.role !== 'admin') { console.log('[ADMIN] not admin'); return null }
        if (!user.password) { console.log('[ADMIN] empty hash'); return null }

        const ok = await bcrypt.compare(String(password), String(user.password))
        console.log('[ADMIN] compare result:', ok)
        return ok ? { email: user.email || user.login, role: 'admin', id: user.id } : null
    } catch (e) {
        console.error('[ADMIN] authenticate error:', e)
        return null
    } finally {
        if (conn) await conn.end()
    }
}

const MySQLStore = MySQLStoreFactory(session)
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: true,
})

export const router = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
        authenticate,
        cookieName: process.env.ADMIN_COOKIE_NAME || 'adminjs',
        cookiePassword: process.env.ADMIN_COOKIE_SECRET || 'verysecret',
    },
    null,
    {
        store: sessionStore,
        secret: process.env.ADMIN_COOKIE_SECRET || 'verysecret',
        resave: false,
        saveUninitialized: false,
        name: process.env.ADMIN_COOKIE_NAME || 'adminjs',
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    }
)
