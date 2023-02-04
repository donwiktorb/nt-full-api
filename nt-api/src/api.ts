import express, { Express, Request, Response } from 'express';
import dotenv from "dotenv"
import db from './db'
import { RowDataPacket } from 'mysql2';
dotenv.config()

const app: Express = express();
const port = process.env.PORT;

interface userData {
    username: string,
    password: string,
    hwid: string
}

interface cleanData {
    id: number,
    username: string,
    hwid: string | null
}

function getUser(data: userData) {
    return new Promise((resolve, reject) => {
        let query = `SELECT * FROM users WHERE username = ? AND password = ? AND (hwid = ? AND hwid IS NOT NULL or hwid IS NULL)`
        db.query(query, [
            data.username,
            data.password,
            data.hwid
        ], (err, res) => {
            if (err) reject(err)
            else {
                const row = (<RowDataPacket> res)[0]
                if (!row) return reject({})
                if (!row.hwid) {
                    let query2 = `UPDATE users SET hwid = ? WHERE id = ?`
                    db.query(query2, [
                        data.hwid,
                        row.id
                    ], (er, re) => {
                        if (er) reject(err)
                        else {
                            const clean: cleanData = {
                                id: row.id,
                                username: row.username,
                                hwid: data.hwid
                            }
                            resolve(clean)
                        }
                    })
                } else {
                    const clean: cleanData = {
                        id: row.id,
                        username: row.username,
                        hwid: row.hwid 
                    }
                    resolve(clean)
                }
            } 
        })
    })
}

app.get('/:action/:username/:password/:hwid', async (req: Request, res: Response) => {
    const {params} = req
    if (params) {
        const {action, username, password, hwid} = params
        if (action && username && password && hwid) {
            if (action === 'login') {
                await getUser({username, password, hwid}).then((result) => {
                    res.json(result)
                }).catch((e: PromiseRejectedResult) => {
                    console.log(e)
                    res.send("mysql query error")
                })
                // res.send(`${action} ${username} ${password} ${hwid}`)
            } else res.send("Erorr incrorect values")
        }
    }
})

app.listen(port, () => {
    console.log('on')
})